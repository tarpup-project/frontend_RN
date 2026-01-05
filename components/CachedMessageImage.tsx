import { useMessageImageCache } from '@/hooks/useMessageImageCache';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

interface CachedMessageImageProps {
  uri: string;
  messageId: string;
  groupId: string;
  style?: any;
  fallbackText?: string;
  fallbackColor?: string;
  onLoad?: () => void;
  onError?: () => void;
  showLoadingIndicator?: boolean;
}

export const CachedMessageImage: React.FC<CachedMessageImageProps> = ({
  uri,
  messageId,
  groupId,
  style,
  fallbackText = '📷',
  fallbackColor = '#666666',
  onLoad,
  onError,
  showLoadingIndicator = true,
}) => {
  const [cachedUri, setCachedUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { getCachedImageUri, cacheImageUri } = useMessageImageCache();

  useEffect(() => {
    if (!uri || !messageId) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    loadImage();
  }, [uri, messageId]);

  const loadImage = async () => {
    try {
      setIsLoading(true);
      setHasError(false);
      
      // First, try to get cached URI
      const cached = await getCachedImageUri(uri, messageId);
      
      if (cached) {
        console.log('📸 Using cached message image:', messageId);
        setCachedUri(cached);
        setIsLoading(false);
        onLoad?.();
      } else {
        // No cache found, use original URI and cache it
        console.log('💾 Caching new message image:', messageId);
        await cacheImageUri(uri, messageId, groupId);
        setCachedUri(uri);
        setIsLoading(false);
        onLoad?.();
      }
    } catch (error) {
      console.error('❌ Failed to load message image:', error);
      // Fallback to original URI
      setCachedUri(uri);
      setIsLoading(false);
      setHasError(false);
      onLoad?.();
    }
  };

  if (hasError && !cachedUri) {
    return (
      <View style={[styles.fallback, { backgroundColor: fallbackColor }, style]}>
        <Text style={styles.fallbackText}>{fallbackText}</Text>
      </View>
    );
  }

  if (isLoading && !cachedUri && showLoadingIndicator) {
    return (
      <View style={[styles.fallback, { backgroundColor: fallbackColor }, style]}>
        <ActivityIndicator size="small" color="#FFFFFF" />
        <Text style={[styles.fallbackText, { fontSize: 10, marginTop: 4 }]}>
          Loading...
        </Text>
      </View>
    );
  }

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
        onError={(error) => {
          console.warn('❌ Message image load error:', error.nativeEvent.error);
          setHasError(true);
          setIsLoading(false);
          onError?.();
        }}
        resizeMode="cover"
      />
    );
  }

  // Final fallback
  return (
    <View style={[styles.fallback, { backgroundColor: fallbackColor }, style]}>
      <Text style={styles.fallbackText}>{fallbackText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  fallbackText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});

// Utility functions for message image cache management
export const MessageImageCacheUtils = {
  // Preload images for better chat performance
  preloadChatImages: async (messages: any[], groupId: string) => {
    try {
      console.log('🚀 Preloading', messages.length, 'message images for group:', groupId);
      
      const preloadPromises = messages.map(async (msg) => {
        if (msg.file?.data && msg.id) {
          const key = `message_image_${msg.id}_${msg.file.data.replace(/[^a-zA-Z0-9]/g, '_')}`;
          const existing = await AsyncStorage.getItem(key);
          
          if (!existing) {
            await AsyncStorage.setItem(key, msg.file.data);
            console.log('✅ Preloaded message image:', msg.id);
          }
        }
      });
      
      await Promise.allSettled(preloadPromises);
      console.log('✅ Message image preloading completed for group:', groupId);
    } catch (error) {
      console.error('❌ Failed to preload chat images:', error);
    }
  },

  // Get cache statistics for debugging
  getCacheInfo: async () => {
    try {
      const { getCacheStats } = require('@/hooks/useMessageImageCache');
      return await getCacheStats();
    } catch (error) {
      console.error('❌ Failed to get cache info:', error);
      return null;
    }
  },

  // Clear message image cache
  clearMessageImageCache: async () => {
    try {
      const { clearCache } = require('@/hooks/useMessageImageCache');
      await clearCache();
      console.log('✅ Message image cache cleared');
    } catch (error) {
      console.error('❌ Failed to clear message image cache:', error);
    }
  },
};