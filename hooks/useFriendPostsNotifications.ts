import { api } from '@/api/client';
import { UrlConstants } from '@/constants/apiUrls';
import { useAuthStore } from '@/state/authStore';
import { useNotificationStore } from '@/state/notificationStore';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';

interface FriendPost {
  id: string;
  caption: string;
  lat: number;
  lng: number;
  location: string;
  userID: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  creator: {
    id: string;
    fname: string;
    lname?: string;
    bgUrl?: string;
  };
}

interface FriendPostsResponse {
  status: string;
  data: FriendPost[];
}

const LAST_FRIEND_POSTS_CHECK_KEY = 'last_friend_posts_check';
const SEEN_FRIEND_POSTS_KEY = 'seen_friend_posts';

export const useFriendPostsNotifications = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { setNotifications } = useNotificationStore();
  const [friendPosts, setFriendPosts] = useState<FriendPost[]>([]);
  const [newFriendPostsCount, setNewFriendPostsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch friend posts from API
  const fetchFriendPosts = useCallback(async () => {
    if (!isAuthenticated || !user) {
      console.log('🔔 Not authenticated, cannot fetch friend posts');
      return [];
    }

    try {
      setIsLoading(true);
      console.log('🔔 Fetching friend posts from:', UrlConstants.fetchFriendPosts);
      
      const response = await api.get<FriendPostsResponse>(UrlConstants.fetchFriendPosts);
      
      console.log('🔔 Friend posts API response:', JSON.stringify(response.data, null, 2));
      
      if (response.data.status === 'success' && Array.isArray(response.data.data)) {
        // Filter out deleted posts
        const activePosts = response.data.data.filter(post => !post.deletedAt);
        console.log('✅ Friend posts fetched successfully:', activePosts.length, 'active out of', response.data.data.length, 'total');
        console.log('📋 Friend posts data:', activePosts.map(p => ({
          id: p.id,
          caption: p.caption.substring(0, 30) + '...',
          creatorName: p.creator.fname + ' ' + (p.creator.lname || ''),
          createdAt: p.createdAt
        })));
        
        setFriendPosts(activePosts);
        return activePosts;
      } else {
        console.log('⚠️ No friend posts data found or invalid response structure');
        console.log('Response status:', response.data.status);
        console.log('Response data type:', typeof response.data.data);
        setFriendPosts([]);
        return [];
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch friend posts:', error);
      
      // Handle rate limiting specifically
      if (error.response?.status === 429) {
        console.log('⚠️ Rate limited - will retry later');
        return [];
      }
      
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      setFriendPosts([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  // Check for new friend posts and update notification count
  const checkForNewFriendPosts = useCallback(async () => {
    if (!isAuthenticated || !user) {
      console.log('🔔 Not authenticated, skipping friend posts check');
      return;
    }

    try {
      console.log('🔔 Checking for new friend posts...');
      const currentFriendPosts = await fetchFriendPosts();
      if (currentFriendPosts.length === 0) {
        console.log('🔔 No friend posts found from API');
        return;
      }

      console.log('🔔 Current friend posts count:', currentFriendPosts.length);
      console.log('🔔 Friend posts list:', currentFriendPosts.map(p => `${p.creator.fname}: ${p.caption.substring(0, 20)}...`));

      // Get the last check timestamp and seen friend posts
      const lastCheckTime = await SecureStore.getItemAsync(LAST_FRIEND_POSTS_CHECK_KEY);
      const seenFriendPostsData = await SecureStore.getItemAsync(SEEN_FRIEND_POSTS_KEY);
      const seenFriendPosts = seenFriendPostsData ? JSON.parse(seenFriendPostsData) : [];

      console.log('🔔 Last check time:', lastCheckTime);
      console.log('🔔 Seen friend posts:', seenFriendPosts.length);

      let newFriendPosts: FriendPost[] = [];

      if (lastCheckTime) {
        // Find friend posts added since last check
        const lastCheck = new Date(lastCheckTime);
        newFriendPosts = currentFriendPosts.filter(post => {
          const postDate = new Date(post.createdAt);
          const isNew = postDate > lastCheck && !seenFriendPosts.includes(post.id);
          console.log(`🔔 Friend post by ${post.creator.fname}: created ${postDate.toISOString()}, lastCheck ${lastCheck.toISOString()}, isNew: ${isNew}`);
          return isNew;
        });
      } else {
        // First time checking - show all friend posts that haven't been dismissed
        console.log('🔔 First time checking friend posts, filtering out dismissed ones');
        newFriendPosts = currentFriendPosts.filter(post => !seenFriendPosts.includes(post.id));
        console.log('🔔 Showing as new (after filtering dismissed):', newFriendPosts.map(p => `${p.creator.fname}: ${p.caption.substring(0, 20)}...`));
      }

      console.log('🔔 New friend posts detected:', newFriendPosts.length);

      if (newFriendPosts.length > 0) {
        console.log('🔔 Processing new friend posts:', newFriendPosts.map(p => `${p.creator.fname}: ${p.caption.substring(0, 20)}...`));
        
        // Update local notification count
        setNewFriendPostsCount(prev => {
          const newCount = prev + newFriendPosts.length;
          console.log('🔔 Updating friend posts count from', prev, 'to', newCount);
          return newCount;
        });
        
        // Update notification store
        setNotifications({
          friendPostsNotifications: newFriendPosts.length
        });

        // DON'T automatically mark as seen - let user dismiss them manually
        console.log('🔔 New friend posts ready to show - NOT marking as seen automatically');
      } else {
        console.log('🔔 No new friend posts to show');
      }

      // Update last check time only if we processed notifications
      if (newFriendPosts.length > 0 || !lastCheckTime) {
        await SecureStore.setItemAsync(LAST_FRIEND_POSTS_CHECK_KEY, new Date().toISOString());
        console.log('🔔 Updated last check time');
      }

    } catch (error) {
      console.error('❌ Failed to check for new friend posts:', error);
    }
  }, [isAuthenticated, user?.id, setNotifications]);

  // Mark friend posts as seen (when user views notifications)
  const markFriendPostsAsSeen = useCallback(async () => {
    try {
      if (friendPosts.length > 0) {
        const allFriendPostIds = friendPosts.map(p => p.id);
        await SecureStore.setItemAsync(SEEN_FRIEND_POSTS_KEY, JSON.stringify(allFriendPostIds));
        setNewFriendPostsCount(0);
        
        // Clear friend posts notifications in store
        setNotifications({
          friendPostsNotifications: 0
        });
        
        console.log('✅ All friend posts marked as seen');
      }
    } catch (error) {
      console.error('❌ Failed to mark friend posts as seen:', error);
    }
  }, [friendPosts, setNotifications]);

  // Get recent friend posts (last 10) - with better error handling and debugging
  const getRecentFriendPosts = useCallback(async () => {
    try {
      console.log('🔍 getRecentFriendPosts called - total friendPosts:', friendPosts.length);
      
      if (friendPosts.length === 0) {
        console.log('⚠️ No friend posts data available - trying to fetch...');
        const freshFriendPosts = await fetchFriendPosts();
        if (freshFriendPosts.length === 0) {
          return [];
        }
        console.log('✅ Got fresh friend posts data:', freshFriendPosts.length);
      }
      
      const postsToFilter = friendPosts.length > 0 ? friendPosts : await fetchFriendPosts();
      
      // Check SecureStore for dismissed friend posts
      let seenFriendPosts = [];
      try {
        const seenFriendPostsData = await SecureStore.getItemAsync(SEEN_FRIEND_POSTS_KEY);
        seenFriendPosts = seenFriendPostsData ? JSON.parse(seenFriendPostsData) : [];
        console.log('📱 SecureStore - dismissed friend posts:', seenFriendPosts.length);
      } catch (storeError) {
        console.log('⚠️ SecureStore error, showing all friend posts:', storeError);
        seenFriendPosts = [];
      }
      
      // Filter out dismissed friend posts
      const filteredFriendPosts = postsToFilter.filter(post => {
        const isDismissed = seenFriendPosts.includes(post.id);
        if (isDismissed) {
          console.log('🚫 Filtering out dismissed friend post:', post.id, 'by', post.creator.fname);
        }
        return !isDismissed;
      });
      
      console.log('✅ Final result - showing friend posts:', filteredFriendPosts.length, 'out of', postsToFilter.length);
      
      // Log the posts we're showing
      if (filteredFriendPosts.length > 0) {
        console.log('📝 Friend posts to show:', filteredFriendPosts.map(p => `${p.creator.fname}: ${p.caption.substring(0, 20)}...`));
      }
      
      return filteredFriendPosts
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);
    } catch (error) {
      console.error('❌ Error in getRecentFriendPosts:', error);
      return friendPosts
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);
    }
  }, [friendPosts, fetchFriendPosts]);

  // Check if a friend post is unseen (for UI display)
  const isFriendPostUnseen = useCallback(async (postId: string) => {
    try {
      const seenFriendPostsData = await SecureStore.getItemAsync(SEEN_FRIEND_POSTS_KEY);
      const seenFriendPosts = seenFriendPostsData ? JSON.parse(seenFriendPostsData) : [];
      return !seenFriendPosts.includes(postId);
    } catch (error) {
      return true;
    }
  }, []);

  // Dismiss a specific friend post notification - save to SecureStore
  const dismissFriendPost = useCallback(async (postId: string) => {
    try {
      // Add to seen friend posts list in SecureStore
      const seenFriendPostsData = await SecureStore.getItemAsync(SEEN_FRIEND_POSTS_KEY);
      const seenFriendPosts = seenFriendPostsData ? JSON.parse(seenFriendPostsData) : [];
      
      if (!seenFriendPosts.includes(postId)) {
        const updatedSeenFriendPosts = [...seenFriendPosts, postId];
        await SecureStore.setItemAsync(SEEN_FRIEND_POSTS_KEY, JSON.stringify(updatedSeenFriendPosts));
        
        console.log('✅ Friend post dismissed and saved to SecureStore:', postId);
        console.log('📱 Total dismissed friend posts:', updatedSeenFriendPosts.length);
      }
      
      // Update local state
      setNewFriendPostsCount(prev => Math.max(0, prev - 1));
      
      // Update notification store
      setNotifications({
        friendPostsNotifications: Math.max(0, newFriendPostsCount - 1)
      });
    } catch (error) {
      console.error('❌ Failed to dismiss friend post:', error);
    }
  }, [newFriendPostsCount, setNotifications]);

  // Initialize and set up polling
  useEffect(() => {
    if (isAuthenticated && user) {
      // Initial check with delay to avoid immediate rate limiting
      const initialTimeout = setTimeout(checkForNewFriendPosts, 4000);

      const interval = setInterval(checkForNewFriendPosts, 30000);

      return () => {
        clearTimeout(initialTimeout);
        clearInterval(interval);
      };
    } else {
      // Clear data when not authenticated
      setFriendPosts([]);
      setNewFriendPostsCount(0);
    }
  }, [isAuthenticated, user?.id]);

  // Pre-populate seen items with current API data (call this on app initialization)
  const initializeSeenFriendPosts = useCallback(async (currentFriendPosts: FriendPost[]) => {
    try {
      const existingSeenData = await SecureStore.getItemAsync(SEEN_FRIEND_POSTS_KEY);
      const existingSeenIds = existingSeenData ? JSON.parse(existingSeenData) : [];
      
      // Add all current friend post IDs to seen list if not already there
      const allCurrentIds = currentFriendPosts.map(p => p.id);
      const newSeenIds = [...new Set([...existingSeenIds, ...allCurrentIds])];
      
      await SecureStore.setItemAsync(SEEN_FRIEND_POSTS_KEY, JSON.stringify(newSeenIds));
      console.log('✅ Initialized seen friend posts with', newSeenIds.length, 'items');
    } catch (error) {
      console.error('❌ Failed to initialize seen friend posts:', error);
    }
  }, []);

  // Clear stored data for testing
  const clearStoredData = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync(LAST_FRIEND_POSTS_CHECK_KEY);
      await SecureStore.deleteItemAsync(SEEN_FRIEND_POSTS_KEY);
      setNewFriendPostsCount(0);
      
      // Clear friend posts notifications in store
      setNotifications({
        friendPostsNotifications: 0
      });
      
      console.log('✅ Cleared stored friend posts data - refetching data...');
      
      // Refetch friend posts data after clearing storage
      console.log('🔄 Refetching friend posts data...');
      await fetchFriendPosts();
    } catch (error) {
      console.error('❌ Failed to clear stored data:', error);
    }
  }, [setNotifications, fetchFriendPosts]);

  // Debug function to check what's in SecureStore
  const checkSecureStore = useCallback(async () => {
    try {
      const seenFriendPostsData = await SecureStore.getItemAsync(SEEN_FRIEND_POSTS_KEY);
      const seenFriendPosts = seenFriendPostsData ? JSON.parse(seenFriendPostsData) : [];
      console.log('📱 SecureStore - Dismissed friend posts:', seenFriendPosts);
      return seenFriendPosts;
    } catch (error) {
      console.error('❌ Failed to check SecureStore:', error);
      return [];
    }
  }, []);

  return {
    friendPosts,
    newFriendPostsCount,
    isLoading,
    fetchFriendPosts,
    checkForNewFriendPosts,
    markFriendPostsAsSeen,
    getRecentFriendPosts,
    isFriendPostUnseen,
    dismissFriendPost,
    initializeSeenFriendPosts,
    checkSecureStore,
    clearStoredData,
  };
};
