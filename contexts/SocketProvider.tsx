import { api } from '@/api/client';
import { UrlConstants } from '@/constants/apiUrls';
import { asyncStorageDB } from '@/database';
import { useGlobalMessageSync } from '@/hooks/useGlobalMessageSync';
import { groupsKeys } from '@/hooks/useGroups';
import { useAuthStore } from '@/state/authStore';
import { useNotificationStore } from '@/state/notificationStore';
import { AlertMessage, Group, GroupMessage, MessageType, UserMessage } from '@/types/groups';
import { SocketEvents, SocketInterface, SocketState } from '@/types/socket';
import { queryClient } from '@/utils/queryClient';
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
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
  const { incrementNotification, activeGroupId } = useNotificationStore();
  const [connectedAt, setConnectedAt] = useState<number | null>(null);

  // Custom hook for global message sync
  const { syncAllMessages } = useGlobalMessageSync();

  // Batching buffer
  const messageBuffer = useRef<any[]>([]);
  const flushTimeout = useRef<any>(null);

  const processMessageBatch = useCallback(() => {
    const messages = [...messageBuffer.current];
    if (messages.length === 0) return;

    messageBuffer.current = []; // Clear buffer immediately
    flushTimeout.current = null;

    const { user } = useAuthStore.getState();
    const { activeGroupId, incrementNotification } = useNotificationStore.getState();
    const messagesByRoom: Record<string, GroupMessage[]> = {};
    const rawDataByRoom: Record<string, any[]> = {};

    console.log(`📦 Processing batch of ${messages.length} messages`);

    messages.forEach(data => {
      const incomingRoomId = String(
        data?.roomID ?? data?.roomId ?? data?.groupID ?? data?.groupId ?? data?.room ?? data?.group ?? ''
      );
      if (!incomingRoomId) return;

      if (!messagesByRoom[incomingRoomId]) {
        messagesByRoom[incomingRoomId] = [];
        rawDataByRoom[incomingRoomId] = [];
      }

      rawDataByRoom[incomingRoomId].push(data);

      const sender = data?.sender ?? data?.user ?? {};
      const createdAt = data?.createdAt || new Date().toISOString();
      const contentId = data?.content?.id ?? data?.id ?? `${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const contentMessage = data?.content?.message ?? data?.message ?? data?.text ?? '';
      const file = data?.file;
      const replyingTo = data?.replyingTo;
      const type = data?.messageType ?? (sender?.id ? MessageType.USER : MessageType.ALERT);

      const base = {
        content: { id: contentId, message: contentMessage },
        createdAt,
      };

      const newMessage: GroupMessage = type === MessageType.USER
        ? ({
          messageType: MessageType.USER,
          ...base,
          sender: { id: sender?.id, fname: sender?.fname },
          file,
          replyingTo: replyingTo as UserMessage,
        } as UserMessage)
        : ({
          messageType: MessageType.ALERT,
          ...base,
          sender: { id: sender?.id, fname: sender?.fname },
        } as AlertMessage);

      messagesByRoom[incomingRoomId].push(newMessage);

      // Async Cache
      try {
        const senderId = sender?.id || data?.senderId || 'system';
        const senderName = sender?.fname || 'System';
        const messageText = contentMessage || (file?.data ? '📷 Image' : '');
        asyncStorageDB.addMessage(incomingRoomId, {
          id: contentId,
          content: messageText,
          senderId,
          senderName,
          fileUrl: file?.data,
          fileType: file?.ext,
          createdAt: new Date(createdAt).getTime(),
        }).catch(e => console.error('Failed to cache group message globally', e));
      } catch (e) { console.error('Error preparing cache write', e); }
    });

    // 1. Bulk update Open Chat Messages
    Object.entries(messagesByRoom).forEach(([roomId, newMsgs]) => {
      queryClient.setQueryData<GroupMessage[]>(['groups', 'messages', roomId], (oldMessages = []) => {
        // Filter out duplicates just in case
        const uniqueNew = newMsgs.filter(n => !oldMessages.find(o => o.content.id === n.content.id));
        if (uniqueNew.length === 0) return oldMessages;
        return [...oldMessages, ...uniqueNew];
      });
    });

    // 2. Bulk update Group Lists (Inbox/Home)
    queryClient.setQueriesData<Group[]>({ queryKey: groupsKeys.lists() }, (old) => {
      if (!old) return old as any;
      return old.map((group) => {
        const newMsgsForGroup = messagesByRoom[String(group.id)];

        if (!newMsgsForGroup || newMsgsForGroup.length === 0) {
          return group;
        }

        // We have new messages for this group
        const lastMsgObj = newMsgsForGroup[newMsgsForGroup.length - 1]; // Take the last one
        const isActiveGroup = String(activeGroupId || '') === String(group.id);

        // Count unread: valid user messages not from me
        let unreadIncrement = 0;
        if (!isActiveGroup) {
          newMsgsForGroup.forEach(m => {
            if (m.messageType === MessageType.USER && (m as UserMessage).sender?.id !== user?.id) {
              unreadIncrement++;
            }
          });
        }

        // Update messages array - keep it bounded if needed
        const messages = Array.isArray(group.messages) ? [...group.messages] : [];
        const updatedMessages = [...messages, ...newMsgsForGroup.map(m => ({
          id: m.content.id,
          content: m.content.message,
          sender: m.sender,
          createdAt: m.createdAt,
          fileUrl: (m as any).file?.data
        }))].slice(-20); // Keep only last 20 for list view to save memory

        return {
          ...group,
          unread: (group.unread || 0) + unreadIncrement,
          messages: updatedMessages,
          lastMessageAt: lastMsgObj.createdAt,
        };
      });
    });

    // 3. Notifications and Mark Read
    Object.entries(rawDataByRoom).forEach(([roomId, rawDataList]) => {
      const isActiveGroup = String(activeGroupId || '') === String(roomId);

      rawDataList.forEach(data => {
        const senderId = data?.sender?.id || data?.senderId;
        const isMe = senderId === user?.id;

        if (isMe) return;

        if (!isActiveGroup) {
          incrementNotification('group');
        } else {
          // Mark read if active
          api.post(UrlConstants.markGroupMessageAsRead(roomId)).catch(e => console.error('Mark read failed', e));
        }
      });
    });

  }, [queryClient, syncAllMessages]);

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
      setConnectedAt(Date.now());
      setSocketState({
        connected: true,
        reconnecting: false,
      });

      // Join personal room if user is logged in
      if (user?.id) {
        newSocket.emit(SocketEvents.JOIN_PERSONAL_ROOM, {
          roomID: user.id,
        });

        // Trigger global message sync on connection
        syncAllMessages();
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

    newSocket.on(SocketEvents.GROUP_ROOM_MESSAGE, (data) => {
      messageBuffer.current.push(data);
      if (!flushTimeout.current) {
        // Buffer for 250ms to catch bursts (e.g. reconnection)
        flushTimeout.current = setTimeout(processMessageBatch, 250);
      }
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

    // CRITICAL FIX: handle app state changes to force reconnection
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && user) {
        console.log('📱 App came to foreground, forcing socket reconnection...');

        // If socket exists but disconnected, connect manually to bypass backoff
        if (socket && !socket.connected) {
          console.log('🔌 Socket disconnected, calling connect()');
          socket.connect();
        } else if (!socket) {
          // If no socket instance, create one
          console.log('🔌 No socket instance, creating new connection');
          connectSocket();
        }

        // Trigger global message sync when returning to app
        syncAllMessages();
      }
    });

    // Cleanup on unmount
    return () => {
      subscription.remove();
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
