import { api } from '@/api/client';
import { UrlConstants } from '@/constants/apiUrls';
import { useAuthStore } from '@/state/authStore';
import { Group, GroupsResponse } from '@/types/groups';
import { isRetryableError } from '@/utils/errorUtils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useCampus } from './useCampus';

export const groupsKeys = {
  all: ['groups'] as const,
  lists: () => [...groupsKeys.all, 'list'] as const,
  list: (campusId?: string) => [...groupsKeys.lists(), campusId] as const,
  details: () => [...groupsKeys.all, 'detail'] as const,
  detail: (id: string) => [...groupsKeys.details(), id] as const,
  messages: () => [...groupsKeys.all, 'messages'] as const,
  messageList: (groupId: string) => [...groupsKeys.messages(), groupId] as const,
};

const fetchGroups = async (campusId?: string): Promise<Group[]> => {
  try {
    console.log('🔄 Fetching groups for campus:', campusId || 'all');

    const response = await api.get<GroupsResponse>(
      UrlConstants.fetchAllGroups(campusId)
    );

    if (!response.data || !response.data.data) {
      console.warn('⚠️ Invalid response structure:', response.data);
      return [];
    }

    console.log('✅ Groups fetched successfully:', response.data.data.length);

    // Debug log to check message structure
    if (response.data.data.length > 0) {
      console.log('📨 Sample group with messages:', JSON.stringify({
        id: response.data.data[0].id,
        name: response.data.data[0].name,
        messages: response.data.data[0].messages,
        lastMessageAt: response.data.data[0].lastMessageAt
      }, null, 2));
    }

    return response.data.data;
  } catch (error: any) {
    console.error('❌ Fetch groups error:', error);

    // Use the error utility for consistent logging
    const { logError } = await import('@/utils/errorUtils');
    logError('Fetch groups', error);

    // Re-throw to let React Query handle retries
    throw error;
  }
};

export const useGroups = () => {
  const { selectedUniversity } = useCampus();
  const { isAuthenticated, isHydrated } = useAuthStore();
  const queryClient = useQueryClient();

  const query = useQuery<Group[], Error>({
    queryKey: groupsKeys.list(selectedUniversity?.id),
    queryFn: () => fetchGroups(selectedUniversity?.id),
    enabled: !!(isAuthenticated && isHydrated), // Only fetch when authenticated and hydrated
    staleTime: 1000 * 60 * 2, // Consider data stale after 2 minutes
    gcTime: 1000 * 60 * 60, // Keep in cache for 1 hour
    retry: (failureCount, error: any) => {

      if (!isRetryableError(error)) {
        console.log('🚫 Non-retryable error - stopping retries');
        return false;
      }

      // Retry up to 3 times for retryable errors
      if (failureCount < 3) {
        console.log(`🔄 Retry attempt ${failureCount + 1}/3`);
        return true;
      }

      return false;
    },
    retryDelay: (attemptIndex) => {
      const delay = Math.min(1000 * 2 ** attemptIndex, 10000); // Max 10 seconds
      console.log(`⏱️ Retrying in ${delay}ms`);
      return delay;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchIntervalInBackground: false, // Don't refetch in background
    refetchOnWindowFocus: true, // Refetch when app comes back to focus
    refetchOnReconnect: true, // Refetch when network reconnects
    // Return stale data while refetching
    // refetchOnMount: 'always', // REMOVED to prevent continuous loading
    // Keep previous data while loading new data (eliminates loading states)
    placeholderData: (previousData) => {
      if (previousData && previousData.length > 0) {
        console.log('⚡ Using cached groups data -', previousData.length, 'groups loaded from TanStack Query cache');
      }
      return previousData;
    },
    // Show cached data even when there's an error
    select: (data) => {
      if (data && data.length > 0) {
        console.log('✅ Fresh groups data loaded -', data.length, 'groups');
      }
      return data;
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (groupId: string) => {
      await api.post(UrlConstants.markGroupMessageAsRead(groupId));
    },
    onMutate: async (groupId) => {
      await queryClient.cancelQueries({ queryKey: groupsKeys.list(selectedUniversity?.id) });
      const previousGroups = queryClient.getQueryData<Group[]>(groupsKeys.list(selectedUniversity?.id));

      if (previousGroups) {
        queryClient.setQueryData<Group[]>(groupsKeys.list(selectedUniversity?.id), (old: Group[] | undefined) => {
          if (!old) return [];
          return old.map(group =>
            group.id === groupId ? { ...group, unread: 0 } : group
          );
        });
      }
      return { previousGroups };
    },
    onError: (err, groupId, context) => {
      if (context?.previousGroups) {
        queryClient.setQueryData(groupsKeys.list(selectedUniversity?.id), context.previousGroups);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: groupsKeys.list(selectedUniversity?.id) });
    },
  });

  const markAsRead = (groupId: string) => {
    markAsReadMutation.mutate(groupId);
  };

  // Transform groups to UI format (copied from useAsyncStorageGroups)
  const transformToUIFormat = (group: Group) => {
    const getTimeAgo = (timestamp: number | string): string => {
      const time = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
      const now = Date.now();
      const diff = now - time;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (days > 0) return `${days}d ago`;
      if (hours > 0) return `${hours}h ago`;
      if (minutes > 0) return `${minutes}m ago`;
      return 'Just now';
    };

    const getCategoryIconName = (categoryIcon?: string): string => {
      const iconMap: Record<string, string> = {
        'gift': 'gift-outline',
        'car': 'car-outline',
        'book': 'book-outline',
        'home': 'home-outline',
        'basketball': 'basketball-outline',
        'calendar': 'calendar-outline',
        'musical-notes': 'musical-notes-outline',
        'heart': 'heart-outline',
        'cart': 'cart-outline',
        'shopping-cart': 'cart-outline',
        'games': 'game-controller-outline',
        'gamepad': 'game-controller-outline',
      };

      return iconMap[categoryIcon || ''] || 'pricetag-outline';
    };

    // Handle different data structures (server response vs internal model)
    const categoryName = group.category?.[0]?.name || 'General';
    const categoryIcon = group.category?.[0]?.icon;
    const lastMessageTime = group.lastMessageAt || group.createdAt;

    return {
      id: group.id,
      serverId: group.id,
      category: categoryName,
      title: group.name,
      description: group.description,
      members: group.members?.length || 0,
      unreadCount: group.unread || 0,
      matchPercentage: `${group.score || 0}%`,
      activeTime: lastMessageTime
        ? `Active ${getTimeAgo(lastMessageTime)}`
        : `Created ${getTimeAgo(group.createdAt)}`,
      categoryIcon: getCategoryIconName(categoryIcon),
      rawGroup: group,
    };
  };

  return {
    groups: query.data || [],
    isLoading: query.isLoading && !query.data, // Only show loading if no cached data
    error: query.error && !query.data ? (query.error as Error).message : null, // Only show error if no cached data
    isRefreshing: query.isRefetching,
    refresh: query.refetch,
    markAsRead,
    uiGroups: useMemo(() => (query.data || []).map(transformToUIFormat), [query.data]),
    query, // Expose original query object if needed
    // Additional cache info
    isCached: !!query.data && query.isStale,
    hasData: !!(query.data && query.data.length > 0),
  };
};

const fetchGroupDetails = async (groupId: string): Promise<Group> => {
  try {
    const response = await api.get<{ data: Group }>(
      UrlConstants.fetchInviteGroupDetails(groupId)
    );

    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const useGroupDetails = (groupId: string) => {
  return useQuery<Group, Error>({
    queryKey: groupsKeys.detail(groupId),
    queryFn: () => fetchGroupDetails(groupId),
    enabled: !!groupId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 3,
    placeholderData: (previousData) => previousData,
  });
};

const markGroupAsRead = async (groupId: string): Promise<void> => {
  await api.post(UrlConstants.markGroupMessageAsRead(groupId));
};
