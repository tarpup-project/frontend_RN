import { api } from '@/api/client';
import { UrlConstants } from '@/constants/apiUrls';
import * as SecureStore from 'expo-secure-store';

const SEEN_FOLLOWERS_KEY = 'seen_followers';
const SEEN_POST_LIKES_KEY = 'seen_post_likes';

/**
 * Initialize SecureStore with existing follower and post like IDs
 * This prevents old items from showing as new notifications
 */
export const initializeNotificationStorage = async () => {
  try {
    console.log('🔄 Initializing notification storage with existing data...');
    
    // Initialize followers
    try {
      const followersResponse = await api.get(UrlConstants.fetchFollowers);
      if (followersResponse.data.status === 'success' && Array.isArray(followersResponse.data.data)) {
        const existingSeenData = await SecureStore.getItemAsync(SEEN_FOLLOWERS_KEY);
        const existingSeenIds = existingSeenData ? JSON.parse(existingSeenData) : [];
        
        const allCurrentIds = followersResponse.data.data.map((f: any) => f.id);
        const newSeenIds = [...new Set([...existingSeenIds, ...allCurrentIds])];
        
        await SecureStore.setItemAsync(SEEN_FOLLOWERS_KEY, JSON.stringify(newSeenIds));
        console.log('✅ Initialized seen followers with', newSeenIds.length, 'items');
      }
    } catch (error) {
      console.log('⚠️ Could not initialize followers (may be rate limited)');
    }
    
    // Initialize post likes
    try {
      const postLikesResponse = await api.get(UrlConstants.fetchPostLikes);
      if (postLikesResponse.data.status === 'success' && Array.isArray(postLikesResponse.data.data)) {
        const existingSeenData = await SecureStore.getItemAsync(SEEN_POST_LIKES_KEY);
        const existingSeenIds = existingSeenData ? JSON.parse(existingSeenData) : [];
        
        const allCurrentIds = postLikesResponse.data.data.map((pl: any) => pl.id);
        const newSeenIds = [...new Set([...existingSeenIds, ...allCurrentIds])];
        
        await SecureStore.setItemAsync(SEEN_POST_LIKES_KEY, JSON.stringify(newSeenIds));
        console.log('✅ Initialized seen post likes with', newSeenIds.length, 'items');
      }
    } catch (error) {
      console.log('⚠️ Could not initialize post likes (may be rate limited)');
    }
    
    console.log('✅ Notification storage initialization complete');
  } catch (error) {
    console.error('❌ Failed to initialize notification storage:', error);
  }
};

/**
 * Clear all notification storage (for testing)
 */
export const clearNotificationStorage = async () => {
  try {
    console.log('🧹 Clearing all notification storage...');
    await SecureStore.deleteItemAsync(SEEN_FOLLOWERS_KEY);
    await SecureStore.deleteItemAsync(SEEN_POST_LIKES_KEY);
    await SecureStore.deleteItemAsync('last_follower_check');
    await SecureStore.deleteItemAsync('last_post_likes_check');
    console.log('✅ Cleared all notification storage');
    console.log('🔄 Storage cleared - hooks should refetch data automatically');
  } catch (error) {
    console.error('❌ Failed to clear notification storage:', error);
  }
};