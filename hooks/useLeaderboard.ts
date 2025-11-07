import { useState, useEffect } from 'react';
import { useAuthStore } from '@/state/authStore';
import { UrlConstants } from "@/constants/apiUrls"

export const useLeaderboard = () => {
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchLeaderboardData();
    }
  }, [user?.id]);

  const fetchLeaderboardData = async () => {
    if (!user?.id) return; 
    
    try {
      setIsLoading(true);
      const response = await fetch(`${UrlConstants.baseUrl}${UrlConstants.getUserLeaderboard(user.id)}`);
      const result = await response.json();
      setData(result.data);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch leaderboard';
      setError(errorMessage);
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, error, refetch: fetchLeaderboardData };
};