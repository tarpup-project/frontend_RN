import { useNotificationStore } from '@/state/notificationStore';
import { useCallback } from 'react';

/**
 * Hook for managing unread message counters
 */
export const useUnreadCounter = () => {
  const { activeGroupId } = useNotificationStore();

  /**
   * Check if a group is currently active (user is viewing it)
   */
  const isGroupActive = useCallback((groupId: string): boolean => {
    return String(activeGroupId || '') === String(groupId);
  }, [activeGroupId]);

  /**
   * Check if a message should be counted as unread
   */
  const shouldCountAsUnread = useCallback((
    messageGroupId: string,
    senderId: string,
    currentUserId: string,
    isUserMessage: boolean = true
  ): boolean => {
    // Don't count system messages
    if (!isUserMessage) return false;
    
    // Don't count own messages
    if (senderId === currentUserId) return false;
    
    // Don't count if user is currently in the group
    if (isGroupActive(messageGroupId)) return false;
    
    // This is an unseen message from another user
    return true;
  }, [isGroupActive]);

  /**
   * Get debug info about unread counting
   */
  const getUnreadDebugInfo = useCallback(() => {
    return {
      activeGroupId,
      timestamp: new Date().toISOString()
    };
  }, [activeGroupId]);

  return {
    isGroupActive,
    shouldCountAsUnread,
    getUnreadDebugInfo,
    activeGroupId
  };
};