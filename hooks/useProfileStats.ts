import { api } from '@/api/client';
import { UrlConstants } from '@/constants/apiUrls';
import { useQuery } from '@tanstack/react-query';

interface ProfileStats {
  prompts: number;
  posts: number;
  followers: number;
  followings: number;
  totalMatches: number;
  activeGroups: number;
  avgCompatibility: number;
  interests: string[];
}

export const useProfileStats = () => {
  const query = useQuery<ProfileStats>({
    queryKey: ['profile-stats'],
    queryFn: async () => {
      console.log('Fetching profile stats...');
      const response = await api.get(UrlConstants.getUserStats);

      if (response.data.status === 'success') {
        const apiData = response.data.data;
        return {
          prompts: apiData.prompts || 0,
          posts: apiData.posts || 0,
          followers: apiData.followers || 0,
          followings: apiData.followings || 0,
          totalMatches: apiData.totalMatches || 0,
          activeGroups: apiData.activeGroups || 0,
          avgCompatibility: apiData.avgCompatibility || 0,
          interests: apiData.interests || [],
        };
      }
      throw new Error('API returned unsuccessful status');
    },
    staleTime: 1000 * 60 * 5, // Data remains fresh for 5 minutes
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
    retry: 2,
    refetchOnWindowFocus: true,
  });

  return {
    stats: query.data || null,
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    lastUpdated: query.dataUpdatedAt ? new Date(query.dataUpdatedAt) : null,
    refresh: query.refetch,
  };
};