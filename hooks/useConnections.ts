import { api } from "@/api/client";
import { UrlConstants } from "@/constants/apiUrls";
import { useQuery } from "@tanstack/react-query";

export interface User {
  id: string;
  fname: string;
  lname: string;
  username?: string;
  bgUrl?: string;
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
  isFriend?: boolean;
  friendStatus?: 'friends' | 'pending' | 'not_friends';
  status?: string;
  followerID?: string;
}

interface FollowerData {
  id?: string;
  userID?: string;
  followerID?: string;
  createdAt?: string;
  updatedAt?: string;
  follower: {
    id: string;
    fname: string;
    lname: string;
    bgUrl?: string;
  };
}

interface FriendData {
  id: string;
  fname: string;
  lname: string;
  bgUrl?: string;
}

// Fetch followers data
const fetchFollowers = async (): Promise<User[]> => {
  console.log('🔄 Fetching followers from API...');

  const response = await api.get(UrlConstants.tarpUserFollowers);

  if (response.data?.status === 'success' && response.data?.data) {
    const followersApiData: FollowerData[] = response.data.data;

    // Remove duplicates by follower.id
    const uniqueFollowers = followersApiData.reduce((acc: FollowerData[], current) => {
      const exists = acc.find(item => item.follower.id === current.follower.id);
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, []);

    const followData = uniqueFollowers.map((item: FollowerData) => ({
      id: item.follower.id,
      fname: item.follower.fname,
      lname: item.follower.lname,
      username: `@${item.follower.fname.toLowerCase()}${item.follower.lname.toLowerCase()}`,
      bgUrl: item.follower.bgUrl,
      isFollowing: true,
      isFriend: false, // Will be updated by cross-referencing
      friendStatus: 'not_friends' as const,
      followersCount: 0,
      followingCount: 0,
      followerID: item.follower.id
    }));

    console.log('✅ Processed followers:', followData.length);
    return followData;
  }

  console.log('⚠️ No followers data found');
  return [];
};

// Fetch friends data
const fetchFriends = async (): Promise<User[]> => {
  console.log('🔄 Fetching friends from API...');

  const response = await api.get(UrlConstants.tarpFriendsPrivacy);

  if (response.data?.status === 'success' && response.data?.data) {
    const friendsApiData: FriendData[] = response.data.data;

    const friendsData = friendsApiData.map((item: FriendData) => ({
      id: item.id,
      fname: item.fname || '',
      lname: item.lname || '',
      username: `@${(item.fname || '').toLowerCase()}${(item.lname || '').toLowerCase()}`,
      bgUrl: item.bgUrl,
      isFollowing: false,
      isFriend: true,
      friendStatus: 'friends' as const,
      status: 'accepted',
      followersCount: 0,
      followingCount: 0
    }));

    console.log('✅ Processed friends:', friendsData.length);
    return friendsData;
  }

  console.log('⚠️ No friends data found');
  return [];
};

// Fetch discover users data
const fetchDiscoverUsers = async (): Promise<User[]> => {
  console.log('🔄 Fetching discover users from API...');

  const response = await api.get(UrlConstants.groupsFriends());

  if (response.data?.status === 'success' && response.data?.data) {
    const discoverApiData = response.data.data;

    const discoverData = Array.isArray(discoverApiData) ? discoverApiData.map((item: any) => {
      const userId = item.id || item.user?.id;
      return {
        id: userId,
        fname: item.fname || item.user?.fname || 'User',
        lname: item.lname || item.user?.lname || '',
        username: item.username || `@${(item.fname || item.user?.fname || 'user').toLowerCase()}`,
        bgUrl: item.bgUrl || item.user?.bgUrl,
        isFollowing: false, // Will be updated by cross-referencing
        isFriend: false, // Will be updated by cross-referencing
        friendStatus: 'not_friends' as const,
        followersCount: 0,
        followingCount: 0
      };
    }) : [];

    console.log('✅ Processed discover users:', discoverData.length);
    return discoverData;
  }

  console.log('⚠️ No discover users data found');
  return [];
};

// Fetch pending friend requests
// Fetch real friend status for a specific user
const fetchRealFriendStatus = async (userId: string): Promise<'friends' | 'pending' | 'not_friends'> => {
  try {
    console.log(`🔍 Checking real friend status for user: ${userId}`);
    const response = await api.get(UrlConstants.tarpCheckFriendStatus(userId));
    
    if (response.data?.status === 'success' && response.data?.data) {
      const status = response.data.data.status;
      console.log(`✅ Real friend status for ${userId}: ${status}`);
      return status === 'accepted' ? 'friends' : status === 'pending' ? 'pending' : 'not_friends';
    }
    
    console.log(`❌ No friend relationship found for ${userId}`);
    return 'not_friends';
  } catch (error) {
    console.error(`❌ Failed to fetch friend status for ${userId}:`, error);
    return 'not_friends';
  }
};

// Fetch real friend statuses for multiple users
const fetchRealFriendStatuses = async (userIds: string[]): Promise<Record<string, 'friends' | 'pending' | 'not_friends'>> => {
  console.log(`🔍 Fetching real friend statuses for ${userIds.length} users`);
  
  const statusPromises = userIds.map(async (userId) => {
    const status = await fetchRealFriendStatus(userId);
    return { userId, status };
  });
  
  const results = await Promise.all(statusPromises);
  
  const statusMap: Record<string, 'friends' | 'pending' | 'not_friends'> = {};
  results.forEach(({ userId, status }) => {
    statusMap[userId] = status;
  });
  
  console.log(`✅ Real friend statuses fetched:`, statusMap);
  return statusMap;
};

// Fetch pending friend requests
const fetchPendingRequests = async (): Promise<string[]> => {
  console.log('🔄 Fetching pending requests from API...');
  
  const response = await api.get(UrlConstants.tarpUserPendingRequests);
  
  if (response.data?.status === 'success' && response.data?.data) {
    const pendingData = response.data.data;
    
    // Extract both IDs to identify the connection partner regardless of direction (initiator vs receiver)
    // The current user's ID will also be in this list but won't match any other user's ID in the UI list
    const pendingIds = pendingData.flatMap((item: any) => [item.userID, item.friendID]);
    const uniquePendingIds = [...new Set(pendingIds)];

    console.log('✅ Processed pending requests:', uniquePendingIds.length);
    return uniquePendingIds as string[];
  }

  console.log('⚠️ No pending requests data found');
  return [];
};

export const useFollowers = () => {
  return useQuery<User[], Error>({
    queryKey: ['connections', 'followers'],
    queryFn: fetchFollowers,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    placeholderData: (previousData) => {
      if (previousData && previousData.length > 0) {
        console.log('⚡ Using cached followers data -', previousData.length, 'followers loaded from cache');
      }
      return previousData;
    },
  });
};

// Hook for friends
export const useConnectionsFriends = () => {
  return useQuery<User[], Error>({
    queryKey: ['connections', 'friends'],
    queryFn: fetchFriends,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    placeholderData: (previousData) => {
      if (previousData && previousData.length > 0) {
        console.log('⚡ Using cached friends data -', previousData.length, 'friends loaded from cache');
      }
      return previousData;
    },
  });
};

// Hook for discover users
export const useDiscoverUsers = () => {
  return useQuery<User[], Error>({
    queryKey: ['connections', 'discover'],
    queryFn: fetchDiscoverUsers,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    placeholderData: (previousData) => {
      if (previousData && previousData.length > 0) {
        console.log('⚡ Using cached discover users data -', previousData.length, 'users loaded from cache');
      }
      return previousData;
    },
  });
};

// Hook for pending requests
export const usePendingRequests = () => {
  return useQuery<string[], Error>({
    queryKey: ['connections', 'pending'],
    queryFn: fetchPendingRequests,
    staleTime: 1000 * 60 * 2, // 2 minutes (more frequent updates for pending status)
    gcTime: 1000 * 60 * 15, // 15 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    placeholderData: (previousData) => {
      if (previousData && previousData.length > 0) {
        console.log('⚡ Using cached pending requests data -', previousData.length, 'requests loaded from cache');
      }
      return previousData;
    },
  });
};

// Hook for real-time friend status checking
export const useRealFriendStatuses = (userIds: string[]) => {
  return useQuery<Record<string, 'friends' | 'pending' | 'not_friends'>, Error>({
    queryKey: ['connections', 'realFriendStatuses', userIds.sort().join(',')],
    queryFn: () => fetchRealFriendStatuses(userIds),
    enabled: userIds.length > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes - more frequent updates for friend status
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    placeholderData: (previousData) => {
      if (previousData && Object.keys(previousData).length > 0) {
        console.log('⚡ Using cached real friend statuses -', Object.keys(previousData).length, 'statuses loaded from cache');
      }
      return previousData;
    },
  });
};

// Main hook that combines all data with cross-referencing
export const useConnections = () => {
  const { data: followers = [], isLoading: followersLoading, error: followersError, refetch: refetchFollowers } = useFollowers();
  const { data: friends = [], isLoading: friendsLoading, error: friendsError, refetch: refetchFriends } = useConnectionsFriends();
  const { data: discoverUsers = [], isLoading: discoverLoading, error: discoverError, refetch: refetchDiscover } = useDiscoverUsers();
  const { data: pendingIds = [], isLoading: pendingLoading, error: pendingError, refetch: refetchPending } = usePendingRequests();

  // Get all user IDs for real friend status checking
  const allUserIds = [...new Set([
    ...followers.map(u => u.id),
    ...discoverUsers.map(u => u.id)
  ])];

  // Fetch real friend statuses for all users
  const { data: realFriendStatuses = {}, isLoading: realStatusLoading } = useRealFriendStatuses(allUserIds);

  // Cross-reference data to update friend and follow statuses with real API data
  const processedData = {
    follow: followers.map(user => {
      const friendIds = new Set(friends.map(f => f.id));
      const pendingSet = new Set(pendingIds);
      const isAlsoFriend = friendIds.has(user.id);
      const isPending = pendingSet.has(user.id);
      
      // Use real friend status if available, otherwise fall back to processed status
      const realStatus = realFriendStatuses[user.id];
      const finalFriendStatus = realStatus || (isAlsoFriend ? 'friends' as const : (isPending ? 'pending' as const : 'not_friends' as const));

      return {
        ...user,
        isFriend: finalFriendStatus === 'friends',
        friendStatus: finalFriendStatus
      };
    }),

    friends: friends, // Friends data is already processed

    discover: discoverUsers.filter(user => {
      const followIds = new Set(followers.map(f => f.id));
      const friendIds = new Set(friends.map(f => f.id));
      const pendingSet = new Set(pendingIds);

      const isInFollow = followIds.has(user.id);
      const isInFriends = friendIds.has(user.id);
      const isPending = pendingSet.has(user.id);
      
      // Use real friend status if available
      const realStatus = realFriendStatuses[user.id];
      const finalFriendStatus = realStatus || (isInFriends ? 'friends' : (isPending ? 'pending' : 'not_friends'));

      // Update user status with real data
      user.isFollowing = isInFollow;
      user.isFriend = finalFriendStatus === 'friends';
      user.friendStatus = finalFriendStatus;

      // Only show in discover if not in both follow and friends tabs
      return !(isInFollow && isInFriends);
    })
  };

  // Console log everyone in discover tab with real friend status
  console.log('🔍 DISCOVER TAB USERS (with real friend status):');
  console.log('='.repeat(60));
  processedData.discover.forEach((user, index) => {
    const realStatus = realFriendStatuses[user.id];
    const hasRealStatus = realStatus !== undefined;
    
    console.log(`${index + 1}. ${user.fname} ${user.lname} (@${user.username || 'no-username'})`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Following: ${user.isFollowing ? '✅' : '❌'}`);
    console.log(`   Friend: ${user.isFriend ? '✅' : '❌'}`);
    console.log(`   Friend Status: ${user.friendStatus} ${hasRealStatus ? '(✅ Real API)' : '(📋 Cached)'}`);
    console.log(`   Avatar: ${user.bgUrl ? '🖼️ Yes' : '❌ No'}`);
    if (hasRealStatus) {
      console.log(`   🔍 Real API Status: ${realStatus}`);
    }
    console.log('   ---');
  });
  console.log(`📊 Total discover users: ${processedData.discover.length}`);
  console.log(`🔍 Real statuses fetched: ${Object.keys(realFriendStatuses).length}/${allUserIds.length}`);
  console.log('='.repeat(60));

  const isLoading = followersLoading || friendsLoading || discoverLoading || pendingLoading || realStatusLoading;
  const hasError = followersError || friendsError || discoverError || pendingError;

  const refetchAll = () => {
    console.log('🔄 Refetching all connections data...');
    refetchFollowers();
    refetchFriends();
    refetchDiscover();
    refetchPending();
  };

  const refetchTab = (tab: 'follow' | 'friends' | 'discover') => {
    console.log(`🔄 Refetching ${tab} data...`);
    switch (tab) {
      case 'follow':
        refetchFollowers();
        refetchPending(); // Also refetch pending to update friend status
        break;
      case 'friends':
        refetchFriends();
        break;
      case 'discover':
        refetchDiscover();
        refetchFollowers(); // Refetch followers to update cross-references
        refetchFriends(); // Refetch friends to update cross-references
        refetchPending(); // Refetch pending to update status
        break;
    }
  };

  return {
    data: processedData,
    counts: {
      follow: processedData.follow.length,
      friends: processedData.friends.length,
      discover: processedData.discover.length
    },
    isLoading,
    hasError,
    refetchAll,
    refetchTab,
    // Individual refetch functions for specific use cases
    refetchFollowers,
    refetchFriends,
    refetchDiscover,
    refetchPending
  };
};

// Hook for filtering connections based on search query
export const useFilteredConnections = (activeTab: 'follow' | 'friends' | 'discover', searchQuery: string) => {
  const { data, counts, isLoading, hasError, refetchAll, refetchTab } = useConnections();

  const users = data[activeTab] || [];

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const fullName = `${user.fname} ${user.lname}`.toLowerCase();
    const username = user.username?.toLowerCase() || '';
    return fullName.includes(searchQuery.toLowerCase()) || username.includes(searchQuery.toLowerCase());
  });

  return {
    users: filteredUsers,
    allUsers: users,
    counts,
    isLoading,
    hasError,
    refetchAll,
    refetchTab,
    hasData: users.length > 0,
  };
};