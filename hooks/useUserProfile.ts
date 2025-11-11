import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { UrlConstants } from '@/constants/apiUrls';

interface UserProfile {
  id: string;
  fname: string;
  lname: string;
  email: string;
  bgUrl?: string;
  universityID: string;
  stateID: string;
  university?: {
    id: string;
    name: string;
  };
  memberSince: string;
}

const fetchUserProfile = async (userId: string): Promise<UserProfile> => {
  const response = await api.get(UrlConstants.fetchUserProfile(userId));
  return response.data.data;
};

export const useUserProfile = (userId: string) => {
  return useQuery({
    queryKey: ['userProfile', userId],
    queryFn: () => fetchUserProfile(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 3,
  });
};