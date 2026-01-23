import { api } from "@/api/client";
import { UrlConstants } from "@/constants/apiUrls";
import { useQuery } from "@tanstack/react-query";

export interface Friend {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  isFollowing?: boolean;
}

const fetchFriends = async (): Promise<Friend[]> => {
  console.log('🔄 Fetching friends from API...');
  
  const response = await api.get(UrlConstants.fetchFriendsPrivacy);
  
  console.log('📋 Friends API Response:', JSON.stringify(response.data, null, 2));

  if (response.data?.status === 'success' && Array.isArray(response.data?.data)) {
    const friendsData = response.data.data.map((item: any) => ({
      id: item.id,
      name: `${item.fname || ''} ${item.lname || ''}`.trim() || 'Unknown',
      username: item.username || `@${(item.fname || '').toLowerCase()}${(item.lname || '').toLowerCase()}`,
      avatar: item.bgUrl,
      isFollowing: false // Endpoint doesn't return this, default to false
    }));

    console.log('✅ Processed friends:', friendsData.length);
    return friendsData;
  } else {
    console.log('⚠️ No friends data found');
    return [];
  }
};

export const useFriends = () => {
  return useQuery<Friend[], Error>({
    queryKey: ['friends'],
    queryFn: fetchFriends,
    staleTime: 1000 * 60 * 5, // Consider data stale after 5 minutes
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnWindowFocus: false, // Don't refetch when app comes back to focus
    refetchOnReconnect: true, // Refetch when network reconnects
    // Keep previous data while loading new data
    placeholderData: (previousData) => {
      if (previousData && previousData.length > 0) {
        console.log('⚡ Using cached friends data -', previousData.length, 'friends loaded from cache');
      }
      return previousData;
    },
  });
};

// Hook for filtering friends based on search query
export const useFilteredFriends = (searchQuery: string) => {
  const { data: friends = [], isLoading, error, refetch } = useFriends();
  
  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (friend.username && friend.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return {
    friends: filteredFriends,
    allFriends: friends,
    isLoading,
    error,
    refetch,
    hasData: friends.length > 0,
  };
};