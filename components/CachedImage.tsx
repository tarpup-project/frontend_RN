import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

interface CachedImageProps {
  uri: string;
  style?: any;
  fallbackText?: string;
  fallbackColor?: string;
  cacheKey?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const CachedImage: React.FC<CachedImageProps> = ({
  uri,
  style,
  fallbackText = '?',
  fallbackColor = '#ff5f6d',
  cacheKey,
  onLoad,
  onError,
}) => {
  const [cachedUri, setCachedUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Start with false, only set to true if we need to download
  const [hasError, setHasError] = useState(false);

  const getCacheKey = (imageUri: string) => {
    if (cacheKey) return `cached_image_${cacheKey}`;
    // Create a simple hash from the URI
    return `cached_image_${imageUri.replace(/[^a-zA-Z0-9]/g, '_')}`;
  };

  useEffect(() => {
    if (!uri) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    loadCachedImage();
  }, [uri]);

  const loadCachedImage = async () => {
    try {
      const key = getCacheKey(uri);
      
      // Check if we have a cached URI in AsyncStorage
      const cachedUriFromStorage = await AsyncStorage.getItem(key);
      if (cachedUriFromStorage) {
        console.log('📸 Found cached URI on mount:', key);
        setCachedUri(cachedUriFromStorage);
        setIsLoading(false);
        setHasError(false);
        onLoad?.();
        return;
      }

      // No cache found, use original URI and cache it
      console.log('📥 Caching image URI:', key);
      await AsyncStorage.setItem(key, uri);
      setCachedUri(uri);
      setIsLoading(false);
      setHasError(false);
      onLoad?.();
    } catch (error) {
      console.warn('❌ Failed to load cached image:', error);
      // Fallback to original URI
      setCachedUri(uri);
      setIsLoading(false);
      setHasError(false);
      onLoad?.();
    }
  };

  if (hasError && !cachedUri) {
    // Only show fallback if we have an error AND no cached image
    return (
      <View style={[styles.fallback, { backgroundColor: fallbackColor }, style]}>
        <Text style={styles.fallbackText}>
          {fallbackText.charAt(0).toUpperCase()}
        </Text>
      </View>
    );
  }

  if (isLoading && !cachedUri) {
    // Only show loading fallback if we're loading AND have no cached image
    return (
      <View style={[styles.fallback, { backgroundColor: fallbackColor }, style]}>
        <Text style={styles.fallbackText}>
          {fallbackText.charAt(0).toUpperCase()}
        </Text>
      </View>
    );
  }

  // If we have a cached URI, show it immediately
  if (cachedUri) {
    return (
      <Image
        source={{ uri: cachedUri }}
        style={style}
        onLoad={() => {
          setIsLoading(false);
          setHasError(false);
          onLoad?.();
        }}
        onError={() => {
          console.warn('❌ Cached image load error, showing fallback');
          setHasError(true);
          setIsLoading(false);
          onError?.();
        }}
      />
    );
  }

  // Final fallback
  return (
    <View style={[styles.fallback, { backgroundColor: fallbackColor }, style]}>
      <Text style={styles.fallbackText}>
        {fallbackText.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50, // Will be overridden by parent style
  },
  fallbackText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16, // Will be adjusted by parent
  },
});

// Utility functions for cache management
export const CachedImageUtils = {
  // Clear all cached images
  clearCache: async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const imageKeys = keys.filter(key => key.startsWith('cached_image_'));
      
      if (imageKeys.length > 0) {
        await AsyncStorage.multiRemove(imageKeys);
        console.log('🗑️ Cleared', imageKeys.length, 'cached image URIs');
      }
    } catch (error) {
      console.error('❌ Failed to clear image cache:', error);
    }
  },

  // Get cache size (number of cached images)
  getCacheSize: async (): Promise<number> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const imageKeys = keys.filter(key => key.startsWith('cached_image_'));
      return imageKeys.length;
    } catch (error) {
      console.error('❌ Failed to get cache size:', error);
      return 0;
    }
  },

  // Preload images for better performance (cache URIs)
  preloadImages: async (uris: string[]) => {
    console.log('🚀 Preloading', uris.length, 'image URIs...');
    
    const promises = uris.map(async (uri) => {
      try {
        const key = `cached_image_${uri.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const existing = await AsyncStorage.getItem(key);
        
        if (!existing) {
          await AsyncStorage.setItem(key, uri);
          console.log('✅ Preloaded URI:', key);
        }
      } catch (error) {
        console.warn('❌ Failed to preload image URI:', uri);
      }
    });

    await Promise.allSettled(promises);
    console.log('🎉 Image URI preloading completed');
  },
};