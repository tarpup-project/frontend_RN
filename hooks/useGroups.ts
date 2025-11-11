import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { UrlConstants } from '@/constants/apiUrls';
import { useCampus } from './useCampus';
import { Group, GroupsResponse } from '@/types/groups';

export const groupsKeys = {
  all: ['groups'] as const,
  lists: () => [...groupsKeys.all, 'list'] as const,
  list: (campusId?: string) => [...groupsKeys.lists(), campusId] as const,
  details: () => [...groupsKeys.all, 'detail'] as const,
  detail: (id: string) => [...groupsKeys.details(), id] as const,
};

const fetchGroups = async (campusId?: string): Promise<Group[]> => {
  const response = await api.get<GroupsResponse>(
    UrlConstants.fetchAllGroups(campusId)
  );
  return response.data.data;
};

export const useGroups = () => {
  const { selectedUniversity } = useCampus();
  
  return useQuery({
    queryKey: groupsKeys.list(selectedUniversity?.id),
    queryFn: () => fetchGroups(selectedUniversity?.id),
    enabled: true,
    staleTime: 1000 * 60 * 5,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
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
    leaveGroup: leaveGroup,
    joinGroup: joinGroup,
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