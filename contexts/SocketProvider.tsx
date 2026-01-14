import { api } from '@/api/client';
import { UrlConstants } from '@/constants/apiUrls';
import { asyncStorageDB } from '@/database';
import { useAuthStore } from '@/state/authStore';
import { useNotificationStore } from '@/state/notificationStore';
import { queryClient } from '@/utils/queryClient';
import { Group, GroupMessage, MessageType, UserMessage, AlertMessage } from '@/types/groups';
import { SocketEvents, SocketInterface, SocketState } from '@/types/socket';
import { groupsKeys } from '@/hooks/useGroups';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Socket Context
const SocketContext = createContext<SocketInterface | undefined>(undefined);

// Socket Provider Props
interface SocketProviderProps {
  children: ReactNode;
}

// Socket Provider Component
export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | undefined>();
  const [socketState, setSocketState] = useState<SocketState>({
    connected: false,
    reconnecting: false,
  });
  const { user } = useAuthStore();
  const { incrementNotification } = useNotificationStore();

  // Refresh user authentication if socket gets unauthorized
  const refreshUser = async () => {
    try {
      await api.get(UrlConstants.fetchAuthUser);
      // If successful, try to reconnect
      connectSocket();
    } catch (err) {
      console.error('Session expired, user needs to login again');
      setSocketState(prev => ({ 
        ...prev, 
        error: 'Session expired. Please login again.' 
      }));
    }
  };

  // Connect to socket
  const connectSocket = () => {
    if (socket?.connected) {
      return; // Already connected
    }

    const newSocket = io(UrlConstants.groupsRoute, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    // Connection events
    newSocket.on(SocketEvents.CONNECT, () => {
      console.log('✅ Socket connected');
      setSocketState({
        connected: true,
        reconnecting: false,
      });

      // Join personal room if user is logged in
      if (user?.id) {
        newSocket.emit(SocketEvents.JOIN_PERSONAL_ROOM, {
          roomID: user.id,
        });
      }
    });

    newSocket.on(SocketEvents.DISCONNECT, (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setSocketState(prev => ({
        ...prev,
        connected: false,
      }));
    });

    newSocket.on('reconnect_attempt', () => {
      console.log('🔄 Socket reconnecting...');
      setSocketState(prev => ({
        ...prev,
        reconnecting: true,
      }));
    });

    newSocket.on('reconnect', () => {
      console.log('✅ Socket reconnected');
      setSocketState({
        connected: true,
        reconnecting: false,
      });
    });

    newSocket.on(SocketEvents.ERROR, (data) => {
      console.error('❌ Socket error:', data);
      
      if (data.message === 'unauthorized') {
        refreshUser();
      } else {
        setSocketState(prev => ({
          ...prev,
          error: data.message || 'Socket connection error',
        }));
      }
    });

    newSocket.on(SocketEvents.GROUP_ROOM_MESSAGE, async (data) => {
      const incomingRoomId = String(
        data?.roomID ??
          data?.roomId ??
          data?.groupID ??
          data?.groupId ??
          data?.room ??
          data?.group ??
          ''
      );
      if (!incomingRoomId) return;

      const sender = data?.sender ?? data?.user ?? {};
      const createdAt = data?.createdAt || new Date().toISOString();
      const contentId =
        data?.content?.id ??
        data?.id ??
        `${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const contentMessage =
        data?.content?.message ?? data?.message ?? data?.text ?? '';
      const file = data?.file;
      const replyingTo = data?.replyingTo;
      const type =
        data?.messageType ??
        (sender?.id ? MessageType.USER : MessageType.ALERT);

      const base = {
        content: { id: contentId, message: contentMessage },
        createdAt,
      };

      const newMessage: GroupMessage =
        type === MessageType.USER
          ? ({
              messageType: MessageType.USER,
              ...base,
              sender: {
                id: sender?.id,
                fname: sender?.fname,
              },
              file,
              replyingTo: replyingTo as UserMessage,
            } as UserMessage)
          : ({
              messageType: MessageType.ALERT,
              ...base,
              sender: {
                id: sender?.id,
                fname: sender?.fname,
              },
            } as AlertMessage);

      queryClient.setQueryData<GroupMessage[]>(
        ['groups', 'messages', incomingRoomId],
        (oldMessages = []) => {
          const exists = oldMessages.find(
            (msg) => msg.content.id === newMessage.content.id
          );
          if (exists) return oldMessages;
          return [...oldMessages, newMessage];
        }
      );

      try {
        const senderId = sender?.id || data?.senderId || 'system';
        const senderName = sender?.fname || 'System';
        const messageText =
          contentMessage || (file?.data ? '📷 Image' : '');
        await asyncStorageDB.addMessage(incomingRoomId, {
          id: contentId,
          content: messageText,
          senderId,
          senderName,
          fileUrl: file?.data,
          fileType: file?.ext,
          createdAt: new Date(createdAt).getTime(),
        });
      } catch (e) {
        console.error('Failed to cache group message globally', e);
      }

      queryClient.setQueriesData<Group[]>(
        { queryKey: groupsKeys.lists() },
        (old) => {
          if (!old) return old as any;
          return old.map((group) => {
            if (String(group.id) !== String(incomingRoomId)) {
              return group;
            }
            const messages = Array.isArray(group.messages)
              ? [...group.messages]
              : [];
            const lastMessage = {
              id: contentId,
              content: contentMessage,
              sender: {
                id: sender?.id || '',
                fname: sender?.fname || 'Someone',
              },
            };
            const updatedMessages =
              messages.length > 0
                ? [...messages.slice(0, messages.length - 1), lastMessage]
                : [lastMessage];
            const isOwnMessage =
              sender?.id === user?.id || data?.senderId === user?.id;
            return {
              ...group,
              unread: isOwnMessage
                ? group.unread
                : (group.unread || 0) + 1,
              messages: updatedMessages,
              lastMessageAt: createdAt,
            };
          });
        }
      );

      if (sender?.id === user?.id || data?.senderId === user?.id) {
        return;
      }

      console.log('🔔 New message received via socket, updating badge');
      incrementNotification('group');
    });

    setSocket(newSocket);
  };

  // Disconnect socket
  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect();
      setSocket(undefined);
      setSocketState({
        connected: false,
        reconnecting: false,
      });
    }
  };

  // Initialize socket connection when user is authenticated
  useEffect(() => {
    if (user) {
      connectSocket();
    } else {
      disconnectSocket();
    }

    // Cleanup on unmount
    return () => {
      disconnectSocket();
    };
  }, [user?.id]);

  // Provide socket context
  const contextValue: SocketInterface = {
    socket,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

// Hook to use socket context
export const useSocket = (): SocketInterface => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

// Group-specific socket context for individual chat rooms
const GroupSocketContext = createContext<SocketInterface | undefined>(undefined);

interface GroupSocketProviderProps {
  children: ReactNode;
  groupId: string;
}

export const GroupSocketProvider: React.FC<GroupSocketProviderProps> = ({ 
  children, 
  groupId 
}) => {
  const [groupSocket, setGroupSocket] = useState<Socket | undefined>();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user || !groupId) return;

    const socket = io(UrlConstants.groupsRoute, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on(SocketEvents.CONNECT, () => {
      console.log(`✅ Connected to group ${groupId}`);
      
      // Join the specific group room
      socket.emit(SocketEvents.JOIN_GROUP_ROOM, {
        roomID: groupId,
        userID: user.id,
      });
    });

    socket.on(SocketEvents.ERROR, (data) => {
      console.error(`❌ Group socket error for ${groupId}:`, data);
    });

    setGroupSocket(socket);

    return () => {
      socket.disconnect();
      setGroupSocket(undefined);
    };
  }, [groupId, user?.id]);

  const contextValue: SocketInterface = {
    socket: groupSocket,
  };

  return (
    <GroupSocketContext.Provider value={contextValue}>
      {children}
    </GroupSocketContext.Provider>
  );
};

// Hook to use group socket
export const useGroupSocket = (): SocketInterface => {
  const context = useContext(GroupSocketContext);
  if (!context) {
    throw new Error('useGroupSocket must be used within a GroupSocketProvider');
  }
  return context;
};
