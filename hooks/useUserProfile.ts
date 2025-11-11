import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { UrlConstants } from '@/constants/apiUrls';

interface UserProfile {
  userDetails: {
    id: string;
    fname: string;
    lname: string;
    email: string;
    bgUrl?: string;
    bio?: string;
    universityID: string;
    stateID: string;
    university?: {
      id: string;
      name: string;
    };
    createdAt: string;
  };
  stats: {
    totalMatches: number;
    totalGroups: number;
    avgComp: number;
    interests: string[];
  };
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
    staleTime: 1000 * 60 * 5,
    retry: 3,
  });
};