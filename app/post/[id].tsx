import { api } from "@/api/client";
import { UrlConstants } from "@/constants/apiUrls";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuthStore } from "@/state/authStore";
import { getAccessToken } from "@/utils/storage";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import moment from "moment";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";

export default function PostPreviewScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const [currentPostItem, setCurrentPostItem] = useState<any | null>(null);
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [currentImageIds, setCurrentImageIds] = useState<(string | null)[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [allPostItems, setAllPostItems] = useState<any[]>([]); // Track all items for stacked posts
  const [serverPosts, setServerPosts] = useState<any[]>([]); // All posts from server
  const [globalPosts, setGlobalPosts] = useState<any[]>([]); // All posts from world view
  const [viewedPosts, setViewedPosts] = useState<Set<string>>(new Set()); // Track viewed posts
  const [allAvailablePosts, setAllAvailablePosts] = useState<any[]>([]); // All posts available for browsing
  const [currentPostIndex, setCurrentPostIndex] = useState(0); // Index in all available posts
  const [isLoadingGlobalPosts, setIsLoadingGlobalPosts] = useState(false);
  const [arrowVisible, setArrowVisible] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userStats, setUserStats] = useState<{
    prompts: number;
    posts: number;
    followers: number;
    followings: number;
    totalMatches: number;
    activeGroups: number;
    avgCompatibility: number;
    interests: string[];
  } | null>(null);
  const [isLoadingUserStats, setIsLoadingUserStats] = useState(false);
  const translateY = useSharedValue(0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [replyingToID, setReplyingToID] = useState<string | null>(null);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSendingComment, setIsSendingComment] = useState(false);
  const commentsScrollRef = useRef<FlatList | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [following, setFollowing] = useState(false);
  const [friendStatus, setFriendStatus] = useState<"not_friends" | "pending" | "friends">("not_friends");
  const [commentCount, setCommentCount] = useState(0);
  const [buttonsVisible, setButtonsVisible] = useState(true);
  const buttonsOpacity = useRef(new Animated.Value(1)).current;
  const buttonsScale = useRef(new Animated.Value(1)).current;

  // Function to mark post as viewed (remove red border)
  const markPostAsViewed = async (postId: string) => {
    try {
      // Call the global function to update the tarps screen
      if ((global as any).markPostsAsViewed) {
        (global as any).markPostsAsViewed([postId]);
      }
      
      const knownPostsData = await AsyncStorage.getItem('knownPosts');
      if (knownPostsData) {
        const knownPostsArray = JSON.parse(knownPostsData);
        const knownPostsMap = new Map(knownPostsArray);
        
        // The post should already be in known posts, just log that it's been viewed
        if (knownPostsMap.has(postId)) {
          console.log('Post marked as viewed:', postId);
        }
      }
    } catch (error) {
      console.error('Error marking post as viewed:', error);
    }
  };

  // Function to mark multiple posts as viewed (for stacked posts)
  const markMultiplePostsAsViewed = async (postIds: string[]) => {
    try {
      // Call the global function to update the tarps screen
      if ((global as any).markPostsAsViewed) {
        (global as any).markPostsAsViewed(postIds);
      }
      
      console.log('Multiple posts marked as viewed:', postIds);
    } catch (error) {
      console.error('Error marking multiple posts as viewed:', error);
    }
  };

  // Function to animate buttons hide/show
  const hideButtons = () => {
    if (!buttonsVisible) return;
    Animated.parallel([
      Animated.timing(buttonsOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(buttonsScale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setButtonsVisible(false);
    });
  };

  const showButtons = () => {
    if (buttonsVisible) return;
    Animated.parallel([
      Animated.timing(buttonsOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(buttonsScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setButtonsVisible(true);
    });
  };

  const toggleButtonsVisibility = () => {
    if (buttonsVisible) {
      hideButtons();
    } else {
      showButtons();
    }
  };

  const pressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePressIn = () => {
    // Set a timeout to hide buttons only after a delay (press and hold)
    pressTimeoutRef.current = setTimeout(() => {
      hideButtons();
    }, 200); // 200ms delay to distinguish between tap and hold
  };

  const handlePressOut = () => {
    // Clear the timeout if user releases before the delay
    if (pressTimeoutRef.current) {
      clearTimeout(pressTimeoutRef.current);
      pressTimeoutRef.current = null;
    }
    
    // If buttons are hidden (meaning it was a hold), show them back
    if (!buttonsVisible) {
      showButtons();
    }
  };

  // Function to fetch user stats
  const fetchUserStats = async () => {
    if (isLoadingUserStats) return;
    
    try {
      setIsLoadingUserStats(true);
      const response = await api.get('/user/stats');
      console.log('User stats response:', JSON.stringify(response, null, 2));
      
      if (response.data?.status === 'success' && response.data?.data) {
        setUserStats(response.data.data);
      } else {
        console.log('Failed to load user stats:', response.data);
      }
    } catch (error: any) {
      console.error('Error fetching user stats:', error);
    } finally {
      setIsLoadingUserStats(false);
    }
  };

  const loadGlobalPosts = async () => {
    if (isLoadingGlobalPosts) return;
    
    try {
      setIsLoadingGlobalPosts(true);
      
      // World view parameters - covers the entire globe
      const worldViewport = {
        minLat: -90,
        maxLat: 90,
        minLng: -180,
        maxLng: 180,
        zoomLevel: 1 // World zoom level
      };
      
      const query = new URLSearchParams({
        minLat: worldViewport.minLat.toString(),
        maxLat: worldViewport.maxLat.toString(),
        minLng: worldViewport.minLng.toString(),
        maxLng: worldViewport.maxLng.toString(),
        zoomLevel: worldViewport.zoomLevel.toString(),
      });
      
      const url = `/tarps/posts?${query.toString()}`;
      console.log("Loading global posts:", { url, viewport: worldViewport });
      
      const res = await api.get(url);
      console.log("Global posts response:", { status: res?.status, ok: res?.status >= 200 && res?.status < 300 });
      
      const list = (res as any).data?.data || (res as any).data?.posts || (res as any).data;
      console.log("Global posts raw data:", { isArray: Array.isArray(list), length: Array.isArray(list) ? list.length : undefined });
      
      // Process the posts similar to loadPostsInView
      const resolveImageUrl = (item: any): string | null => {
        if (!item || typeof item !== "object") return null;
        const candidates: any[] = [
          item.imageUrl, item.photoUrl, item.image, item.coverUrl, item.thumbnail, item.thumbUrl, item.bgUrl, item.url,
          item?.image?.url, item?.photo?.url,
          Array.isArray(item.images) ? (typeof item.images[0] === "string" ? item.images[0] : item.images[0]?.url) : null,
          Array.isArray(item.files) ? (typeof item.files[0] === "string" ? item.files[0] : item.files[0]?.url) : null,
          Array.isArray(item.medias) ? (typeof item.medias[0] === "string" ? item.medias[0] : item.medias[0]?.url) : null,
        ];
        const raw = candidates.find((v) => typeof v === "string" && v.length > 0) ?? null;
        if (!raw) return null;
        if (/^https?:\/\//i.test(raw)) return raw;
        return `${UrlConstants.baseUrl}${raw.startsWith("/") ? "" : "/"}${raw}`;
      };
      
      let mapped: any[] = [];
      if (Array.isArray(list)) {
        const looksLikeGrid = list.length > 0 && typeof list[0]?.avgLat === "number" && typeof list[0]?.avgLng === "number" && "result" in list[0];
        if (looksLikeGrid) {
          // Grid format - flatten all items
          mapped = list.flatMap((cell: any) => {
            const items = Array.isArray(cell.result) ? cell.result : [];
            return items.filter((item: any) => resolveImageUrl(item));
          });
        } else {
          // Direct posts format
          mapped = list.filter((p: any) => resolveImageUrl(p));
        }
      }
      
      setGlobalPosts(mapped);
      console.log("Global posts loaded:", { count: mapped.length });
      
      return mapped;
    } catch (e: any) {
      console.log("Global posts error:", { status: e?.response?.status, data: e?.response?.data, message: e?.message });
      toast.error("Failed to load global posts");
      return [];
    } finally {
      setIsLoadingGlobalPosts(false);
    }
  };

  useEffect(() => {
    try {
      const rawItem = typeof params.item === "string" ? params.item : undefined;
      const rawImages = typeof params.images === "string" ? params.images : undefined;
      const rawAllItems = typeof params.allItems === "string" ? params.allItems : undefined;
      const rawServerPosts = typeof params.serverPosts === "string" ? params.serverPosts : undefined;
      const openCommentsParam = params.openComments === "true";
      
      const parsedItem = rawItem ? JSON.parse(decodeURIComponent(rawItem)) : null;
      const parsedImages = rawImages ? JSON.parse(decodeURIComponent(rawImages)) : null;
      const parsedAllItems = rawAllItems ? JSON.parse(decodeURIComponent(rawAllItems)) : [];
      const parsedServerPosts = rawServerPosts ? JSON.parse(decodeURIComponent(rawServerPosts)) : [];
      
      const urls: string[] = Array.isArray(parsedImages?.urls) ? parsedImages.urls.filter((u: any) => typeof u === "string") : [];
      const ids: (string | null)[] = Array.isArray(parsedImages?.ids) ? parsedImages.ids.map((x: any) => (x != null ? String(x) : null)) : [];
      
      console.log("Post initialization debug:", {
        parsedImages,
        urls: urls.length,
        ids: ids.length,
        parsedItem: parsedItem?.id,
        parsedItemImages: parsedItem?.images?.map((img: any) => ({ id: img.id, url: img.url?.substring(0, 50) })),
        extractedImageId: parsedItem ? extractImageId(parsedItem) : null
      });
      
      setCurrentPostItem(parsedItem);
      setCurrentImages(urls.length > 0 ? urls : parsedItem ? [extractImageUrl(parsedItem) as string].filter(Boolean) : []);
      setCurrentImageIds(ids.length > 0 ? ids : parsedItem ? [extractImageId(parsedItem)] : []);
      setAllPostItems(parsedAllItems.length > 0 ? parsedAllItems : [parsedItem].filter(Boolean));
      setServerPosts(parsedServerPosts);
      
      // Load global posts for browsing
      loadGlobalPosts().then((globalPostsList) => {
        // Mark current post as viewed and set up all available posts
        if (parsedItem?.id) {
          // Mark post as viewed to remove red border
          markPostAsViewed(parsedItem.id);
          
          // If this is a stacked post with multiple items, mark all as viewed
          if (parsedAllItems.length > 1) {
            const allPostIds = parsedAllItems.map((item: any) => item.id).filter(Boolean);
            markMultiplePostsAsViewed(allPostIds);
          }
          
          setViewedPosts(new Set([parsedItem.id]));
          
          // Combine server posts and global posts, remove duplicates
          const allPosts = [
            ...(Array.isArray(parsedServerPosts) ? parsedServerPosts : []), 
            ...(Array.isArray(globalPostsList) ? globalPostsList : [])
          ]
            .flatMap((post: any) => post.items || [post])
            .filter((item: any, index: any, arr: any) => 
              item.id && arr.findIndex((p: any) => p.id === item.id) === index
            );
          
          setAllAvailablePosts(allPosts);
          
          // Find current post index in the combined list
          const currentIndex = allPosts.findIndex((post: any) => post.id === parsedItem.id);
          setCurrentPostIndex(currentIndex >= 0 ? currentIndex : 0);
          
          console.log("All posts setup:", { 
            totalPosts: allPosts.length,
            currentIndex: currentIndex >= 0 ? currentIndex : 0,
            currentPostId: parsedItem.id
          });
        }
      });
      
      console.log("Post screen initialized:", { 
        hasAllItems: parsedAllItems.length > 0, 
        allItemsCount: parsedAllItems.length,
        imagesCount: urls.length,
        isStackedPost: parsedAllItems.length > 1,
        serverPostsCount: parsedServerPosts.length,
        loadingGlobalPosts: true
      });
      
      const idx = typeof params.idx === "string" ? Number(params.idx) : 0;
      setCurrentImageIndex(isNaN(idx) ? 0 : Math.max(0, Math.min(urls.length - 1, idx)));
      
      if (parsedItem) {
        setLiked(extractLiked(parsedItem));
        setLikeCount(extractLikeCount(parsedItem));
        setFollowing(extractFollowing(parsedItem));
        setFriendStatus(typeof parsedItem?.isFriend === "string" ? parsedItem.isFriend : "not_friends");
        setCommentCount(
          typeof parsedItem?.commentsCount === "number"
            ? parsedItem.commentsCount
            : Array.isArray(parsedItem?.comments)
            ? parsedItem.comments.length
            : Array.isArray(parsedItem?.images) && typeof parsedItem.images[0]?.comments === "number"
            ? parsedItem.images[0].comments
            : 0
        );
      }
      
      // Auto-open comments if requested
      if (openCommentsParam) {
        setTimeout(() => {
          setCommentsOpen(true);
        }, 500); // Small delay to ensure the screen is loaded
      }
    } catch {
      toast.error("Failed to open post");
      router.back();
    }
  }, [params.item, params.images, params.allItems, params.idx, params.openComments, params.serverPosts]);

  // Blinking arrow effect
  useEffect(() => {
    const interval = setInterval(() => {
      setArrowVisible(prev => !prev);
    }, 800); // Blink every 800ms

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!commentsOpen) return;
    const imageID = getCurrentImageId();
    if (!imageID) return;
    let cancelled = false;
    const run = async () => {
      try {
        setIsLoadingComments(true);
        const res = await api.get(UrlConstants.tarpPostComments(imageID));
        if (cancelled) return;
        const list = (res as any)?.data?.data ?? (res as any)?.data?.comments ?? (res as any)?.data;
        setComments(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) {
          toast.error("Failed to fetch comments");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingComments(false);
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [commentsOpen, currentImageIndex, currentPostItem]);

  const extractImageUrl = (item: any): string | null => {
    if (!item || typeof item !== "object") return null;
    const cands: any[] = [
      item.imageUrl, item.photoUrl, item.image, item.coverUrl, item.thumbnail, item.thumbUrl, item.bgUrl, item.url,
      item?.image?.url, item?.photo?.url,
      Array.isArray(item.images) ? (typeof item.images[0] === "string" ? item.images[0] : item.images[0]?.url) : null,
      Array.isArray(item.files) ? (typeof item.files[0] === "string" ? item.files[0] : item.files[0]?.url) : null,
      Array.isArray(item.medias) ? (typeof item.medias[0] === "string" ? item.medias[0] : item.medias[0]?.url) : null,
    ];
    const raw = cands.find((v) => typeof v === "string" && v.length > 0) ?? null;
    if (!raw) return null;
    if (/^https?:\/\//i.test(raw)) return raw;
    return `${UrlConstants.baseUrl}${raw.startsWith("/") ? "" : "/"}${raw}`;
  };

  const extractImageId = (item: any): string | null => {
    // First try to get the actual image ID from the images array
    if (Array.isArray(item?.images) && item.images.length > 0) {
      // Use the current image index if available, otherwise use first image
      const targetIndex = currentImageIndex < item.images.length ? currentImageIndex : 0;
      const image = item.images[targetIndex];
      if (image?.id) {
        console.log("Found image ID from images array:", {
          imageId: image.id,
          index: targetIndex,
          totalImages: item.images.length
        });
        return String(image.id);
      }
    }
    
    // Fallback to other possible image ID fields (less likely to be correct)
    const candidates: any[] = [
      item?.imageId, 
      item?.imageID, 
      item?.postImageID, 
      item?.postImageId,
      Array.isArray(item?.files) ? item.files[0]?.id : null,
      Array.isArray(item?.medias) ? item.medias[0]?.id : null,
    ];
    
    const v = candidates.find((x) => typeof x === "string" || typeof x === "number");
    const result = v != null ? String(v) : null;
    
    console.log("extractImageId debug:", {
      hasImages: Array.isArray(item?.images),
      imagesLength: item?.images?.length,
      currentImageIndex,
      targetImageId: item?.images?.[currentImageIndex]?.id,
      firstImageId: item?.images?.[0]?.id,
      candidates,
      result,
      postId: item?.id
    });
    
    // Only use post ID as absolute last resort and log a warning
    if (!result && item?.id) {
      console.warn("⚠️ Using post ID as image ID - this will likely cause a 500 error:", item.id);
      return String(item.id);
    }
    
    return result;
  };

  const getCurrentImageId = (): string | null => {
    // Get the current post item (handles stacked posts)
    const activeItem = getCurrentPostItem();
    
    if (!activeItem) {
      console.log("No active item found");
      return null;
    }
    
    // If the post has images array, get the image ID based on current index
    if (activeItem.images && Array.isArray(activeItem.images) && activeItem.images.length > 0) {
      // Use currentImageIndex to get the specific image being viewed
      const currentImage = activeItem.images[currentImageIndex] || activeItem.images[0];
      if (currentImage?.id) {
        console.log("Using image ID from current image:", {
          currentImageIndex,
          imageId: currentImage.id,
          totalImages: activeItem.images.length,
          allImageIds: activeItem.images.map((img: any) => img.id)
        });
        return String(currentImage.id);
      }
    }
    
    // Fallback: try to get from currentImageIds array (from URL params)
    const id = currentImageIds[currentImageIndex];
    if (id && id !== activeItem.id) {
      console.log("Using image ID from currentImageIds:", id);
      return id;
    }
    
    // Last resort: use extractImageId function
    const fallbackId = extractImageId(activeItem);
    
    console.log("getCurrentImageId debug:", {
      currentImageIndex,
      activeItemId: activeItem.id,
      activeItemImages: activeItem.images?.length || 0,
      currentImageIds: currentImageIds.length,
      fallbackId,
      warning: fallbackId === activeItem.id ? "Using post ID as image ID - this will likely fail" : null
    });
    
    return fallbackId;
  };

  const extractLocationName = (item: any): string => {
    const v =
      item?.locationName ??
      item?.placeName ??
      item?.location ??
      item?.place ??
      item?.city ??
      item?.owner?.locationName ??
      item?.owner?.location ??
      item?.creator?.locationName ??
      item?.creator?.location ??
      "";
    
    const locationString = typeof v === "string" && v.length > 0 ? v : "Location";
    
    // Format location to show only state and country
    if (locationString === "Location") return locationString;
    
    // Split by comma and get the last two parts (state, country)
    const parts = locationString.split(',').map(part => part.trim());
    
    if (parts.length >= 2) {
      // Get the last two parts and remove any numbers (zip codes)
      let state = parts[parts.length - 2].replace(/\d+/g, '').trim();
      const country = parts[parts.length - 1].replace(/\d+/g, '').trim();
      
      // If state is empty after removing numbers, try the part before it
      if (!state && parts.length >= 3) {
        state = parts[parts.length - 3].replace(/\d+/g, '').trim();
      }
      
      return state && country ? `${state}, ${country}` : locationString;
    }
    
    // If less than 2 parts, return as is (but remove numbers)
    return locationString.replace(/\d+/g, '').trim();
  };

  const extractLiked = (item: any): boolean => {
    // First try to get from current image's _count data
    if (item?.images && Array.isArray(item.images) && currentImageIndex < item.images.length) {
      const currentImage = item.images[currentImageIndex];
      if (currentImage?._count?.tarpImgLikes > 0) {
        console.log("Extracted liked from current image _count:", currentImage._count.tarpImgLikes);
        return true;
      }
      if (typeof currentImage?.hasLiked === "boolean") {
        console.log("Extracted liked from current image hasLiked:", currentImage.hasLiked);
        return currentImage.hasLiked;
      }
    }
    
    // Fallback to other methods
    const v =
      item?.likedByMe ??
      item?.isLiked ??
      item?.hasLiked ??
      item?.liked ??
      item?.owner?.likedByMe;
    if (typeof v === "boolean") return v;
    
    if (Array.isArray(item?.images) && item.images[0] && typeof item.images[0]?.hasLiked === "boolean") {
      return item.images[0].hasLiked;
    }
    if (Array.isArray(item?.likes) && user?.id) return !!item.likes.find((u: any) => String(u?.id) === String(user.id));
    return false;
  };
  
  const extractLikeCount = (item: any): number => {
    // First try to get from current image's _count data
    if (item?.images && Array.isArray(item.images) && currentImageIndex < item.images.length) {
      const currentImage = item.images[currentImageIndex];
      if (typeof currentImage?._count?.tarpImgLikes === "number") {
        console.log("Extracted like count from current image _count:", currentImage._count.tarpImgLikes);
        return currentImage._count.tarpImgLikes;
      }
      if (typeof currentImage?.likes === "number") {
        console.log("Extracted like count from current image likes:", currentImage.likes);
        return currentImage.likes;
      }
    }
    
    // Fallback to other methods
    const cands = [
      Array.isArray(item?.images) && item.images[0] && typeof item.images[0]?.likes === "number" ? item.images[0].likes : undefined,
      item?.likesCount,
      item?.numLikes,
      item?.reactions?.likes,
      item?.likes?.length,
    ];
    const v = cands.find((x) => typeof x === "number");
    return typeof v === "number" && v >= 0 ? v : 0;
  };
  const extractFollowing = (item: any): boolean => {
    const v = item?.isFollowing ?? item?.following ?? item?.owner?.isFollowing ?? item?.owner?.following ?? item?.creator?.isFollowing;
    return typeof v === "boolean" ? v : false;
  };
  const getCurrentPostItem = (): any => {
    if (allPostItems.length > 0 && currentImageIndex < allPostItems.length) {
      return allPostItems[currentImageIndex];
    }
    return currentPostItem;
  };

  const syncImageMeta = (idx: number) => {
    console.log("Syncing image meta for index:", idx, "allItems count:", allPostItems.length);
    const activeItem = getCurrentPostItem();
    if (!activeItem) return;
    
    console.log("Active item:", { id: activeItem.id, caption: activeItem.caption?.substring(0, 50) });
    
    // Update the current post item to the one corresponding to this image
    setCurrentPostItem(activeItem);
    
    // Mark this post as viewed when navigating to it
    if (activeItem?.id) {
      markPostAsViewed(activeItem.id);
    }
    
    // Get the specific image data for the current index
    let currentImageData = null;
    if (activeItem.images && Array.isArray(activeItem.images) && idx < activeItem.images.length) {
      currentImageData = activeItem.images[idx];
      console.log("Current image data:", {
        imageId: currentImageData.id,
        likes: currentImageData._count?.tarpImgLikes || currentImageData.likes || 0,
        hasLiked: currentImageData.hasLiked,
        comments: currentImageData._count?.tarpImgComments || currentImageData.comments || 0
      });
    }
    
    // Use image-specific data if available, otherwise fall back to item-level data
    const likedVal = currentImageData?.hasLiked ?? extractLiked(activeItem);
    const likeCountVal = currentImageData?._count?.tarpImgLikes ?? currentImageData?.likes ?? extractLikeCount(activeItem);
    const commentCountVal = currentImageData?._count?.tarpImgComments ?? currentImageData?.comments ?? 
      (Array.isArray(activeItem.comments) ? activeItem.comments.length : 0);
    
    console.log("Setting like state:", {
      liked: !!likedVal,
      likeCount: typeof likeCountVal === "number" ? likeCountVal : 0,
      commentCount: typeof commentCountVal === "number" ? commentCountVal : 0
    });
    
    setLiked(!!likedVal);
    setLikeCount(typeof likeCountVal === "number" ? likeCountVal : 0);
    setCommentCount(typeof commentCountVal === "number" ? commentCountVal : 0);
  };

  const toggleLike = async (action: "like" | "unlike") => {
    const activeItem = getCurrentPostItem();
    const imageID = getCurrentImageId();
    
    console.log("toggleLike debug:", {
      action,
      imageID,
      activeItem: activeItem?.id,
      currentImageIndex,
      currentImageIds: currentImageIds.length,
      hasActiveItem: !!activeItem,
      currentLikedState: liked,
      currentLikeCount: likeCount,
      extractedLiked: extractLiked(activeItem),
      extractedLikeCount: extractLikeCount(activeItem)
    });
    
    if (!imageID) {
      console.error("No imageID found for like action");
      toast.error("Unable to find image to like");
      return;
    }
    
    try {
      console.log("Making like API call:", { imageID, action });
      
      // Server expects simple action values without extra quotes
      const serverAction = action;
      
      const payload = {
        imageID: imageID,
        action: serverAction
      };
      
      console.log("Request payload with simple action:", JSON.stringify(payload));
      console.log("Request URL:", UrlConstants.tarpLikePost);
      console.log("Current auth token exists:", !!(await getAccessToken()));
      
      const response = await api.post(UrlConstants.tarpLikePost, payload);
      
      console.log("Like API success:", response.data);
      
      if (action === "like") {
        setLiked(true);
        setLikeCount((c) => c + 1);
      } else {
        setLiked(false);
        setLikeCount((c) => (c > 0 ? c - 1 : 0));
      }
      toast.success(action === "like" ? "Liked" : "Unliked");
    } catch (error: any) {
      console.error("Like API error:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      
      if (error.response?.status === 401) {
        toast.error("Authentication error. Please log in again.");
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to like this post.");
      } else {
        toast.error(`Failed to ${action} post`);
      }
    }
  };
  const toggleFriend = async (action: "friend" | "unfriend") => {
    const activeItem = getCurrentPostItem();
    const uid =
      activeItem?.userID ??
      activeItem?.creator?.id ??
      activeItem?.owner?.id ??
      activeItem?.user?.id ??
      activeItem?.createdBy?.id ??
      activeItem?.author?.id;
    if (!uid) return;
    try {
      await api.post(UrlConstants.tarpToggleFriend, { userID: String(uid), action });
      if (action === "friend") {
        setFriendStatus("pending");
        toast.success("Friend request sent");
      } else {
        setFriendStatus("not_friends");
        toast.success("Unfriended");
      }
    } catch {
      toast.error("Failed to toggle friend");
    }
  };
  const toggleFollow = async (action: "follow" | "unfollow") => {
    const activeItem = getCurrentPostItem();
    const uid =
      activeItem?.userID ??
      activeItem?.creator?.id ??
      activeItem?.owner?.id ??
      activeItem?.user?.id ??
      activeItem?.createdBy?.id ??
      activeItem?.author?.id;
    if (!uid) return;
    try {
      await api.post(UrlConstants.tarpToggleFollow, { userID: String(uid), action });
      setFollowing(action === "follow");
      toast.success(action === "follow" ? "Following" : "Unfollowed");
    } catch {
      toast.error("Failed to toggle follow");
    }
  };

  const navigateToPost = (direction: 'next' | 'previous') => {
    if (allAvailablePosts.length === 0) {
      toast.success("No posts available");
      return;
    }

    if (direction === 'next') {
      // Swipe up - go to next unviewed post
      let foundUnviewed = false;
      let newIndex = currentPostIndex;
      
      // Look for next unviewed post
      for (let i = 1; i <= allAvailablePosts.length; i++) {
        const candidateIndex = (currentPostIndex + i) % allAvailablePosts.length;
        const candidate = allAvailablePosts[candidateIndex];
        
        if (candidate && !viewedPosts.has(candidate.id)) {
          newIndex = candidateIndex;
          foundUnviewed = true;
          break;
        }
      }
      
      if (!foundUnviewed) {
        toast.success("🎉 You've seen all the posts! Great exploring!");
        return;
      }
      
      const targetPost = allAvailablePosts[newIndex];
      updateCurrentPost(targetPost, newIndex, 'next');
      
    } else {
      // Swipe down - go to previous post (allow reviewing viewed posts)
      const newIndex = currentPostIndex === 0 ? allAvailablePosts.length - 1 : currentPostIndex - 1;
      const targetPost = allAvailablePosts[newIndex];
      
      if (!targetPost) {
        toast.error("Post not found");
        return;
      }
      
      updateCurrentPost(targetPost, newIndex, 'previous');
    }
  };

  const updateCurrentPost = (targetPost: any, newIndex: number, direction: 'next' | 'previous') => {
    // Mark as viewed
    setViewedPosts(prev => new Set([...prev, targetPost.id]));
    setCurrentPostIndex(newIndex);
    
    // Update current post data
    setCurrentPostItem(targetPost);
    const imageUrl = extractImageUrl(targetPost);
    const imageId = extractImageId(targetPost);
    
    setCurrentImages(imageUrl ? [imageUrl] : []);
    setCurrentImageIds(imageId ? [imageId] : []);
    setCurrentImageIndex(0);
    setAllPostItems([targetPost]);
    
    // Update post metadata
    setLiked(extractLiked(targetPost));
    setLikeCount(extractLikeCount(targetPost));
    setFollowing(extractFollowing(targetPost));
    setFriendStatus(typeof targetPost?.isFriend === "string" ? targetPost.isFriend : "not_friends");
    setCommentCount(
      typeof targetPost?.commentsCount === "number"
        ? targetPost.commentsCount
        : Array.isArray(targetPost?.comments)
        ? targetPost.comments.length
        : 0
    );
    
    const unviewedCount = allAvailablePosts.filter(p => !viewedPosts.has(p.id) && p.id !== targetPost.id).length;
    
    console.log(`Navigated ${direction}:`, { 
      postId: targetPost.id, 
      newIndex,
      totalPosts: allAvailablePosts.length,
      viewedCount: viewedPosts.size + 1,
      remainingUnviewed: unviewedCount
    });
  };

  // Gesture handler for vertical swipe (both up and down)
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Allow both upward and downward swipes
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      const swipeThreshold = 100; // Minimum swipe distance
      const velocityThreshold = 500; // Minimum swipe velocity
      
      if (event.translationY < -swipeThreshold || event.velocityY < -velocityThreshold) {
        // Swipe up - next post
        runOnJS(navigateToPost)('next');
      } else if (event.translationY > swipeThreshold || event.velocityY > velocityThreshold) {
        // Swipe down - previous post
        runOnJS(navigateToPost)('previous');
      }
      
      // Reset animation
      translateY.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const sendComment = async () => {
    const imageID = getCurrentImageId();
    const msg = commentText.trim();
    
    // Prevent double submissions
    if (!imageID || msg.length === 0 || isSendingComment) return;
    
    try {
      setIsSendingComment(true);
      const body = { message: msg, ...(replyingToID ? { replyingToID } : {}) };
      await api.post(UrlConstants.tarpPostComments(imageID), body);
      setCommentText("");
      setReplyingToID(null);
      
      // Refresh comments
      try {
        setIsLoadingComments(true);
        const res = await api.get(UrlConstants.tarpPostComments(imageID));
        const list = (res as any)?.data?.data ?? (res as any)?.data?.comments ?? (res as any)?.data;
        setComments(Array.isArray(list) ? list : []);
      } finally {
        setIsLoadingComments(false);
      }
      toast.success("Comment posted");
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setIsSendingComment(false);
    }
  };
  // Removed scroll control functions for performance
  const getCommentId = (c: any): string | null => {
    const v = c?.id ?? c?._id ?? c?.commentId ?? c?.commentID ?? c?.comment_id;
    return v != null ? String(v) : null;
  };
  const getParentId = (c: any): string | null => {
    const v =
      c?.replyingToID ??
      c?.replyingToId ??
      c?.parentID ??
      c?.parentId ??
      c?.parentCommentId ??
      c?.parent_comment_id ??
      c?.reply_to_comment_id ??
      c?.inReplyTo ??
      c?.replyTo;
    return v != null ? String(v) : null;
  };
  const getAvatarUrl = (c: any): string | null => {
    const u = c?.commenter ?? c?.user ?? c?.author;
    if (!u) return null;
    return extractImageUrl(u);
  };
  const getDisplayName = (c: any): string => {
    const u = c?.commenter ?? c?.user ?? c?.author ?? {};
    const name =
      `${u?.fname ?? ""} ${u?.lname ?? ""}`.trim() ||
      u?.name ||
      u?.username ||
      "User";
    return typeof name === "string" && name.length > 0 ? name : "User";
  };
  const buildCommentTree = (list: any[]) => {
    const children: Record<string, any[]> = {};
    const roots: any[] = [];
    list.forEach((c) => {
      const id = getCommentId(c);
      const pid = getParentId(c);
      if (pid) {
        const key = String(pid);
        if (!children[key]) children[key] = [];
        children[key].push(c);
      } else {
        roots.push(c);
      }
    });
    Object.keys(children).forEach((k) => {
      children[k] = children[k].slice().sort((a: any, b: any) => {
        const ta = new Date(a?.createdAt ?? 0).getTime();
        const tb = new Date(b?.createdAt ?? 0).getTime();
        return ta - tb;
      });
    });
    return roots.map((r) => ({ node: r, replies: children[String(getCommentId(r))] || [] }));
  };

  // Optimized comment tree with precomputed data for performance
  const commentTree = useMemo(() => {
    const processComment = (c: any) => {
      const displayName = getDisplayName(c);
      const avatarUrl = getAvatarUrl(c);
      const initial = (displayName?.[0] ?? "U").toUpperCase();
      const timeString = c?.createdAt ? moment(c.createdAt).fromNow() : "";
      
      return {
        ...c,
        displayName,
        avatarUrl,
        initial,
        timeString,
        type: 'comment'
      };
    };

    const processReply = (r: any) => {
      const displayName = getDisplayName(r);
      const avatarUrl = getAvatarUrl(r);
      const initial = (displayName?.[0] ?? "U").toUpperCase();
      const timeString = r?.createdAt ? moment(r.createdAt).fromNow() : "";
      
      return {
        ...r,
        displayName,
        avatarUrl,
        initial,
        timeString,
        type: 'reply'
      };
    };

    // Build comment tree and flatten for FlatList
    const tree = buildCommentTree(
      comments
        .slice()
        .sort((a: any, b: any) => {
          const ta = new Date(a?.createdAt ?? 0).getTime();
          const tb = new Date(b?.createdAt ?? 0).getTime();
          return ta - tb;
        })
    );

    const flatData: any[] = [];
    tree.forEach(({ node: comment, replies }) => {
      flatData.push(processComment(comment));
      
      // Add inline replies from comment object
      const inlineReplies = Array.isArray((comment as any)?.replies) ? (comment as any).replies : [];
      const mergedReplies = [...replies, ...inlineReplies].filter(Boolean);
      const uniqReplies = mergedReplies.reduce((acc: any[], cur: any) => {
        const cid = getCommentId(cur);
        if (!cid || !acc.find((x) => getCommentId(x) === cid)) acc.push(cur);
        return acc;
      }, []);
      
      uniqReplies.forEach((reply) => {
        flatData.push(processReply(reply));
      });
    });

    return flatData;
  }, [comments]);

  // Memoized comment row component
  const CommentRow = useCallback(({ item }: { item: any }) => {
    const isReply = item.type === 'reply';
    
    return (
      <View style={{ gap: 6, marginLeft: isReply ? 32 : 0 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
          {item.avatarUrl ? (
            <ExpoImage source={{ uri: item.avatarUrl }} style={isReply ? styles.replyAvatar : styles.commentAvatar} contentFit="cover" />
          ) : (
            <View style={[isReply ? styles.replyAvatar : styles.commentAvatar, { alignItems: "center", justifyContent: "center", backgroundColor: "#888" }]}>
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: isReply ? 10 : 12 }}>{item.initial}</Text>
            </View>
          )}
          <View style={[styles.commentBubble, isDark ? styles.commentBubbleDark : styles.commentBubbleLight]}>
            <Text style={[styles.commentName, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>{item.displayName}</Text>
            <Text style={[styles.commentText, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>{item?.message || item?.text || ""}</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginLeft: isReply ? 32 : 32 }}>
          <Text style={[styles.commentMeta, { color: isDark ? "#9AA0A6" : "#666" }]}>{item.timeString}</Text>
          {!isReply && (
            <Pressable onPress={() => setReplyingToID(String(getCommentId(item)))}>
              <Text style={{ color: isDark ? "#9AA0A6" : "#666", textDecorationLine: "underline" }}>Reply</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }, [isDark]);

  const renderComment = useCallback(({ item }: { item: any }) => (
    <CommentRow item={item} />
  ), [CommentRow]);

  const keyExtractor = useCallback((item: any, index: number) => `${item.type}-${getCommentId(item) || index}`, []);

  if (!getCurrentPostItem() && currentImages.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF" }]}>
        <Text style={{ color: isDark ? "#FFFFFF" : "#0a0a0a" }}>Loading…</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[{ flex: 1 }, animatedStyle]}>
          <Pressable 
            style={{ flex: 1 }} 
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <View style={{ flex: 1, backgroundColor: "#000" }}>
              {currentImages.length > 0 ? (
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(e) => {
                    const w = Dimensions.get("window").width;
                    const idx = Math.round(e.nativeEvent.contentOffset.x / w);
                    setCurrentImageIndex(idx);
                    syncImageMeta(idx);
                  }}
                >
                  {currentImages.map((uri, i) => (
                    <View key={`${uri}-${i}`} style={{ width: Dimensions.get("window").width, height: Dimensions.get("window").height }}>
                      <ExpoImage source={{ uri }} style={styles.previewImage} contentFit="cover" />
                    </View>
                  ))}
                </ScrollView>
              ) : (
                getCurrentPostItem() && (
                  <ExpoImage source={{ uri: extractImageUrl(getCurrentPostItem()) as string }} style={styles.previewImage} contentFit="cover" />
                )
              )}

            <LinearGradient
              colors={["rgba(0,0,0,0.8)", "rgba(0,0,0,0.6)", "rgba(0,0,0,0.3)", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.gradientTop}
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.35)", "rgba(0,0,0,0.6)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.gradientBottom}
            />

            <Animated.View 
              style={[
                styles.previewHeader, 
                { 
                  paddingTop: insets.top + 10,
                  opacity: buttonsOpacity,
                  transform: [{ scale: buttonsScale }]
                }
              ]}
            >
              <Pressable style={styles.headerIcon} onPress={(e) => { e.stopPropagation(); router.back(); }}>
                <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
              </Pressable>
              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>{getCurrentPostItem() ? extractLocationName(getCurrentPostItem()) : "Location"}</Text>
                <Text style={styles.headerSub}>{currentImageIndex + 1} / {Math.max(1, currentImages.length || 1)}</Text>
              </View>
              <Pressable style={styles.headerIcon} onPress={(e) => { e.stopPropagation(); toast.success("Options coming soon"); }}>
                <Ionicons name="ellipsis-vertical" size={18} color="#FFFFFF" />
              </Pressable>
            </Animated.View>
            
            {/* Blinking arrow for navigation hint */}
            {allAvailablePosts.length > 1 && (
              <Animated.View 
                style={[
                  styles.blinkingArrow,
                  {
                    opacity: buttonsOpacity,
                    transform: [{ scale: buttonsScale }]
                  }
                ]}
              >
                {arrowVisible && (
                  <Ionicons 
                    name="chevron-up" 
                    size={24} 
                    color="#FFFFFF" 
                    style={{
                      textShadowColor: "rgba(0,0,0,0.75)",
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 3,
                    }}
                  />
                )}
              </Animated.View>
            )}
            
            <Animated.View 
              style={[
                styles.previewTopRow,
                {
                  opacity: buttonsOpacity,
                  transform: [{ scale: buttonsScale }]
                }
              ]}
            >
              <Pressable 
                style={styles.userRow}
                onPress={(e) => {
                  e.stopPropagation();
                  setShowProfileModal(true);
                  fetchUserStats();
                }}
              >
                {getCurrentPostItem()?.creator && extractImageUrl(getCurrentPostItem().creator) ? (
                  <ExpoImage source={{ uri: extractImageUrl(getCurrentPostItem().creator) as string }} style={styles.userAvatar} contentFit="cover" />
                ) : getCurrentPostItem()?.owner && extractImageUrl(getCurrentPostItem().owner) ? (
                  <ExpoImage source={{ uri: extractImageUrl(getCurrentPostItem().owner) as string }} style={styles.userAvatar} contentFit="cover" />
                ) : (
                  <View style={[styles.userAvatar, { alignItems: "center", justifyContent: "center" }]}>
                    <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>
                      {(getCurrentPostItem()?.creator?.fname?.[0] || getCurrentPostItem()?.owner?.fname?.[0] || getCurrentPostItem()?.author?.name?.[0] || "U")?.toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.userInfo}>
                  <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
                    {getCurrentPostItem()?.creator
                      ? `${getCurrentPostItem().creator.fname || ""} ${getCurrentPostItem().creator.lname || ""}`.trim() || (getCurrentPostItem().creator.name as string)
                      : (getCurrentPostItem()?.owner?.fname || (getCurrentPostItem()?.author?.name as string) || "User")}
                  </Text>
                  <Text style={styles.userTime}>
                    {getCurrentPostItem()?.createdAt ? moment(getCurrentPostItem().createdAt).fromNow() : ""}
                  </Text>
                </View>
              </Pressable>
              <View style={styles.actionRow}>
                {/* Hide friend/follow buttons when viewing own posts from notifications */}
                {getCurrentPostItem()?.creator?.id !== user?.id && getCurrentPostItem()?.owner?.id !== user?.id && (
                  <>
                    {friendStatus !== "pending" && (
                      <Pressable
                        style={styles.friendBtn}
                        onPress={(e) => { e.stopPropagation(); toggleFriend(friendStatus === "friends" ? "unfriend" : "friend"); }}
                      >
                        <Text style={styles.friendText}>{friendStatus === "friends" ? "Unfriend" : "Friend"}</Text>
                      </Pressable>
                    )}
                    {!following && (
                      <Pressable style={styles.followBtn} onPress={(e) => { e.stopPropagation(); toggleFollow("follow"); }}>
                        <Text style={styles.followText}>Follow</Text>
                      </Pressable>
                    )}
                  </>
                )}
              </View>
            </Animated.View>

            <Animated.View 
              style={[
                styles.rightRail,
                {
                  opacity: buttonsOpacity,
                  transform: [{ scale: buttonsScale }]
                }
              ]}
            >
              <Pressable style={styles.railCircle} onPress={(e) => { e.stopPropagation(); toggleLike(liked ? "unlike" : "like"); }}>
                <Ionicons name={liked ? "heart" : "heart-outline"} size={20} color={liked ? "#FF3B30" : "#FFFFFF"} />
              </Pressable>
              <Text style={styles.railCount}>{likeCount}</Text>
              <Pressable style={styles.railCircle} onPress={(e) => { e.stopPropagation(); setCommentsOpen(true); }}>
                <Ionicons name="chatbubble-outline" size={18} color="#FFFFFF" />
              </Pressable>
              <Text style={styles.railCount}>{commentCount}</Text>
              <Pressable style={styles.railCircle} onPress={(e) => { e.stopPropagation(); toast.success("Share coming soon"); }}>
                <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
              </Pressable>
            </Animated.View>

            {getCurrentPostItem()?.caption ? (
              <Animated.View 
                style={[
                  styles.captionBox,
                  {
                    opacity: buttonsOpacity,
                    transform: [{ scale: buttonsScale }]
                  }
                ]}
              >
                {/* <Text style={styles.captionUser}>
                  {getCurrentPostItem()?.creator
                    ? `${getCurrentPostItem().creator.fname || ""} ${getCurrentPostItem().creator.lname || ""}`.trim() || (getCurrentPostItem().creator.name as string)
                    : (getCurrentPostItem()?.owner?.fname || (getCurrentPostItem()?.author?.name as string) || "User")}
                </Text> */}
                <Text style={styles.captionText}>{getCurrentPostItem().caption}</Text>
              </Animated.View>
            ) : null}
            </View>
          </Pressable>
        </Animated.View>
      </GestureDetector>

      <Modal
        visible={commentsOpen}
        animationType="slide"
        presentationStyle="overFullScreen"
        transparent
        onRequestClose={() => setCommentsOpen(false)}
      >
        <View style={styles.modalOverlay}>
        <View
          style={[
            styles.shareSheet,
            {
              height: Dimensions.get("window").height * 0.75,
            },
            isDark ? styles.sheetDark : styles.sheetLight
          ]}
        >
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              keyboardVerticalOffset={Platform.OS === "ios" ? 200 : 200}
            >
              <View style={styles.sheetHeader}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={[styles.sheetTitle, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>
                    Comments ({commentTree.filter(item => item.type === 'comment').length})
                  </Text>
                  {isLoadingComments && <ActivityIndicator size="small" color={isDark ? "#FFFFFF" : "#0a0a0a"} />}
                </View>
                <Pressable style={styles.headerIcon} onPress={() => setCommentsOpen(false)}>
                  <Ionicons name="close" size={20} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
                </Pressable>
              </View>
              
              <FlatList
                ref={commentsScrollRef}
                data={commentTree}
                renderItem={renderComment}
                keyExtractor={keyExtractor}
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, gap: 12 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}
                removeClippedSubviews={false}
                maxToRenderPerBatch={10}
                windowSize={10}
                initialNumToRender={8}
                ListEmptyComponent={
                  <Text style={{ color: isDark ? "#9AA0A6" : "#666" }}>No comments yet</Text>
                }
              />
              <View style={[
                styles.inputContainer, 
                { 
                  paddingBottom: insets.bottom,
                  borderTopColor: isDark ? "#333" : "#E0E0E0",
                  backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF"
                }
              ]}>
                {replyingToID && (
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <Text style={{ color: isDark ? "#FFFFFF" : "#0a0a0a" }}>
                      Replying to{" "}
                      {getDisplayName(comments.find((x) => String(getCommentId(x)) === String(replyingToID)))}
                    </Text>
                    <Pressable onPress={() => setReplyingToID(null)}>
                      <Text style={{ color: isDark ? "#9AA0A6" : "#666" }}>Cancel</Text>
                    </Pressable>
                  </View>
                )}
                <View style={[styles.chatInputBox, isDark ? styles.chatInputDark : styles.chatInputLight]}>
                  <TextInput
                    value={commentText}
                    onChangeText={setCommentText}
                    placeholder="Write a comment..."
                    placeholderTextColor={isDark ? "#888" : "#999"}
                    style={[styles.chatInput, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}
                  />
                  <Pressable
                    style={[
                      styles.chatSendBtn, 
                      isDark ? styles.chatSendDark : styles.chatSendLight,
                      isSendingComment && { opacity: 0.6 }
                    ]}
                    onPress={sendComment}
                    disabled={isSendingComment || commentText.trim().length === 0}
                  >
                    {isSendingComment ? (
                      <ActivityIndicator size="small" color={isDark ? "#FFFFFF" : "#0a0a0a"} />
                    ) : (
                      <Ionicons name="paper-plane-outline" size={18} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
                    )}
                  </Pressable>
                </View>
              </View>
            </KeyboardAvoidingView>
        </View>
        </View>
      </Modal>

      {/* User Profile Modal */}
      <Modal
        visible={showProfileModal}
        animationType="fade"
        presentationStyle="overFullScreen"
        transparent
        onRequestClose={() => {
          setShowProfileModal(false);
          setUserStats(null); // Reset stats when closing
        }}
      >
        <View style={styles.profileModalOverlay}>
          <View style={[styles.profileModalContent, isDark ? styles.profileModalDark : styles.profileModalLight]}>
            {/* Header */}
            <View style={styles.profileModalHeader}>
              <Text style={[styles.profileModalTitle, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>
                User Profile
              </Text>
              <Pressable 
                style={styles.profileCloseButton} 
                onPress={() => {
                  setShowProfileModal(false);
                  setUserStats(null); // Reset stats when closing
                }}
              >
                <Ionicons name="close" size={24} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
              </Pressable>
            </View>

            {/* Profile Info */}
            <View style={styles.profileInfo}>
              {/* Avatar */}
              <View style={styles.profileAvatarContainer}>
                {getCurrentPostItem()?.creator && extractImageUrl(getCurrentPostItem().creator) ? (
                  <ExpoImage 
                    source={{ uri: extractImageUrl(getCurrentPostItem().creator) as string }} 
                    style={styles.profileAvatar} 
                    contentFit="cover" 
                  />
                ) : getCurrentPostItem()?.owner && extractImageUrl(getCurrentPostItem().owner) ? (
                  <ExpoImage 
                    source={{ uri: extractImageUrl(getCurrentPostItem().owner) as string }} 
                    style={styles.profileAvatar} 
                    contentFit="cover" 
                  />
                ) : (
                  <View style={[styles.profileAvatar, { alignItems: "center", justifyContent: "center", backgroundColor: "#888" }]}>
                    <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 32 }}>
                      {(getCurrentPostItem()?.creator?.fname?.[0] || getCurrentPostItem()?.owner?.fname?.[0] || getCurrentPostItem()?.author?.name?.[0] || "U")?.toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              {/* Name */}
              <Text style={[styles.profileName, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>
                {getCurrentPostItem()?.creator
                  ? `${getCurrentPostItem().creator.fname || ""} ${getCurrentPostItem().creator.lname || ""}`.trim() || (getCurrentPostItem().creator.name as string)
                  : (getCurrentPostItem()?.owner?.fname || (getCurrentPostItem()?.author?.name as string) || "User")}
              </Text>

              {/* Stats */}
              <View style={styles.profileStats}>
                <View style={styles.profileStat}>
                  <Text style={[styles.profileStatNumber, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>
                    {isLoadingUserStats ? "..." : userStats?.posts || 0}
                  </Text>
                  <Text style={[styles.profileStatLabel, { color: isDark ? "#9AA0A6" : "#666" }]}>Posts</Text>
                </View>
                <View style={styles.profileStat}>
                  <Text style={[styles.profileStatNumber, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>
                    {isLoadingUserStats ? "..." : userStats?.followers || 0}
                  </Text>
                  <Text style={[styles.profileStatLabel, { color: isDark ? "#9AA0A6" : "#666" }]}>Followers</Text>
                </View>
                <View style={styles.profileStat}>
                  <Text style={[styles.profileStatNumber, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>
                    {isLoadingUserStats ? "..." : userStats?.followings || 0}
                  </Text>
                  <Text style={[styles.profileStatLabel, { color: isDark ? "#9AA0A6" : "#666" }]}>Following</Text>
                </View>
              </View>

              {/* Loading indicator for stats */}
              {isLoadingUserStats && (
                <View style={styles.statsLoadingContainer}>
                  <ActivityIndicator size="small" color={isDark ? "#FFFFFF" : "#0a0a0a"} />
                  <Text style={[styles.statsLoadingText, { color: isDark ? "#9AA0A6" : "#666" }]}>
                    Loading stats...
                  </Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.profileActions}>
                <Pressable
                  style={[styles.profileActionButton, styles.addFriendButton]}
                  onPress={() => toggleFriend(friendStatus === "friends" ? "unfriend" : "friend")}
                  disabled={friendStatus === "pending"}
                >
                  <Ionicons name="heart-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.addFriendText}>
                    {friendStatus === "pending" ? "Pending" : friendStatus === "friends" ? "Unfriend" : "Add Friend"}
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.profileActionButton, styles.followButton]}
                  onPress={() => toggleFollow(following ? "unfollow" : "follow")}
                >
                  <Ionicons name="person-add-outline" size={16} color="#0a0a0a" />
                  <Text style={styles.profileFollowText}>{following ? "Unfollow" : "Follow"}</Text>
                </Pressable>
              </View>
            </View>

            {/* Recent Activity */}
            <View style={styles.recentActivity}>
              <Text style={[styles.recentActivityTitle, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>
                Recent Activity
              </Text>
              <Text style={[styles.recentActivityText, { color: isDark ? "#9AA0A6" : "#666" }]}>
                Last posted {getCurrentPostItem()?.createdAt ? moment(getCurrentPostItem().createdAt).fromNow() : "recently"} at {extractLocationName(getCurrentPostItem())}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
}


const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  previewImage: { width: "100%", height: "100%" },
  gradientTop: { position: "absolute", left: 0, right: 0, top: 0, height: 220 },
  gradientBottom: { position: "absolute", left: 0, right: 0, bottom: 0, height: 180 },
  previewHeader: { position: "absolute", top: 0, left: 12, right: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerIcon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.35)" },
  headerCenter: { position: "absolute", left: 0, right: 0, top: 58, alignItems: "center", justifyContent: "center", gap: 4 },
  headerTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "700", width: "70%", textAlign: "center" },
  headerSub: { color: "#FFFFFF", fontSize: 11 },
  previewTopRow: { position: "absolute", top: 90, left: 14, right: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  userRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 20, flexShrink: 1, minWidth: 0 },
  userAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.35)" },
  userInfo: { flex: 1, minWidth: 0 },
  userName: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  userTime: { color: "#FFFFFF", fontSize: 12, opacity: 0.85 },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 20, flexShrink: 0, maxWidth: 180 },
  friendBtn: { height: 32, paddingHorizontal: 12, borderRadius: 8, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", minWidth: 84 },
  friendBtnPending: { backgroundColor: "#CCCCCC" },
  friendText: { color: "#0a0a0a", fontSize: 12, fontWeight: "700" },
  followBtn: { height: 32, paddingHorizontal: 12, borderRadius: 8, backgroundColor: "#1877F2", alignItems: "center", justifyContent: "center", minWidth: 84 },
  followBtnActive: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E0E0E0" },
  followText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  rightRail: { position: "absolute", right: 14, top: 160, alignItems: "center", gap: 10 },
  railCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center" },
  railCount: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  captionBox: { position: "absolute", left: 0, right: 0, bottom: 24, alignItems: "center", paddingHorizontal: 16 },
  captionUser: { color: "#FFFFFF", fontSize: 13, fontWeight: "700", marginBottom: 4, textShadowColor: "rgba(0,0,0,0.75)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  captionText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600", textAlign: "center", textShadowColor: "rgba(0,0,0,0.75)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  shareSheet: { 
    width: "100%",
    borderTopLeftRadius: 18, 
    borderTopRightRadius: 18, 
    overflow: "hidden", 
    borderWidth: 1, 
    backgroundColor: "#FFFFFF" 
  },
  sheetDark: { backgroundColor: "#0a0a0a", borderColor: "#333333" },
  sheetLight: { backgroundColor: "#FFFFFF", borderColor: "#E0E0E0" },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#2a2e37" },
  sheetTitle: { fontSize: 14, fontWeight: "700" },
  commentAvatar: { width: 24, height: 24, borderRadius: 12 },
  replyAvatar: { width: 20, height: 20, borderRadius: 10 },
  commentBubble: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, flex: 1, marginRight: 16 },
  commentBubbleDark: { backgroundColor: "#1A1A1A" },
  commentBubbleLight: { backgroundColor: "#F5F5F5" },
  commentName: { fontSize: 12, fontWeight: "700" },
  commentText: { fontSize: 12 },
  commentMeta: { fontSize: 10 },
  chatInputBox: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, gap: 8 },
  chatInputDark: { backgroundColor: "#1A1A1A" },
  chatInputLight: { backgroundColor: "#F5F5F5" },
  chatInput: { flex: 1, fontSize: 14, paddingVertical: Platform.OS === "ios" ? 12 : 8 },
  chatSendBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  chatSendDark: { backgroundColor: "#2A2A2A" },
  chatSendLight: { backgroundColor: "#FFFFFF" },
  inputContainer: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  blinkingArrow: {
    position: "absolute",
    bottom: 120,
    right: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  profileModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  profileModalContent: {
    width: "95%",
    maxWidth: 400,
    borderRadius: 20,
    padding: 0,
    overflow: "hidden",
  },
  profileModalDark: {
    backgroundColor: "#1A1A1A",
  },
  profileModalLight: {
    backgroundColor: "#FFFFFF",
  },
  profileModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  profileModalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  profileCloseButton: {
    padding: 4,
  },
  profileInfo: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  profileAvatarContainer: {
    marginBottom: 16,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.2)",
  },
  profileName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },
  profileLocation: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
  },
  profileStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 24,
  },
  profileStat: {
    alignItems: "center",
  },
  profileStatNumber: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 2,
  },
  profileStatLabel: {
    fontSize: 12,
  },
  profileActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  profileActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  addFriendButton: {
    backgroundColor: "#333333",
    borderWidth: 1,
    borderColor: "#555555",
  },
  followButton: {
    backgroundColor: "#FFFFFF",
  },
  addFriendText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  profileFollowText: {
    color: "#0a0a0a",
    fontSize: 14,
    fontWeight: "600",
  },
  recentActivity: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  recentActivityTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  recentActivityText: {
    fontSize: 14,
    lineHeight: 20,
  },
  statsLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  statsLoadingText: {
    fontSize: 12,
  },
});
