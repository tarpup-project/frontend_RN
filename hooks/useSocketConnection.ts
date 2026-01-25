import { useSocket } from '@/contexts/SocketProvider';
import { useCallback, useEffect, useState } from 'react';
import { useNetworkStatus } from './useNetworkStatus';

/**
 * Hook to monitor socket connection status and provide connection utilities
 */
export const useSocketConnection = () => {
  const { socket } = useSocket();
  const { isConnected: networkConnected } = useNetworkStatus();
  const [socketConnected, setSocketConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Monitor socket connection status
  useEffect(() => {
    if (!socket) {
      setSocketConnected(false);
      return;
    }

    const handleConnect = () => {
      console.log('✅ Socket connected');
      setSocketConnected(true);
      setIsReconnecting(false);
    };

    const handleDisconnect = () => {
      console.log('❌ Socket disconnected');
      setSocketConnected(false);
    };

    const handleReconnecting = () => {
      console.log('🔄 Socket reconnecting...');
      setIsReconnecting(true);
    };

    // Set initial state
    setSocketConnected(socket.connected);

    // Listen to socket events
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('reconnect_attempt', handleReconnecting);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('reconnect_attempt', handleReconnecting);
    };
  }, [socket]);

  // Force reconnection function
  const forceReconnect = useCallback(() => {
    if (socket && !socket.connected && networkConnected) {
      console.log('🔌 Forcing socket reconnection');
      socket.connect();
    }
  }, [socket, networkConnected]);

  // Connection status
  const connectionStatus = {
    isOnline: networkConnected && socketConnected,
    isNetworkConnected: networkConnected,
    isSocketConnected: socketConnected,
    isReconnecting,
    canReconnect: networkConnected && !socketConnected && !isReconnecting
  };

  return {
    ...connectionStatus,
    socket,
    forceReconnect
  };
};