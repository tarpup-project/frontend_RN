import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { groupMessageKeys } from './useEnhancedGroupMessages';

/**
 * Hook for managing group message cache operations
 */
export const useGroupMessageCache = () => {
  const queryClient = useQueryClient();

  // Clear cache for a specific group
  const clearGroupCache = useCallback((groupId: string) => {
    console.log('🗑️ Clearing message cache for group:', groupId);
    queryClient.removeQueries({ queryKey: groupMessageKeys.detail(groupId) });
  }, [queryClient]);

  // Clear all group message caches
  const clearAllGroupCaches = useCallback(() => {
    console.log('🗑️ Clearing all group message caches');
    queryClient.removeQueries({ queryKey: groupMessageKeys.all });
  }, [queryClient]);

  // Refresh cache for a specific group
  const refreshGroupCache = useCallback((groupId: string) => {
    console.log('🔄 Refreshing message cache for group:', groupId);
    queryClient.invalidateQueries({ queryKey: groupMessageKeys.detail(groupId) });
  }, [queryClient]);

  // Get cached message count for a group
  const getCachedMessageCount = useCallback((groupId: string): number => {
    const cachedData = queryClient.getQueryData(groupMessageKeys.detail(groupId));
    return Array.isArray(cachedData) ? cachedData.length : 0;
  }, [queryClient]);

  // Check if group messages are cached
  const isGroupCached = useCallback((groupId: string): boolean => {
    const cachedData = queryClient.getQueryData(groupMessageKeys.detail(groupId));
    return Array.isArray(cachedData) && cachedData.length > 0;
  }, [queryClient]);

  // Prefetch messages for a group
  const prefetchGroupMessages = useCallback((groupId: string) => {
    console.log('⚡ Prefetching messages for group:', groupId);
    queryClient.prefetchQuery({
      queryKey: groupMessageKeys.detail(groupId),
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  }, [queryClient]);

  return {
    clearGroupCache,
    clearAllGroupCaches,
    refreshGroupCache,
    getCachedMessageCount,
    isGroupCached,
    prefetchGroupMessages,
  };
};