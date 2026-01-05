import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect } from 'react';

interface MessageImage {
  id: string;
  uri: string;
  messageId: string;
  groupId: string;
  timestamp: number;
}

export const useMessageImageCache = () => {
  const CACHE_PREFIX = 'message_image_';
  const CACHE_INDEX_KEY = 'message_images_index';
  const MAX_CACHE_SIZE = 100; // Maximum number of images to cache
  const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

  // Get cached image URI
  const getCachedImageUri = useCallback(async (imageUri: string, messageId: string): Promise<string | null> => {
    try {
      const cacheKey = `${CACHE_PREFIX}${messageId}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (cachedData) {
        const imageData: MessageImage = JSON.parse(cachedData);
        
        // Check if cache is still valid (not expired)
        if (Date.now() - imageData.timestamp < CACHE_EXPIRY) {
          console.log('📸 Found cached message image:', messageId);
          return imageData.uri;
        } else {
          // Cache expired, remove it
          console.log('🗑️ Removing expired message image cache:', messageId);
          await AsyncStorage.removeItem(cacheKey);
          await removeFromIndex(messageId);
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Failed to get cached image:', error);
      return null;
    }
  }, []);

  // Cache image URI
  const cacheImageUri = useCallback(async (
    imageUri: string, 
    messageId: string, 
    groupId: string
  ): Promise<void> => {
    try {
      const cacheKey = `${CACHE_PREFIX}${messageId}`;
      const imageData: MessageImage = {
        id: messageId,
        uri: imageUri,
        messageId,
        groupId,
        timestamp: Date.now(),
      };
      
      // Store the image data
      await AsyncStorage.setItem(cacheKey, JSON.stringify(imageData));
      
      // Add to index for management
      await addToIndex(imageData);
      
      // Clean up old cache if needed
      await cleanupOldCache();
      
      console.log('💾 Cached message image:', messageId);
    } catch (error) {
      console.error('❌ Failed to cache image:', error);
    }
  }, []);

  // Add image to index for management
  const addToIndex = async (imageData: MessageImage) => {
    try {
      const indexData = await AsyncStorage.getItem(CACHE_INDEX_KEY);
      const index: MessageImage[] = indexData ? JSON.parse(indexData) : [];
      
      // Remove existing entry if it exists
      const filteredIndex = index.filter(item => item.id !== imageData.id);
      
      // Add new entry
      filteredIndex.push(imageData);
      
      await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(filteredIndex));
    } catch (error) {
      console.error('❌ Failed to update cache index:', error);
    }
  };

  // Remove image from index
  const removeFromIndex = async (messageId: string) => {
    try {
      const indexData = await AsyncStorage.getItem(CACHE_INDEX_KEY);
      if (indexData) {
        const index: MessageImage[] = JSON.parse(indexData);
        const filteredIndex = index.filter(item => item.id !== messageId);
        await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(filteredIndex));
      }
    } catch (error) {
      console.error('❌ Failed to remove from cache index:', error);
    }
  };

  // Clean up old cache entries
  const cleanupOldCache = async () => {
    try {
      const indexData = await AsyncStorage.getItem(CACHE_INDEX_KEY);
      if (!indexData) return;
      
      const index: MessageImage[] = JSON.parse(indexData);
      const now = Date.now();
      
      // Filter out expired entries
      const validEntries = index.filter(item => now - item.timestamp < CACHE_EXPIRY);
      
      // If we have too many entries, remove the oldest ones
      if (validEntries.length > MAX_CACHE_SIZE) {
        validEntries.sort((a, b) => b.timestamp - a.timestamp); // Sort by newest first
        const entriesToKeep = validEntries.slice(0, MAX_CACHE_SIZE);
        const entriesToRemove = validEntries.slice(MAX_CACHE_SIZE);
        
        // Remove old entries from AsyncStorage
        const removePromises = entriesToRemove.map(entry => 
          AsyncStorage.removeItem(`${CACHE_PREFIX}${entry.id}`)
        );
        await Promise.all(removePromises);
        
        // Update index
        await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(entriesToKeep));
        
        console.log('🧹 Cleaned up', entriesToRemove.length, 'old message image cache entries');
      } else if (validEntries.length !== index.length) {
        // Just remove expired entries
        const expiredEntries = index.filter(item => now - item.timestamp >= CACHE_EXPIRY);
        
        const removePromises = expiredEntries.map(entry => 
          AsyncStorage.removeItem(`${CACHE_PREFIX}${entry.id}`)
        );
        await Promise.all(removePromises);
        
        // Update index
        await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(validEntries));
        
        console.log('🗑️ Removed', expiredEntries.length, 'expired message image cache entries');
      }
    } catch (error) {
      console.error('❌ Failed to cleanup cache:', error);
    }
  };

  // Preload images for a group
  const preloadGroupImages = useCallback(async (messages: any[], groupId: string) => {
    try {
      const imageMessages = messages.filter(msg => msg.file?.data);
      
      if (imageMessages.length === 0) return;
      
      console.log('🚀 Preloading', imageMessages.length, 'message images for group:', groupId);
      
      const preloadPromises = imageMessages.map(async (msg) => {
        const cachedUri = await getCachedImageUri(msg.file.data, msg.id);
        if (!cachedUri) {
          await cacheImageUri(msg.file.data, msg.id, groupId);
        }
      });
      
      await Promise.allSettled(preloadPromises);
      console.log('✅ Message image preloading completed for group:', groupId);
    } catch (error) {
      console.error('❌ Failed to preload group images:', error);
    }
  }, [getCachedImageUri, cacheImageUri]);

  // Get cache statistics
  const getCacheStats = useCallback(async () => {
    try {
      const indexData = await AsyncStorage.getItem(CACHE_INDEX_KEY);
      const index: MessageImage[] = indexData ? JSON.parse(indexData) : [];
      
      const now = Date.now();
      const validEntries = index.filter(item => now - item.timestamp < CACHE_EXPIRY);
      const expiredEntries = index.length - validEntries.length;
      
      return {
        totalCached: validEntries.length,
        expired: expiredEntries,
        cacheSize: `${validEntries.length}/${MAX_CACHE_SIZE}`,
        oldestEntry: validEntries.length > 0 ? 
          new Date(Math.min(...validEntries.map(e => e.timestamp))).toLocaleDateString() : 
          'None',
      };
    } catch (error) {
      console.error('❌ Failed to get cache stats:', error);
      return {
        totalCached: 0,
        expired: 0,
        cacheSize: '0/100',
        oldestEntry: 'Unknown',
      };
    }
  }, []);

  // Clear all message image cache
  const clearCache = useCallback(async () => {
    try {
      const indexData = await AsyncStorage.getItem(CACHE_INDEX_KEY);
      if (indexData) {
        const index: MessageImage[] = JSON.parse(indexData);
        
        // Remove all cached images
        const removePromises = index.map(entry => 
          AsyncStorage.removeItem(`${CACHE_PREFIX}${entry.id}`)
        );
        await Promise.all(removePromises);
        
        // Clear index
        await AsyncStorage.removeItem(CACHE_INDEX_KEY);
        
        console.log('🗑️ Cleared all message image cache (', index.length, 'images)');
      }
    } catch (error) {
      console.error('❌ Failed to clear message image cache:', error);
    }
  }, []);

  // Initialize cache cleanup on mount
  useEffect(() => {
    const initializeCache = async () => {
      await cleanupOldCache();
    };
    
    initializeCache();
  }, []);

  return {
    getCachedImageUri,
    cacheImageUri,
    preloadGroupImages,
    getCacheStats,
    clearCache,
  };
};