import { api } from '@/api/client';
import { UrlConstants } from '@/constants/apiUrls';
import { useAuthStore } from '@/state/authStore';
import { useNotificationStore } from '@/state/notificationStore';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';

interface PostLike {
  id: string;
  likeeID: string;
  tarpPostImgID: string;
  createdAt: string;
  updatedAt: string;
  tarpPostImg: {
    id: string;
    url: string;
    postID: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
  };
  likee: {
    id: string;
    fname: string;
    lname?: string;
    bgUrl?: string;
  };
}

interface PostLikesResponse {
  status: string;
  data: PostLike[];
}

const LAST_POST_LIKES_CHECK_KEY = 'last_post_likes_check';
const SEEN_POST_LIKES_KEY = 'seen_post_likes';

export const usePostLikesNotifications = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { setNotifications } = useNotificationStore();
  const [postLikes, setPostLikes] = useState<PostLike[]>([]);
  const [newPostLikesCount, setNewPostLikesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch post likes from API
  const fetchPostLikes = useCallback(async () => {
    if (!isAuthenticated || !user) {
      console.log('🔔 Not authenticated, cannot fetch post likes');
      return [];
    }

    try {
      setIsLoading(true);
      console.log('🔔 Fetching post likes from:', UrlConstants.fetchPostLikes);
      
      const response = await api.get<PostLikesResponse>(UrlConstants.fetchPostLikes);
      
      console.log('🔔 Post likes API response:', JSON.stringify(response.data, null, 2));
      
      if (response.data.status === 'success' && Array.isArray(response.data.data)) {
        console.log('✅ Post likes fetched successfully:', response.data.data.length);
        setPostLikes(response.data.data);
        return response.data.data;
      } else {
        console.log('⚠️ No post likes data found or invalid response structure');
        console.log('Response status:', response.data.status);
        console.log('Response data type:', typeof response.data.data);
        setPostLikes([]);
        return [];
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch post likes:', error);
      
      // Handle rate limiting specifically
      if (error.response?.status === 429) {
        console.log('⚠️ Rate limited - will retry later');
        // Don't clear post likes data on rate limit, just return empty array
        return [];
      }
      
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      setPostLikes([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  // Check for new post likes and update notification count
  const checkForNewPostLikes = useCallback(async () => {
    if (!isAuthenticated || !user) {
      console.log('🔔 Not authenticated, skipping post likes check');
      return;
    }

    try {
      console.log('🔔 Checking for new post likes...');
      const currentPostLikes = await fetchPostLikes();
      if (currentPostLikes.length === 0) {
        console.log('🔔 No post likes found');
        return;
      }

      console.log('🔔 Current post likes count:', currentPostLikes.length);

      // Get the last check timestamp and seen post likes
      const lastCheckTime = await SecureStore.getItemAsync(LAST_POST_LIKES_CHECK_KEY);
      const seenPostLikesData = await SecureStore.getItemAsync(SEEN_POST_LIKES_KEY);
      const seenPostLikes = seenPostLikesData ? JSON.parse(seenPostLikesData) : [];

      console.log('🔔 Last check time:', lastCheckTime);
      console.log('🔔 Seen post likes:', seenPostLikes.length);

      let newPostLikes: PostLike[] = [];

      if (lastCheckTime) {
        // Find post likes added since last check
        const lastCheck = new Date(lastCheckTime);
        newPostLikes = currentPostLikes.filter(postLike => {
          const postLikeDate = new Date(postLike.createdAt);
          const isNew = postLikeDate > lastCheck && !seenPostLikes.includes(postLike.id);
          console.log(`🔔 Post like by ${postLike.likee.fname}: created ${postLikeDate.toISOString()}, lastCheck ${lastCheck.toISOString()}, isNew: ${isNew}`);
          return isNew;
        });
      } else {
        // First time checking - show all post likes that haven't been dismissed
        console.log('🔔 First time checking post likes, filtering out dismissed ones');
        newPostLikes = currentPostLikes.filter(postLike => !seenPostLikes.includes(postLike.id));
        console.log('🔔 Showing as new (after filtering dismissed):', newPostLikes.map(pl => pl.likee.fname));
      }

      console.log('🔔 New post likes detected:', newPostLikes.length);

      if (newPostLikes.length > 0) {
        console.log('🔔 Processing new post likes:', newPostLikes.map(pl => pl.likee.fname));
        
        // Update local notification count
        setNewPostLikesCount(prev => {
          const newCount = prev + newPostLikes.length;
          console.log('🔔 Updating post likes count from', prev, 'to', newCount);
          return newCount;
        });
        
        // Only update notification store, don't increment individual notifications
        // setNotifications({
        //   postLikesNotifications: newPostLikes.length
        // });

        // DON'T automatically mark as seen - let user dismiss them manually
        console.log('🔔 New post likes ready to show - NOT marking as seen automatically');
      }

      // Update last check time only if we processed notifications
      if (newPostLikes.length > 0 || !lastCheckTime) {
        await SecureStore.setItemAsync(LAST_POST_LIKES_CHECK_KEY, new Date().toISOString());
        console.log('🔔 Updated last check time');
      }

    } catch (error) {
      console.error('❌ Failed to check for new post likes:', error);
    }
  }, [isAuthenticated, user?.id, setNotifications]);

  // Mark post likes as seen (when user views notifications)
  const markPostLikesAsSeen = useCallback(async () => {
    try {
      if (postLikes.length > 0) {
        const allPostLikeIds = postLikes.map(pl => pl.id);
        await SecureStore.setItemAsync(SEEN_POST_LIKES_KEY, JSON.stringify(allPostLikeIds));
        setNewPostLikesCount(0);
        
        // Clear post likes notifications in store
      // // setNotifications({
      //   postLikesNotifications: 0
      // });
        
        console.log('✅ All post likes marked as seen');
      }
    } catch (error) {
      console.error('❌ Failed to mark post likes as seen:', error);
    }
  }, [postLikes, setNotifications]);

  // Get recent post likes (last 10) - with better error handling and debugging
  const getRecentPostLikes = useCallback(async () => {
    try {
      console.log('🔍 getRecentPostLikes called - total postLikes:', postLikes.length);
      
      if (postLikes.length === 0) {
        console.log('⚠️ No post likes data available');
        return [];
      }
      
      // Check SecureStore for dismissed post likes
      let seenPostLikes = [];
      try {
        const seenPostLikesData = await SecureStore.getItemAsync(SEEN_POST_LIKES_KEY);
        seenPostLikes = seenPostLikesData ? JSON.parse(seenPostLikesData) : [];
        console.log('📱 SecureStore - dismissed post likes:', seenPostLikes.length);
      } catch (storeError) {
        console.log('⚠️ SecureStore error, showing all post likes:', storeError);
        seenPostLikes = []; // If SecureStore fails, show all
      }
      
      // Filter out dismissed post likes
      const filteredPostLikes = postLikes.filter(postLike => {
        const isDismissed = seenPostLikes.includes(postLike.id);
        if (isDismissed) {
          console.log('🚫 Filtering out dismissed post like:', postLike.id, 'by', postLike.likee.fname);
        }
        return !isDismissed;
      });
      
      console.log('✅ Final result - showing post likes:', filteredPostLikes.length, 'out of', postLikes.length);
      
      return filteredPostLikes
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);
    } catch (error) {
      console.error('❌ Error in getRecentPostLikes:', error);
      // Fallback: return all post likes if there's an error
      return postLikes
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);
    }
  }, [postLikes]);

  // Check if a post like is unseen (for UI display)
  const isPostLikeUnseen = useCallback(async (postLikeId: string) => {
    try {
      const seenPostLikesData = await SecureStore.getItemAsync(SEEN_POST_LIKES_KEY);
      const seenPostLikes = seenPostLikesData ? JSON.parse(seenPostLikesData) : [];
      return !seenPostLikes.includes(postLikeId);
    } catch (error) {
      return true; // Default to unseen if error
    }
  }, []);

  // Dismiss a specific post like notification - save to SecureStore
  const dismissPostLike = useCallback(async (postLikeId: string) => {
    try {
      // Add to seen post likes list in SecureStore
      const seenPostLikesData = await SecureStore.getItemAsync(SEEN_POST_LIKES_KEY);
      const seenPostLikes = seenPostLikesData ? JSON.parse(seenPostLikesData) : [];
      
      if (!seenPostLikes.includes(postLikeId)) {
        const updatedSeenPostLikes = [...seenPostLikes, postLikeId];
        await SecureStore.setItemAsync(SEEN_POST_LIKES_KEY, JSON.stringify(updatedSeenPostLikes));
        
        console.log('✅ Post like dismissed and saved to SecureStore:', postLikeId);
        console.log('📱 Total dismissed post likes:', updatedSeenPostLikes.length);
      }
      
      // Update local state to remove from new post likes count
      setNewPostLikesCount(prev => Math.max(0, prev - 1));
      
      // Update notification store
      setNotifications({
        postLikesNotifications: Math.max(0, newPostLikesCount - 1)
      });
    } catch (error) {
      console.error('❌ Failed to dismiss post like:', error);
    }
  }, [newPostLikesCount, setNotifications]);

  // Initialize and set up polling
  useEffect(() => {
    if (isAuthenticated && user) {
      // Initial check with delay to avoid immediate rate limiting
      const initialTimeout = setTimeout(checkForNewPostLikes, 3000);

      const interval = setInterval(checkForNewPostLikes, 30000);

      return () => {
        clearTimeout(initialTimeout);
        clearInterval(interval);
      };
    } else {
      // Clear data when not authenticated
      setPostLikes([]);
      setNewPostLikesCount(0);
    }
  }, [isAuthenticated, user?.id]); // Remove checkForNewPostLikes from dependencies

  // Pre-populate seen items with current API data (call this on app initialization)
  const initializeSeenPostLikes = useCallback(async (currentPostLikes: PostLike[]) => {
    try {
      const existingSeenData = await SecureStore.getItemAsync(SEEN_POST_LIKES_KEY);
      const existingSeenIds = existingSeenData ? JSON.parse(existingSeenData) : [];
      
      // Add all current post like IDs to seen list if not already there
      const allCurrentIds = currentPostLikes.map(pl => pl.id);
      const newSeenIds = [...new Set([...existingSeenIds, ...allCurrentIds])];
      
      await SecureStore.setItemAsync(SEEN_POST_LIKES_KEY, JSON.stringify(newSeenIds));
      console.log('✅ Initialized seen post likes with', newSeenIds.length, 'items');
    } catch (error) {
      console.error('❌ Failed to initialize seen post likes:', error);
    }
  }, []);
  const clearStoredData = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync(LAST_POST_LIKES_CHECK_KEY);
      await SecureStore.deleteItemAsync(SEEN_POST_LIKES_KEY);
      setNewPostLikesCount(0);
      
      // Clear post likes notifications in store
      // setNotifications({
      //   postLikesNotifications: 0
      // });
      
      console.log('✅ Cleared stored post likes data - refetching data...');
      
      // Refetch post likes data after clearing storage
      console.log('🔄 Refetching post likes data...');
      await fetchPostLikes();
    } catch (error) {
      console.error('❌ Failed to clear stored data:', error);
    }
  }, [setNotifications, fetchPostLikes]);

  // Debug function to check what's in SecureStore
  const checkSecureStore = useCallback(async () => {
    try {
      const seenPostLikesData = await SecureStore.getItemAsync(SEEN_POST_LIKES_KEY);
      const seenPostLikes = seenPostLikesData ? JSON.parse(seenPostLikesData) : [];
      console.log('📱 SecureStore - Dismissed post likes:', seenPostLikes);
      return seenPostLikes;
    } catch (error) {
      console.error('❌ Failed to check SecureStore:', error);
      return [];
    }
  }, []);

  return {
    postLikes,
    newPostLikesCount,
    isLoading,
    fetchPostLikes,
    checkForNewPostLikes,
    markPostLikesAsSeen,
    getRecentPostLikes,
    isPostLikeUnseen,
    dismissPostLike,
    initializeSeenPostLikes,
    checkSecureStore,
    clearStoredData,
  };
};
