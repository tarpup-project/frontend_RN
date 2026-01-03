import { CachedImageUtils } from '@/components/CachedImage';
import { useEffect } from 'react';

interface Member {
  id?: string;
  bgUrl?: string;
  fname?: string;
  name?: string;
}

interface Group {
  id: string;
  rawGroup?: {
    members?: Member[];
  };
  members?: Member[]; // Direct members property as fallback
}

export const useImagePreloader = (groups: Group[]) => {
  useEffect(() => {
    if (!groups || groups.length === 0) return;

    const preloadImages = async () => {
      try {
        // Extract all unique profile picture URLs
        const imageUrls: string[] = [];
        
        console.log('🔍 Analyzing', groups.length, 'groups for profile pictures...');
        
        groups.forEach((group, index) => {
          // Debug log the group structure
          if (index === 0) {
            console.log('📋 Sample group structure:', {
              id: group.id,
              hasRawGroup: !!group.rawGroup,
              hasDirectMembers: !!group.members,
              rawGroupMembers: group.rawGroup?.members?.length || 0,
              directMembers: group.members?.length || 0,
            });
          }
          
          // Check both rawGroup.members and direct members property
          const members = group.rawGroup?.members || group.members || [];
          
          members.forEach(member => {
            if (member?.bgUrl && !imageUrls.includes(member.bgUrl)) {
              imageUrls.push(member.bgUrl);
            }
          });
        });

        if (imageUrls.length > 0) {
          console.log('🖼️ Preloading', imageUrls.length, 'profile pictures...');
          
          // Preload images in background
          CachedImageUtils.preloadImages(imageUrls).catch(error => {
            console.warn('⚠️ Some images failed to preload:', error);
          });
        } else {
          console.log('ℹ️ No profile pictures found to preload');
        }
      } catch (error) {
        console.error('❌ Error in image preloader:', error);
      }
    };

    // Delay preloading to not interfere with initial render
    const timeoutId = setTimeout(preloadImages, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [groups]);
};

// Hook for cache management
export const useImageCacheManager = () => {
  const clearImageCache = async () => {
    try {
      await CachedImageUtils.clearCache();
      console.log('✅ Image cache cleared');
    } catch (error) {
      console.error('❌ Failed to clear image cache:', error);
    }
  };

  const getCacheSize = async (): Promise<string> => {
    try {
      const count = await CachedImageUtils.getCacheSize();
      return `${count} images`;
    } catch (error) {
      console.error('❌ Failed to get cache size:', error);
      return 'Unknown';
    }
  };

  return {
    clearImageCache,
    getCacheSize,
  };
};