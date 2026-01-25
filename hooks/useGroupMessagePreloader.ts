import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { groupMessageKeys } from './useEnhancedGroupMessages';

/**
 * Hook to preload group messages in the background
 * This ensures messages are cached before user enters the chat
 */
export const useGroupMessagePreloader = (groupIds: string[]) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Preload messages for multiple groups in the background
    groupIds.forEach(groupId => {
      if (groupId) {
        // Prefetch messages if not already cached
        queryClient.prefetchQuery({
          queryKey: groupMessageKeys.detail(groupId),
          staleTime: 1000 * 60 * 5, // 5 minutes
        });
      }
    });
  }, [groupIds, queryClient]);
};

/**
 * Hook to preload a single group's messages
 */
export const useGroupMessagePreload = (groupId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (groupId) {
      console.log('🔄 Preloading messages for group:', groupId);
      queryClient.prefetchQuery({
        queryKey: groupMessageKeys.detail(groupId),
        staleTime: 1000 * 60 * 5, // 5 minutes
      });
    }
  }, [groupId, queryClient]);
};