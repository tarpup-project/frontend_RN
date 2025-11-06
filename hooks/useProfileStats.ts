import { useState, useEffect, useCallback } from 'react';
import { api } from '@/api/client';
import { UrlConstants } from '@/constants/apiUrls';

interface ProfileStats {
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
      const response = await api.get(UrlConstants.activityStats);
      setStats(response.data.data);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch stats');
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