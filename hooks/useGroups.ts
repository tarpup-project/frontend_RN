import { api } from '@/api/client';
import { UrlConstants } from '@/constants/apiUrls';
import { useAuthStore } from '@/state/authStore';
import { useReadReceiptsStore } from '@/state/readReceiptsStore';
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
  const { isAuthenticated, isHydrated, user } = useAuthStore();
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
    // Get last read timestamp from store
    const { getLastRead } = useReadReceiptsStore.getState();
    const lastReadTime = getLastRead(group.id);
    const currentUserId = user?.id;

    // Calculate unread count client-side if we have a local read timestamp
    // OR if we want to enforce client-side logic always.
    // However, for fresh state/first load where lastReadTime might be 0, we might default to existing behavior
    // but the requirement is "only count unseen messages... and not count my own".

    let unreadCount = 0;

    // If we have messages, we can calculate precisely
    if (group.messages && Array.isArray(group.messages)) {
      unreadCount = group.messages.filter(msg => {
        // Must be a message object
        if (!msg) return false;

        // Check if message is from current user
        const isFromMe = (msg.sender && msg.sender.id === currentUserId) ||
          (msg as any).senderId === currentUserId;

        if (isFromMe) return false;

        // Check if message is newer than last read time
        // Handle various timestamp formats if needed, but assuming ISO string or number
        const msgTime = (msg as any).createdAt
          ? new Date((msg as any).createdAt).getTime()
          : 0;

        return msgTime > lastReadTime;
      }).length;

      // If we don't have a local timestamp yet (first install/fresh), and unreadCount calculated is 0 
      // but server says we have unread, we might want to trust server?
      // BUT user specifically asked for "messages that entered when i was not in the group", 
      // implying a strict local "seen" state. 
      // If lastReadTime is 0 (never opened), then ALL messages not from me are unread.

    } else {
      // Fallback if no messages array (shouldn't happen with correct data fetching)
      unreadCount = group.unread || 0;
    }

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
        'bed': 'bed-outline', // Added bed outline for roommates
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
      unreadCount: unreadCount, // Use our calculated count
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
    uiGroups: useMemo(() => (query.data || []).map(transformToUIFormat), [query.data, query.data?.length]), // Re-calc when data changes
    query, // Expose original query object if needed
    // Additional cache info
    isCached: !!query.data && query.isStale,
    hasData: !!(query.data && query.data.length > 0),
  };
};

const fetchGroupDetails = async (groupId: string): Promise<Group> => {
  try {
    console.log('🔍 Fetching details for group:', groupId);
    // Try the main details endpoint first (likely for members)
    const response = await api.get<{ data: Group }>(
      UrlConstants.fetchGroupDetails(groupId)
    );

    if (response.data?.data) {
      console.log('✅ Group details fetched successfully');
      return response.data.data;
    }

    // If that fails or returns empty, maybe try the invite endpoint? 
    // For now, let's just return what we have or throw
    console.warn('⚠️ Group details response empty:', response.data);
    throw new Error('Group details empty');
  } catch (error) {
    console.error('❌ Failed to fetch group details:', error);
    // Fallback: If the main endpoint fails (e.g. 403 because not member?), try invite details
    // This allows non-members to see basic info
    try {
      console.log('🔄 Trying invite details fallback:', groupId);
      const fallbackResponse = await api.get<{ data: Group }>(
        UrlConstants.fetchInviteGroupDetails(groupId)
      );
      return fallbackResponse.data.data;
    } catch (fallbackError) {
      console.error('❌ Fallback fetch also failed:', fallbackError);
      throw error;
    }
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
