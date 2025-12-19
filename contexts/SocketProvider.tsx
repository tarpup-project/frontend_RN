import { api } from '@/api/client';
import { UrlConstants } from '@/constants/apiUrls';
import { useAuthStore } from '@/state/authStore';
import { SocketEvents, SocketInterface, SocketState } from '@/types/socket';
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
    
    const handleIncomingGroupMessage = (data: any) => {
      try {
        const roomID = String(
          data?.roomID ??
          data?.roomId ??
          data?.groupID ??
          data?.groupId ??
          ''
        );
        const sender = data?.sender ?? data?.user ?? {};
        const senderId = sender?.id ? String(sender.id) : '';
        const messageType = String(data?.messageType ?? '').toLowerCase();
        if (
          user?.id &&
          senderId &&
          senderId !== String(user.id) && // ignore self
          roomID &&
          messageType === 'user' // only count user messages
        ) {
          // increment per-group unread and tab badge
          import('@/state/notificationStore').then(({ useNotificationStore }) => {
            const { incrementGroupUnread } = useNotificationStore.getState();
            incrementGroupUnread(roomID, 1);
          });
        }
      } catch (e) {
        // ignore handler errors
      }
    };
    
    newSocket.on(SocketEvents.GROUP_ROOM_MESSAGE, handleIncomingGroupMessage as any);
    // also listen to possible alias event names for robustness
    const aliasEvents = [
      'groupRoomMessage',
      'messageGroupRoom',
      'group_message',
      'groupMessage',
      'newMessage',
      'message',
    ];
    aliasEvents.forEach(evt => newSocket.on(evt as any, handleIncomingGroupMessage as any));

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
