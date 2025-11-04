import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { UrlConstants } from '../constants/apiUrls';
import { useCampus } from './useCampus';
import { Group, GroupsResponse } from '../types/groups';

// Query Keys
export const groupsKeys = {
  all: ['groups'] as const,
  lists: () => [...groupsKeys.all, 'list'] as const,
  list: (campusId?: string) => [...groupsKeys.lists(), campusId] as const,
  details: () => [...groupsKeys.all, 'detail'] as const,
  detail: (id: string) => [...groupsKeys.details(), id] as const,
};

// Fetch Groups Function
const fetchGroups = async (campusId?: string): Promise<Group[]> => {
  const response = await api.get<GroupsResponse>(
    UrlConstants.fetchAllGroups(campusId)
  );
  return response.data.data;
};

// useGroups Hook
export const useGroups = () => {
  const { selectedCampus } = useCampus();
  
  return useQuery({
    queryKey: groupsKeys.list(selectedCampus?.id),
    queryFn: () => fetchGroups(selectedCampus?.id),
    enabled: !!selectedCampus?.id, // Only fetch when campus is selected
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 15, // Refetch every 15 seconds (like web app)
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Fetch Single Group Details
const fetchGroupDetails = async (groupId: string): Promise<Group> => {
  const response = await api.get<{ data: Group }>(
    UrlConstants.fetchInviteGroupDetails(groupId)
  );
  return response.data.data;
};

// useGroupDetails Hook
export const useGroupDetails = (groupId: string) => {
  return useQuery({
    queryKey: groupsKeys.detail(groupId),
    queryFn: () => fetchGroupDetails(groupId),
    enabled: !!groupId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 3,
  });
};

// Mark Group Messages as Read
const markGroupAsRead = async (groupId: string): Promise<void> => {
  await api.post(UrlConstants.markGroupMessageAsRead(groupId));
};

// Leave Group
const leaveGroup = async (groupId: string): Promise<void> => {
  await api.post(UrlConstants.leaveGroup, { groupID: groupId });
};

// Join Group
const joinGroup = async (groupId: string): Promise<void> => {
  await api.post(UrlConstants.fetchInviteGroupDetails(groupId), {});
};

// Custom mutations for group actions
export const useGroupActions = () => {
  return {
    markAsRead: markGroupAsRead,
    leaveGroup: leaveGroup,
    joinGroup: joinGroup,
  };
};

// Transform group data for UI
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
    rawGroup: group, // Keep original data for detailed operations
  };
};

// Utility Functions
const getTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMs = now.getTime() - date.getTime();
  
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hours ago`;
  } else {
    return `${diffInDays} days ago`;
  }
};

const getCategoryIcon = (iconName?: string): keyof typeof import('@expo/vector-icons/Ionicons')['glyphMap'] => {
  const iconMap: Record<string, keyof typeof import('@expo/vector-icons/Ionicons')['glyphMap']> = {
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