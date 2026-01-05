import { api } from '@/api/client';
import { UrlConstants } from '@/constants/apiUrls';
import { useCallback, useEffect, useState } from 'react';

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
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch stats from the /user/stats endpoint
      const response = await api.get(UrlConstants.getUserStats);
      
      if (response.data.status === 'success') {
        const apiData = response.data.data;
        
        // Map API response to our interface
        const stats: ProfileStats = {
          prompts: apiData.prompts || 0,
          posts: apiData.posts || 0,
          followers: apiData.followers || 0,
          followings: apiData.followings || 0,
          totalMatches: apiData.totalMatches || 0,
          activeGroups: apiData.activeGroups || 0,
          avgCompatibility: apiData.avgCompatibility || 0,
          interests: apiData.interests || [],
        };
        
        setStats(stats);
        setLastUpdated(new Date());
      } else {
        throw new Error('API returned unsuccessful status');
      }
    } catch (err: any) {
      // Fallback to default values if API fails
      const fallbackStats: ProfileStats = {
        prompts: 14,
        posts: 11,
        followers: 3,
        followings: 2,
        totalMatches: 19,
        activeGroups: 44,
        avgCompatibility: 88,
        interests: ['market'],
      };
      
      setStats(fallbackStats);
      setError(err?.message || 'Failed to fetch stats, using fallback data');
      console.error('Error fetching profile stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    lastUpdated,
    refresh,
  };
};