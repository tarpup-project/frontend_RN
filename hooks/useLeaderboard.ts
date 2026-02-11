import { api } from '@/api/client';
import { UrlConstants } from "@/constants/apiUrls";
import { useAuthStore } from '@/state/authStore';
import { useQuery } from '@tanstack/react-query';

export const useLeaderboard = () => {
  const { user } = useAuthStore();
  
  const fetchLeaderboard = async () => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }
    const response = await api.get(UrlConstants.getUserLeaderboard(user.id));
    // API shape: { status, data }
    return response.data?.data;
  };

  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['leaderboard', user?.id || ''],
    queryFn: fetchLeaderboard,
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes: show cached data as "stable"
    gcTime: 1000 * 60 * 30,   // 30 minutes: cache lifetime
    refetchOnMount: 'always', // Always refetch in background on mount
    placeholderData: (prev) => prev, // Use cached data immediately if available
  });

  return { data, isLoading, error: error as any, refetch };
};
