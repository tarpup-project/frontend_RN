import { api } from '@/api/client';
import { UrlConstants } from '@/constants/apiUrls';
import { useAuthStore } from '@/state/authStore';
import { useNotificationStore } from '@/state/notificationStore';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';

interface Follower {
  id: string;
  userID: string;
  followerID: string;
  createdAt: string;
  updatedAt: string;
  follower: {
    id: string;
    fname: string;
    lname?: string;
    bgUrl?: string;
  };
}

interface FollowersResponse {
  status: string;
  data: Follower[];
}

const LAST_FOLLOWER_CHECK_KEY = 'last_follower_check';
const SEEN_FOLLOWERS_KEY = 'seen_followers';

export const useFollowerNotifications = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { setNotifications } = useNotificationStore();
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [newFollowersCount, setNewFollowersCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch followers from API
  const fetchFollowers = useCallback(async () => {
    if (!isAuthenticated || !user) {
      console.log('🔔 Not authenticated, cannot fetch followers');
      return [];
    }

    try {
      setIsLoading(true);
      console.log('🔔 Fetching followers from:', UrlConstants.fetchFollowers);
      
      const response = await api.get<FollowersResponse>(UrlConstants.fetchFollowers);
      
      console.log('🔔 Followers API response:', JSON.stringify(response.data, null, 2));
      
      if (response.data.status === 'success' && Array.isArray(response.data.data)) {
        console.log('✅ Followers fetched successfully:', response.data.data.length);
        console.log('📋 Followers data:', response.data.data.map(f => ({
          id: f.id,
          followerName: f.follower.fname + ' ' + (f.follower.lname || ''),
          createdAt: f.createdAt
        })));
        
        setFollowers(response.data.data);
        return response.data.data;
      } else {
        console.log('⚠️ No followers data found or invalid response structure');
        console.log('Response status:', response.data.status);
        console.log('Response data type:', typeof response.data.data);
        setFollowers([]);
        return [];
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch followers:', error);
      
      // Handle rate limiting specifically
      if (error.response?.status === 429) {
        console.log('⚠️ Rate limited - will retry later');
        // Don't clear followers data on rate limit, just return empty array
        return [];
      }
      
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      setFollowers([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  // Check for new followers and update notification count
  const checkForNewFollowers = useCallback(async () => {
    if (!isAuthenticated || !user) {
      console.log('🔔 Not authenticated, skipping follower check');
      return;
    }

    try {
      console.log('🔔 Checking for new followers...');
      const currentFollowers = await fetchFollowers();
      if (currentFollowers.length === 0) {
        console.log('🔔 No followers found from API');
        return;
      }

      console.log('🔔 Current followers count:', currentFollowers.length);
      console.log('🔔 Followers list:', currentFollowers.map(f => f.follower.fname));

      // Get the last check timestamp and seen followers
      const lastCheckTime = await SecureStore.getItemAsync(LAST_FOLLOWER_CHECK_KEY);
      const seenFollowersData = await SecureStore.getItemAsync(SEEN_FOLLOWERS_KEY);
      const seenFollowers = seenFollowersData ? JSON.parse(seenFollowersData) : [];

      console.log('🔔 Last check time:', lastCheckTime);
      console.log('🔔 Seen followers:', seenFollowers.length);

      let newFollowers: Follower[] = [];

      if (lastCheckTime) {
        // Find followers added since last check
        const lastCheck = new Date(lastCheckTime);
        newFollowers = currentFollowers.filter(follower => {
          const followerDate = new Date(follower.createdAt);
          const isNew = followerDate > lastCheck && !seenFollowers.includes(follower.id);
          console.log(`🔔 Follower ${follower.follower.fname}: created ${followerDate.toISOString()}, lastCheck ${lastCheck.toISOString()}, isNew: ${isNew}`);
          return isNew;
        });
      } else {
        // First time checking - show all followers that haven't been dismissed
        console.log('🔔 First time checking followers, filtering out dismissed ones');
        newFollowers = currentFollowers.filter(follower => !seenFollowers.includes(follower.id));
        console.log('🔔 Showing as new (after filtering dismissed):', newFollowers.map(f => f.follower.fname));
      }

      console.log('🔔 New followers detected:', newFollowers.length);

      if (newFollowers.length > 0) {
        console.log('🔔 Processing new followers:', newFollowers.map(f => f.follower.fname));
        
        // Update local notification count
        setNewFollowersCount(prev => {
          const newCount = prev + newFollowers.length;
          console.log('🔔 Updating follower count from', prev, 'to', newCount);
          return newCount;
        });
        
        // Only update notification store, don't increment individual notifications
        setNotifications({
          followerNotifications: newFollowers.length
        });

        // DON'T automatically mark as seen - let user dismiss them manually
        console.log('🔔 New followers ready to show - NOT marking as seen automatically');
      } else {
        console.log('🔔 No new followers to show');
      }

      // Update last check time only if we processed notifications
      if (newFollowers.length > 0 || !lastCheckTime) {
        await SecureStore.setItemAsync(LAST_FOLLOWER_CHECK_KEY, new Date().toISOString());
        console.log('🔔 Updated last check time');
      }

    } catch (error) {
      console.error('❌ Failed to check for new followers:', error);
    }
  }, [isAuthenticated, user?.id, setNotifications]);

  // Mark followers as seen (when user views notifications)
  const markFollowersAsSeen = useCallback(async () => {
    try {
      if (followers.length > 0) {
        const allFollowerIds = followers.map(f => f.id);
        await SecureStore.setItemAsync(SEEN_FOLLOWERS_KEY, JSON.stringify(allFollowerIds));
        setNewFollowersCount(0);
        
        // Clear follower notifications in store
        setNotifications({
          followerNotifications: 0
        });
        
        console.log('✅ All followers marked as seen');
      }
    } catch (error) {
      console.error('❌ Failed to mark followers as seen:', error);
    }
  }, [followers, setNotifications]);

  // Get recent followers (last 10) - with better error handling and debugging
  const getRecentFollowers = useCallback(async () => {
    try {
      console.log('🔍 getRecentFollowers called - total followers:', followers.length);
      
      if (followers.length === 0) {
        console.log('⚠️ No followers data available - trying to fetch...');
        // If no followers data, try to fetch it
        const freshFollowers = await fetchFollowers();
        if (freshFollowers.length === 0) {
          return [];
        }
        // Use the fresh data for filtering
        console.log('✅ Got fresh followers data:', freshFollowers.length);
      }
      
      const followersToFilter = followers.length > 0 ? followers : await fetchFollowers();
      
      // Check SecureStore for dismissed followers
      let seenFollowers = [];
      try {
        const seenFollowersData = await SecureStore.getItemAsync(SEEN_FOLLOWERS_KEY);
        seenFollowers = seenFollowersData ? JSON.parse(seenFollowersData) : [];
        console.log('📱 SecureStore - dismissed followers:', seenFollowers.length);
      } catch (storeError) {
        console.log('⚠️ SecureStore error, showing all followers:', storeError);
        seenFollowers = []; // If SecureStore fails, show all
      }
      
      // Filter out dismissed followers
      const filteredFollowers = followersToFilter.filter(follower => {
        const isDismissed = seenFollowers.includes(follower.id);
        if (isDismissed) {
          console.log('🚫 Filtering out dismissed follower:', follower.id, 'by', follower.follower.fname);
        }
        return !isDismissed;
      });
      
      console.log('✅ Final result - showing followers:', filteredFollowers.length, 'out of', followersToFilter.length);
      
      // Log the names of followers we're showing
      if (filteredFollowers.length > 0) {
        console.log('👥 Followers to show:', filteredFollowers.map(f => f.follower.fname));
      }
      
      return filteredFollowers
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);
    } catch (error) {
      console.error('❌ Error in getRecentFollowers:', error);
      // Fallback: return all followers if there's an error
      return followers
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);
    }
  }, [followers, fetchFollowers]);

  // Check if a follower is unseen (for UI display)
  const isFollowerUnseen = useCallback(async (followerId: string) => {
    try {
      const seenFollowersData = await SecureStore.getItemAsync(SEEN_FOLLOWERS_KEY);
      const seenFollowers = seenFollowersData ? JSON.parse(seenFollowersData) : [];
      return !seenFollowers.includes(followerId);
    } catch (error) {
      return true; // Default to unseen if error
    }
  }, []);

  // Dismiss a specific follower notification - save to SecureStore
  const dismissFollower = useCallback(async (followerId: string) => {
    try {
      // Add to seen followers list in SecureStore
      const seenFollowersData = await SecureStore.getItemAsync(SEEN_FOLLOWERS_KEY);
      const seenFollowers = seenFollowersData ? JSON.parse(seenFollowersData) : [];
      
      if (!seenFollowers.includes(followerId)) {
        const updatedSeenFollowers = [...seenFollowers, followerId];
        await SecureStore.setItemAsync(SEEN_FOLLOWERS_KEY, JSON.stringify(updatedSeenFollowers));
        
        console.log('✅ Follower dismissed and saved to SecureStore:', followerId);
        console.log('📱 Total dismissed followers:', updatedSeenFollowers.length);
      }
      
      // Update local state to remove from new followers count
      setNewFollowersCount(prev => Math.max(0, prev - 1));
      
      // Update notification store
      setNotifications({
        followerNotifications: Math.max(0, newFollowersCount - 1)
      });
    } catch (error) {
      console.error('❌ Failed to dismiss follower:', error);
    }
  }, [newFollowersCount, setNotifications]);

  // Initialize and set up polling
  useEffect(() => {
    if (isAuthenticated && user) {
      // Initial check with delay to avoid immediate rate limiting
      const initialTimeout = setTimeout(checkForNewFollowers, 2000);

      const interval = setInterval(checkForNewFollowers, 30000);

      return () => {
        clearTimeout(initialTimeout);
        clearInterval(interval);
      };
    } else {
      // Clear data when not authenticated
      setFollowers([]);
      setNewFollowersCount(0);
    }
  }, [isAuthenticated, user?.id]); // Remove checkForNewFollowers from dependencies

  // Pre-populate seen items with current API data (call this on app initialization)
  const initializeSeenFollowers = useCallback(async (currentFollowers: Follower[]) => {
    try {
      const existingSeenData = await SecureStore.getItemAsync(SEEN_FOLLOWERS_KEY);
      const existingSeenIds = existingSeenData ? JSON.parse(existingSeenData) : [];
      
      // Add all current follower IDs to seen list if not already there
      const allCurrentIds = currentFollowers.map(f => f.id);
      const newSeenIds = [...new Set([...existingSeenIds, ...allCurrentIds])];
      
      await SecureStore.setItemAsync(SEEN_FOLLOWERS_KEY, JSON.stringify(newSeenIds));
      console.log('✅ Initialized seen followers with', newSeenIds.length, 'items');
    } catch (error) {
      console.error('❌ Failed to initialize seen followers:', error);
    }
  }, []);

  // Clear stored data for testing
  const clearStoredData = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync(LAST_FOLLOWER_CHECK_KEY);
      await SecureStore.deleteItemAsync(SEEN_FOLLOWERS_KEY);
      setNewFollowersCount(0);
      
      // Clear follower notifications in store
      setNotifications({
        followerNotifications: 0
      });
      
      console.log('✅ Cleared stored follower data - refetching data...');
      
      // Refetch followers data after clearing storage
      console.log('🔄 Refetching followers data...');
      await fetchFollowers();
    } catch (error) {
      console.error('❌ Failed to clear stored data:', error);
    }
  }, [setNotifications, fetchFollowers]);

  // Debug function to check what's in SecureStore
  const checkSecureStore = useCallback(async () => {
    try {
      const seenFollowersData = await SecureStore.getItemAsync(SEEN_FOLLOWERS_KEY);
      const seenFollowers = seenFollowersData ? JSON.parse(seenFollowersData) : [];
      console.log('📱 SecureStore - Dismissed followers:', seenFollowers);
      return seenFollowers;
    } catch (error) {
      console.error('❌ Failed to check SecureStore:', error);
      return [];
    }
  }, []);

  return {
    followers,
    newFollowersCount,
    isLoading,
    fetchFollowers,
    checkForNewFollowers,
    markFollowersAsSeen,
    getRecentFollowers,
    isFollowerUnseen,
    dismissFollower,
    initializeSeenFollowers,
    checkSecureStore,
    clearStoredData,
  };
};
