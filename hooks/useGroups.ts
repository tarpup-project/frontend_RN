import { api } from '@/api/client';
import { UrlConstants } from '@/constants/apiUrls';
import { useAuthStore } from '@/state/authStore';
import { useNotificationStore } from '@/state/notificationStore';
import { useReadReceiptsStore } from '@/state/readReceiptsStore';
import { Group, GroupsResponse } from '@/types/groups';
import { isRetryableError } from '@/utils/errorUtils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { useCampus } from './useCampus';

export const groupsKeys = {
  all: ['groups'] as const,
  lists: () => [...groupsKeys.all, 'list'] as const,
  list: (campusId?: string) => [...groupsKeys.lists(), campusId] as const,
  details: () => [...groupsKeys.all, 'detail'] as const,
  detail: (id: string) => [...groupsKeys.details(), id] as const,
  messages: () => [...groupsKeys.all, 'messages'] as const,
  messageList: (groupId: string) => [...groupsKeys.messages(), groupId] as const,
  notifications: () => [...groupsKeys.all, 'notifications'] as const,
};

// Fetch global notification counts (like the web version)
const fetchGlobalNotifications = async (): Promise<{
  groupNotifications: number;
  personalNotifications: number;
  chatNotifications: number;
}> => {
  try {
    console.log('🔔 Fetching global notification counts...');

    const response = await api.get<{
      data: {
        groupNotifications: number;
        personalNotifications: number;
        chatNotifications: number;
      }
    }>(UrlConstants.allNotifications);

    if (response.data?.data) {
      console.log('✅ Global notifications fetched:', response.data.data);
      return response.data.data;
    }

    console.warn('⚠️ Invalid notifications response:', response.data);
    return {
      groupNotifications: 0,
      personalNotifications: 0,
      chatNotifications: 0,
    };
  } catch (error) {
    console.error('❌ Failed to fetch global notifications:', error);
    return {
      groupNotifications: 0,
      personalNotifications: 0,
      chatNotifications: 0,
    };
  }
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
        lastMessageAt: response.data.data[0].lastMessageAt,
        unread: response.data.data[0].unread
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
  const { setNotifications, activeGroupId } = useNotificationStore();
  const queryClient = useQueryClient();

  // Global notifications query (like the web version)
  const globalNotificationsQuery = useQuery({
    queryKey: groupsKeys.notifications(),
    queryFn: fetchGlobalNotifications,
    enabled: !!(isAuthenticated && isHydrated),
    staleTime: 1000 * 30, // 30 seconds (frequent updates for notifications)
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 50000, // Refresh every 30 seconds (like web version)
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 2,
  });

  // Sync global notifications with store when data changes
  useEffect(() => {
    if (globalNotificationsQuery.data) {
      const data = globalNotificationsQuery.data;
      // Update global notification store with fresh counts
      setNotifications({
        groupNotifications: data.groupNotifications,
        personalNotifications: data.personalNotifications,
        chatNotifications: data.chatNotifications,
      });
      console.log('🔔 Global notifications updated:', data);
    }
  }, [globalNotificationsQuery.data, setNotifications]);

  const query = useQuery<Group[], Error>({
    queryKey: groupsKeys.list(selectedUniversity?.id),
    queryFn: () => fetchGroups(selectedUniversity?.id),
    enabled: !!(isAuthenticated && isHydrated), // Only fetch when authenticated and hydrated
    staleTime: 1000 * 60 * 1, // Consider data stale after 1 minute (more frequent for unread counts)
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
    refetchInterval: 40000, // Refetch every 15 seconds (like web version)
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

        // Calculate total unread count from individual groups
        const totalUnread = data.reduce((sum, group) => sum + (group.unread || 0), 0);
        console.log('📊 Total unread from groups:', totalUnread);
      }
      return data;
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (groupId: string) => {
      console.log('📖 Marking group as read:', groupId);
      await api.post(UrlConstants.markGroupMessageAsRead(groupId));
    },
    onMutate: async (groupId) => {
      await queryClient.cancelQueries({ queryKey: groupsKeys.list(selectedUniversity?.id) });
      const previousGroups = queryClient.getQueryData<Group[]>(groupsKeys.list(selectedUniversity?.id));

      if (previousGroups) {
        // Find the group being marked as read
        const groupToUpdate = previousGroups.find(g => g.id === groupId);
        const unreadCount = groupToUpdate?.unread || 0;

        // Update the groups data optimistically
        queryClient.setQueryData<Group[]>(groupsKeys.list(selectedUniversity?.id), (old: Group[] | undefined) => {
          if (!old) return [];
          return old.map(group =>
            group.id === groupId ? { ...group, unread: 0 } : group
          );
        });

        // Update global notification count optimistically
        if (unreadCount > 0) {
          console.log(`📉 Reducing global group notifications by ${unreadCount}`);
          setNotifications({
            groupNotifications: Math.max(0, (globalNotificationsQuery.data?.groupNotifications || 0) - unreadCount)
          });
        }
      }
      return { previousGroups };
    },
    onError: (err, groupId, context) => {
      console.error('❌ Failed to mark group as read:', err);
      if (context?.previousGroups) {
        queryClient.setQueryData(groupsKeys.list(selectedUniversity?.id), context.previousGroups);
      }
      // Refetch global notifications to restore correct count
      globalNotificationsQuery.refetch();
    },
    onSettled: () => {
      // Refresh both groups and global notifications after marking as read
      queryClient.invalidateQueries({ queryKey: groupsKeys.list(selectedUniversity?.id) });
      globalNotificationsQuery.refetch();
    },
  });

  const markAsRead = (groupId: string) => {
    markAsReadMutation.mutate(groupId);
  };

  // Auto-mark as read when entering a group (like web version)
  useEffect(() => {
    if (activeGroupId && query.data) {
      const activeGroup = query.data.find(g => String(g.id) === String(activeGroupId));
      if (activeGroup && activeGroup.unread && activeGroup.unread > 0) {
        console.log(`👁️ User entered group ${activeGroupId} with ${activeGroup.unread} unread messages - auto-marking as read`);

        // Immediately reduce global notification count
        setNotifications({
          groupNotifications: Math.max(0, (globalNotificationsQuery.data?.groupNotifications || 0) - activeGroup.unread)
        });

        // Mark as read on server (will be handled by the mutation)
        markAsRead(activeGroupId);
      }
    }
  }, [activeGroupId, query.data]);

  const { lastReadTimestamps } = useReadReceiptsStore();

  // Transform groups to UI format (copied from useAsyncStorageGroups)
  const transformToUIFormat = (group: Group) => {
    // Get last read timestamp from store - reactive now due to hook usage above
    const lastReadTime = lastReadTimestamps[group.id] || 0;
    const currentUserId = user?.id;

    // Web-Parity Logic:
    // 1. Primary Source: Server's unread count (this is the authoritative source)
    let unreadCount = group.unread || 0;

    // Get the timestamp of the last activity in the group
    const lastMessageTimestamp = group.lastMessageAt
      ? new Date(group.lastMessageAt).getTime()
      : (group.createdAt ? new Date(group.createdAt).getTime() : 0);

    // 2. Client-side Override: Visited recently
    // If we have a local read timestamp that is newer than or equal to the last message,
    // then we consider the group read locally, overriding the server count.
    if (lastReadTime >= lastMessageTimestamp && lastMessageTimestamp > 0) {
      unreadCount = 0;
    }

    // 3. Client-side Override: Last message is mine
    // If the last message is from the current user, the count should be 0 
    // (We check this to give instant feedback when user sends a message)
    if (group.messages && group.messages.length > 0) {
      const lastMsg = group.messages[group.messages.length - 1];
      const isFromMe = (lastMsg.sender && lastMsg.sender.id === currentUserId) ||
        (lastMsg as any).senderId === currentUserId;

      if (isFromMe) {
        unreadCount = 0;
      }
    } else if (group.lastMessageAt && (group as any).lastMessageSenderId === currentUserId) {
      unreadCount = 0;
    }

    // 4. Active group override: If user is currently in this group, count should be 0
    if (String(activeGroupId || '') === String(group.id)) {
      unreadCount = 0;
    }

    // Safety check: ensure count is not negative
    unreadCount = Math.max(0, unreadCount);

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
    refresh: () => {
      // Refresh both groups and global notifications
      query.refetch();
      globalNotificationsQuery.refetch();
    },
    markAsRead,
    uiGroups: useMemo(() => (query.data || []).map(transformToUIFormat), [query.data, query.data?.length, lastReadTimestamps, activeGroupId]), // Re-calc when data OR timestamps OR active group changes
    query, // Expose original query object if needed
    globalNotifications: globalNotificationsQuery.data,
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