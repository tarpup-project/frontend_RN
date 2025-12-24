import { api } from "@/api/client";
import { UrlConstants } from "@/constants/apiUrls";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuthStore } from "@/state/authStore";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import moment from "moment";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
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
      
      setCurrentPostItem(parsedItem);
      setCurrentImages(urls.length > 0 ? urls : parsedItem ? [extractImageUrl(parsedItem) as string].filter(Boolean) : []);
      setCurrentImageIds(ids.length > 0 ? ids : parsedItem ? [extractImageId(parsedItem)] : []);
      setAllPostItems(parsedAllItems.length > 0 ? parsedAllItems : [parsedItem].filter(Boolean));
      setServerPosts(parsedServerPosts);
      
      // Load global posts for browsing
      loadGlobalPosts().then((globalPostsList) => {
        // Mark current post as viewed and set up all available posts
        if (parsedItem?.id) {
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
    const candidates: any[] = [
      item?.imageId, item?.imageID, item?.postImageID, item?.postImageId,
      Array.isArray(item?.images) ? item.images[0]?.id : null,
      Array.isArray(item?.files) ? item.files[0]?.id : null,
      Array.isArray(item?.medias) ? item.medias[0]?.id : null,
      item?.id
    ];
    const v = candidates.find((x) => typeof x === "string" || typeof x === "number");
    return v != null ? String(v) : null;
  };

  const getCurrentImageId = (): string | null => {
    const id = currentImageIds[currentImageIndex];
    return id ?? (currentPostItem ? extractImageId(currentPostItem) : null);
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
    return typeof v === "string" && v.length > 0 ? v : "Location";
  };

  const extractLiked = (item: any): boolean => {
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
    
    const imgMeta = Array.isArray(activeItem.images) ? activeItem.images[0] : null; // For stacked posts, each item typically has one image
    const likedVal =
      typeof imgMeta?.hasLiked === "boolean"
        ? imgMeta.hasLiked
        : extractLiked(activeItem);
    const likeCountVal =
      typeof imgMeta?.likes === "number"
        ? imgMeta.likes
        : extractLikeCount(activeItem);
    const commentCountVal =
      typeof imgMeta?.comments === "number"
        ? imgMeta.comments
        : Array.isArray(activeItem.comments)
        ? activeItem.comments.length
        : 0;
    setLiked(!!likedVal);
    setLikeCount(typeof likeCountVal === "number" ? likeCountVal : 0);
    setCommentCount(typeof commentCountVal === "number" ? commentCountVal : 0);
  };

  const toggleLike = async (action: "like" | "unlike") => {
    const activeItem = getCurrentPostItem();
    const imageID = getCurrentImageId();
    if (!imageID) return;
    try {
      await api.post(UrlConstants.tarpLikePost, { imageID, action });
      if (action === "like") {
        setLiked(true);
        setLikeCount((c) => c + 1);
      } else {
        setLiked(false);
        setLikeCount((c) => (c > 0 ? c - 1 : 0));
      }
      toast.success(action === "like" ? "Liked" : "Unliked");
    } catch {
      toast.error("Failed to update like");
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
              colors={["rgba(0,0,0,0.6)", "rgba(0,0,0,0.35)", "transparent"]}
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

            <View style={[styles.previewHeader, { paddingTop: insets.top + 10 }]}>
              <Pressable style={styles.headerIcon} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
              </Pressable>
              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>{getCurrentPostItem() ? extractLocationName(getCurrentPostItem()) : "Location"}</Text>
                <Text style={styles.headerSub}>{currentImageIndex + 1} / {Math.max(1, currentImages.length || 1)}</Text>
              </View>
              <Pressable style={styles.headerIcon} onPress={() => toast.success("Options coming soon")}>
                <Ionicons name="ellipsis-vertical" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
            
            {/* Swipe indicators */}
            {allAvailablePosts.length > 1 && (
              <View style={styles.swipeIndicators}>
                {/* Show up indicator only if there are unviewed posts */}
                {allAvailablePosts.some(p => !viewedPosts.has(p.id)) && (
                  <View style={styles.swipeIndicator}>
                    <Ionicons name="chevron-up" size={20} color="#FFFFFF" />
                    <Text style={styles.swipeText}>
                      Swipe up for next post ({allAvailablePosts.filter(p => !viewedPosts.has(p.id)).length} remaining)
                    </Text>
                  </View>
                )}
                {/* Show down indicator only if we're not at the first post */}
                {currentPostIndex > 0 && (
                  <View style={[styles.swipeIndicator, { marginTop: 20 }]}>
                    <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
                    <Text style={styles.swipeText}>Swipe down to review previous posts</Text>
                  </View>
                )}
                {/* Show completion message if all posts viewed */}
                {allAvailablePosts.length > 0 && allAvailablePosts.every(p => viewedPosts.has(p.id)) && (
                  <View style={[styles.swipeIndicator, { marginTop: 20 }]}>
                    <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                    <Text style={[styles.swipeText, { color: "#4CAF50" }]}>All posts viewed! 🎉</Text>
                  </View>
                )}
                {isLoadingGlobalPosts && (
                  <View style={[styles.swipeIndicator, { marginTop: 20 }]}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.swipeText}>Loading global posts...</Text>
                  </View>
                )}
              </View>
            )}
            
            <View style={styles.previewTopRow}>
              <View style={styles.userRow}>
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
              </View>
              <View style={styles.actionRow}>
                <Pressable
                  style={[styles.friendBtn, friendStatus === "pending" && styles.friendBtnPending]}
                  disabled={friendStatus === "pending"}
                  onPress={() => toggleFriend(friendStatus === "friends" ? "unfriend" : "friend")}
                >
                  <Text style={styles.friendText}>{friendStatus === "pending" ? "Pending" : friendStatus === "friends" ? "Unfriend" : "Friend"}</Text>
                </Pressable>
                <Pressable style={[styles.followBtn, following && styles.followBtnActive]} onPress={() => toggleFollow(following ? "unfollow" : "follow")}>
                  <Text style={[styles.followText, following && { color: "#0a0a0a" }]}>{following ? "Following" : "Follow"}</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.rightRail}>
              <Pressable style={styles.railCircle} onPress={() => toggleLike(liked ? "unlike" : "like")}>
                <Ionicons name={liked ? "heart" : "heart-outline"} size={20} color={liked ? "#FF3B30" : "#FFFFFF"} />
              </Pressable>
              <Text style={styles.railCount}>{likeCount}</Text>
              <Pressable style={styles.railCircle} onPress={() => setCommentsOpen(true)}>
                <Ionicons name="chatbubble-outline" size={18} color="#FFFFFF" />
              </Pressable>
              <Text style={styles.railCount}>{commentCount}</Text>
              <Pressable style={styles.railCircle} onPress={() => toast.success("Share coming soon")}>
                <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
              </Pressable>
            </View>

            {getCurrentPostItem()?.caption ? (
              <View style={styles.captionBox}>
                <Text style={styles.captionUser}>
                  {getCurrentPostItem()?.creator
                    ? `${getCurrentPostItem().creator.fname || ""} ${getCurrentPostItem().creator.lname || ""}`.trim() || (getCurrentPostItem().creator.name as string)
                    : (getCurrentPostItem()?.owner?.fname || (getCurrentPostItem()?.author?.name as string) || "User")}
                </Text>
                <Text style={styles.captionText}>{getCurrentPostItem().caption}</Text>
              </View>
            ) : null}
          </View>
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
    </GestureHandlerRootView>
  );
}


const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  previewImage: { width: "100%", height: "100%" },
  gradientTop: { position: "absolute", left: 0, right: 0, top: 0, height: 180 },
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
  swipeIndicators: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
    transform: [{ translateY: -40 }],
  },
  swipeIndicator: {
    alignItems: "center",
  },
  swipeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginTop: 4,
  },
});
