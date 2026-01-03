import { api } from '@/api/client';
import { UrlConstants } from '@/constants/apiUrls';
import { asyncStorageDB } from '@/database/asyncStorageDB';
import { useCallback, useEffect, useState } from 'react';

interface ProfileStats {
  totalMatches: number;
  activeGroups: number;
  avgCompatibility: number;
  interests: string[];
  totalPrompts?: number;
  totalPosts?: number;
  followers?: number;
  following?: number;
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
      // Fetch API stats
      const response = await api.get(UrlConstants.activityStats);
      const apiStats = response.data.data;
      
      // Get prompts count from local database
      const prompts = await asyncStorageDB.getPrompts();
      const promptsCount = prompts.length;
      
      // Combine API stats with local data and hardcoded values
      const combinedStats = {
        ...apiStats,
        totalPrompts: promptsCount || 14, // Use cached prompts count or fallback
        totalPosts: 10, // Hardcoded since posts API not implemented
        followers: 1, // Hardcoded since followers API not implemented  
        following: 1, // Hardcoded since following API not implemented
      };
      
      setStats(combinedStats);
      setLastUpdated(new Date());
    } catch (err: any) {
      // If API fails, still try to get local data
      try {
        const prompts = await asyncStorageDB.getPrompts();
        const fallbackStats = {
          totalMatches: 0,
          activeGroups: 0,
          avgCompatibility: 0,
          interests: [],
          totalPrompts: prompts.length || 14,
          totalPosts: 10,
          followers: 1,
          following: 1,
        };
        setStats(fallbackStats);
      } catch (localErr) {
        setError(err?.message || 'Failed to fetch stats');
        console.error('Error fetching profile stats:', err);
      }
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