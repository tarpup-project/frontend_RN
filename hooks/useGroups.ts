import { api } from '@/api/client';
import { UrlConstants } from '@/constants/apiUrls';
import { useAuthStore } from '@/state/authStore';
import { Group, GroupsResponse } from '@/types/groups';
import { subscribeToAllUserGroups, subscribeToGroupTopic, unsubscribeFromGroupTopic } from '@/utils/topicManager';
import { useQuery } from '@tanstack/react-query';
import moment from "moment";
import { useEffect } from 'react';
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
    return response.data.data;
  } catch (error: any) {
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
  
  const query = useQuery({
    queryKey: groupsKeys.list(selectedUniversity?.id),
    queryFn: () => fetchGroups(selectedUniversity?.id),
    enabled: isAuthenticated && isHydrated, // Only fetch when authenticated and hydrated
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
    retry: async (failureCount, error: any) => {
      // Use the error utility to determine if we should retry
      const { isRetryableError } = await import('@/utils/errorUtils');
      
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
    refetchInterval: 30000, // Reduced from 5 seconds to 30 seconds
    refetchIntervalInBackground: false, // Don't refetch in background
    refetchOnWindowFocus: true, // Refetch when app comes back to focus
    refetchOnReconnect: true, // Refetch when network reconnects
    // Return stale data while refetching
    refetchOnMount: 'always',
    // Keep previous data while loading new data
    placeholderData: (previousData) => previousData,
  });

  useEffect(() => {
    if (isAuthenticated && query.data?.length) {
      subscribeToAllUserGroups(query.data.map(g => g.id));
    }
  }, [query.data, isAuthenticated]);

  return query;
};


const fetchGroupDetails = async (groupId: string): Promise<Group> => {
  const response = await api.get<{ data: Group }>(
    UrlConstants.fetchGroupDetails(groupId) 
  );
  return response.data.data;
};



export const useGroupDetails = (groupId: string) => {
  return useQuery({
    queryKey: groupsKeys.detail(groupId),
    queryFn: () => fetchGroupDetails(groupId),
    enabled: !!groupId,
    staleTime: 1000 * 60 * 2,
    retry: 3,
  });
};

const markGroupAsRead = async (groupId: string): Promise<void> => {
  await api.post(UrlConstants.markGroupMessageAsRead(groupId));
};

const leaveGroup = async (groupId: string): Promise<void> => {
  await api.post(UrlConstants.leaveGroup, { groupID: groupId });
};

const joinGroup = async (groupId: string): Promise<void> => {
  await api.post(UrlConstants.fetchInviteGroupDetails(groupId), {});
};

export const useGroupActions = () => {
  return {
    markAsRead: markGroupAsRead,
    leaveGroup: async (groupId: string) => {
      await leaveGroup(groupId);
      await unsubscribeFromGroupTopic(groupId);
    },
    joinGroup: async (groupId: string) => {
      await joinGroup(groupId);
      await subscribeToGroupTopic(groupId);
    },
  };
};

export const transformGroupForUI = (group: Group) => {
  return {
    id: group.id,
    category: group.category[0]?.name || 'General',
    title: group.name,
    description: group.description,
    members: group.members.length,
    unreadCount: group.unread,
    matchPercentage: `${group.score}%`,
    activeTime: group.lastMessageAt 
      ? `Active ${getTimeAgo(group.lastMessageAt)}`
      : `Created ${getTimeAgo(group.createdAt)}`,
    avatarColors: group.members.slice(0, 4).map((_, index) => {
      const colors = ["#FF6B9D", "#4A90E2", "#9C27B0", "#00D084"];
      return colors[index % colors.length];
    }),
    categoryIcon: getCategoryIcon(group.category[0]?.icon),
    rawGroup: group,
  };
};

const getTimeAgo = (dateString: string): string => {
  return moment(dateString).fromNow();
};


const getCategoryIcon = (iconName?: string): string => {
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
  };
  
  return iconMap[iconName || ''] || 'pricetag-outline';
};

export { getTimeAgo };

