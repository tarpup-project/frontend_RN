import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, Image as RNImage, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { toast } from 'sonner-native';

import { api } from '@/api/client';
import AuthModal from '@/components/AuthModal';
import { UrlConstants } from '@/constants/apiUrls';
import { useTheme } from "@/contexts/ThemeContext";
import { useAuthStore } from '@/state/authStore';
import { useTarpsStore } from '@/state/tarpsStore';
import { Image as ExpoImage } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import moment from 'moment';
import { FlatList } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import uuid from 'react-native-uuid';
import { io } from 'socket.io-client';

export default function TarpsScreen() {
  const { isDark } = useTheme();
  const { user } = useAuthStore();
  const router = useRouter();
  const { decrementUnseenCount } = useTarpsStore();

  const [viewMode, setViewMode] = useState<'posts' | 'people'>('posts');
  const [location, setLocation] = useState<any>(null);
  const [mapRegion, setMapRegion] = useState<any>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  const [markers, setMarkers] = useState<any[]>([]);
  const [serverPosts, setServerPosts] = useState<any[]>([]);
  const [globalPosts, setGlobalPosts] = useState<any[]>([]);
  const [serverPeople, setServerPeople] = useState<any[]>([]);

  const [knownPosts, setKnownPosts] = useState<Map<string, any>>(new Map());
  const [previewedPosts, setPreviewedPosts] = useState<Set<string>>(new Set());
  const [newPostIds, setNewPostIds] = useState<Set<string>>(new Set());
  const [reportedPosts, setReportedPosts] = useState<Set<string>>(new Set());

  const knownPostsRef = useRef<Map<string, any>>(new Map());
  const reportedPostsRef = useRef<Set<string>>(new Set());
  const hasSeenHintRef = useRef(false);
  const previewedPostsRef = useRef<Set<string>>(new Set());

  // Sync refs with state to avoid stale closures in background tasks
  useEffect(() => {
    knownPostsRef.current = knownPosts;
  }, [knownPosts]);

  useEffect(() => {
    previewedPostsRef.current = previewedPosts;
  }, [previewedPosts]);
  const lastPostRequestId = useRef(0);
  const lastPeopleRequestId = useRef(0);

  const [showHandAnimation, setShowHandAnimation] = useState(false);
  const [isHandAnimationVisible, setHandAnimationVisible] = useState(false);

  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [personOpen, setPersonOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const [loadingMessage, setLoadingMessage] = useState(false);
  const [loadingNavigate, setLoadingNavigate] = useState(false);
  const [loadingViewers, setLoadingViewers] = useState(false);

  const [groupDetails, setGroupDetails] = useState<any>(null);
  const [groupMessages, setGroupMessages] = useState<any[]>([]);

  const [showMapConfirmModal, setShowMapConfirmModal] = useState(false);
  const [modalTransitioning, setModalTransitioning] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showViewersList, setShowViewersList] = useState(false);
  const [locationViewers, setLocationViewers] = useState<any[]>([]);
  const [recents, setRecents] = useState<any[]>([]);

  const chatScrollRef = useRef<any>(null);
  const mapboxCameraRef = useRef<any>(null);
  const insets = useSafeAreaInsets();
  const [chatText, setChatText] = useState("");
  const [canLoadImages, setCanLoadImages] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Profile data fetching
  const [profileDetails, setProfileDetails] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(false);

  const selectedPersonId = selectedPerson?.id;
  const isCurrentUser = selectedPerson?.owner?.id === user?.id;

  const openProfileScreen = () => router.push('/my-tarps');
  const handleCreatePostPress = () => router.push('/create-post');
  const handleShareLocation = () => router.push('/share-location');

  useEffect(() => {
    if (selectedPerson?.owner?.id && !isCurrentUser) {
      const fetchProfile = async () => {
        setProfileLoading(true);
        setProfileError(false);
        try {
          const res = await api.get(`/user/${selectedPerson.owner.id}`);
          if (res?.data?.status === 'success') {
            setProfileDetails(res.data.data);
          }
        } catch (e) {
          console.error("Failed to fetch profile stats", e);
          setProfileError(true);
        } finally {
          setProfileLoading(false);
        }
      };
      fetchProfile();
    } else {
      setProfileDetails(null);
    }
  }, [selectedPerson?.owner?.id, isCurrentUser]);

  // Missing state/refs added by fix
  const mapRef = useRef<MapView>(null);
  const [currentZoomLevel, setCurrentZoomLevel] = useState(1);
  const [isLoadingGlobalPosts, setIsLoadingGlobalPosts] = useState(false);

  const [zoomHistory, setZoomHistory] = useState<any[]>([]);

  // Mapbox stubs
  const useMapboxGL = false;
  const MapboxGL: any = null;
  const [mapboxCamera, setMapboxCamera] = useState<any>(null);

  // Other missing refs/state
  const [isRestoringGlobalPosts, setIsRestoringGlobalPosts] = useState(false);
  const socketRef = useRef<any>(null);

  const saveKnownPosts = async (posts: Map<string, any>) => {
    try {
      await AsyncStorage.setItem('tarps.knownPosts', JSON.stringify(Array.from(posts.entries())));
    } catch (e) {
      console.error('Failed to save known posts', e);
    }
  };

  const savePreviewedPosts = async (posts: Set<string>) => {
    try {
      await AsyncStorage.setItem('tarps.previewedPosts', JSON.stringify(Array.from(posts)));
    } catch (e) {
      console.error('Failed to save previewed posts', e);
    }
  };

  const loadKnownPosts = async () => {
    try {
      const data = await AsyncStorage.getItem('tarps.knownPosts');
      if (data) {
        const parsed = JSON.parse(data);
        setKnownPosts(new Map(parsed));
      }
    } catch (e) { console.error(e); }
  };

  const loadPreviewedPosts = async () => {
    try {
      const data = await AsyncStorage.getItem('tarps.previewedPosts');
      if (data) {
        const parsed = JSON.parse(data);
        setPreviewedPosts(new Set(parsed));
      }
    } catch (e) { console.error(e); }
  };



  const dismissHandAnimation = async () => {
    setShowHandAnimation(false);
    hasSeenHintRef.current = true;
    try {
      await AsyncStorage.setItem('tarps.hasSeenHandAnimation', 'true');
    } catch { }
  };

  // Function to mark a post as viewed
  const markPostAsViewed = (postId: string) => {
    setNewPostIds(prev => {
      const updated = new Set(prev);
      if (updated.has(postId)) {
        updated.delete(postId);
        // Sync global store - defer to avoid setState during render
        setTimeout(() => decrementUnseenCount(1), 0);
      }
      return updated;
    });

    setPreviewedPosts(prev => {
      const updated = new Set(prev);
      updated.add(postId);
      savePreviewedPosts(updated);
      return updated;
    });
  };

  // Function to mark multiple posts as viewed (for clusters)
  const markPostsAsViewed = (postIds: string[]) => {
    setNewPostIds(prev => {
      const updated = new Set(prev);
      let removedCount = 0;
      postIds.forEach(id => {
        if (updated.has(id)) {
          updated.delete(id);
          removedCount++;
        }
      });
      if (removedCount > 0) {
        // Defer to avoid setState during render
        setTimeout(() => decrementUnseenCount(removedCount), 0);
      }
      return updated;
    });

    setPreviewedPosts(prev => {
      const updated = new Set(prev);
      postIds.forEach(id => updated.add(id));
      savePreviewedPosts(updated);
      return updated;
    });
  };

  // Function to load reported posts from storage
  const loadReportedPosts = async () => {
    try {
      const reportedPostsData = await AsyncStorage.getItem('reportedPosts');
      if (reportedPostsData) {
        const parsedData = JSON.parse(reportedPostsData);
        setReportedPosts(new Set(parsedData));
      }
    } catch (error) {
      console.error('Error loading reported posts:', error);
    }
  };

  // Function to handle reported post
  const handleReportedPost = (postId: string) => {
    console.log("🚫 Handling reported post:", postId);

    // Update reported posts set
    const updatedReported = new Set(reportedPostsRef.current);
    updatedReported.add(postId);
    setReportedPosts(updatedReported);
    AsyncStorage.setItem('reportedPosts', JSON.stringify(Array.from(updatedReported)));

    // Remove from global posts
    const updatedGlobal = globalPosts.filter(p => {
      // Check if this post is the reported one
      if (p.id === postId) return false;

      // Check if it's a cluster containing the reported post
      if (p.items && Array.isArray(p.items)) {
        p.items = p.items.filter((item: any) => item.id !== postId);
        // If items are empty after filtering, remove the cluster
        if (p.items.length === 0) return false;
        // Update count if items changed
        p.count = p.items.length;
      }
      return true;
    });

    setGlobalPosts(updatedGlobal);
    if (viewMode === 'posts') {
      setServerPosts(updatedGlobal);
    }
    AsyncStorage.setItem('globalPosts', JSON.stringify(updatedGlobal)).catch(e => console.error("Failed to save global posts", e));

    // Also remove from known/previewed if needed, but not strictly required as they won't render
  };

  // Load both known and previewed posts on mount
  useEffect(() => {
    loadKnownPosts();
    loadPreviewedPosts();
    loadReportedPosts();
  }, []);

  // Expose global function for post screen communication
  useEffect(() => {
    (global as any).markPostsAsViewed = markPostsAsViewed;
    (global as any).handleReportedPost = handleReportedPost;
    (global as any).updatePostMetrics = (update: {
      postId?: string;
      imageId?: string;
      likeCount?: number;
      commentCount?: number;
      liked?: boolean;
    }) => {
      const applyUpdate = (list: any[]) => {
        return list.map(cluster => {
          if (cluster.items && Array.isArray(cluster.items)) {
            const updatedItems = cluster.items.map((item: any) => {
              const matchesPost =
                (update.postId && String(item.id) === String(update.postId)) ||
                (update.imageId && String(item.id) === String(update.imageId)) ||
                (update.imageId && Array.isArray(item.images) && item.images.some((img: any) => String(img?.id) === String(update.imageId)));

              if (!matchesPost) return item;

              const nextItem = { ...item };

              if (typeof update.likeCount === 'number') {
                nextItem.likes = update.likeCount;
                nextItem.likesCount = update.likeCount;
                nextItem.numLikes = update.likeCount;
                if (!nextItem._count) nextItem._count = {};
                nextItem._count.tarpImgLikes = update.likeCount;
              }
              if (typeof update.commentCount === 'number') {
                nextItem.comments = update.commentCount;
                nextItem.commentsCount = update.commentCount;
                if (!nextItem._count) nextItem._count = {};
                nextItem._count.tarpImgComments = update.commentCount;
              }
              if (typeof update.liked === 'boolean') {
                nextItem.hasLiked = update.liked;
                nextItem.likedByMe = update.liked;
                nextItem.isLiked = update.liked;
                nextItem.liked = update.liked;
              }

              if (Array.isArray(nextItem.images) && nextItem.images.length > 0) {
                nextItem.images = nextItem.images.map((img: any) => {
                  const imgMatches = String(img?.id) === String(update.imageId) || String(nextItem.id) === String(update.imageId);
                  if (!imgMatches) return img;
                  const nextImg = { ...img };
                  if (!nextImg._count) nextImg._count = {};
                  if (typeof update.likeCount === 'number') {
                    nextImg._count.tarpImgLikes = update.likeCount;
                    nextImg.likes = update.likeCount;
                  }
                  if (typeof update.commentCount === 'number') {
                    nextImg._count.tarpImgComments = update.commentCount;
                    nextImg.comments = update.commentCount;
                  }
                  return nextImg;
                });
              }

              return nextItem;
            });
            return { ...cluster, items: updatedItems, count: updatedItems.length };
          }

          const matchesSingle =
            (update.postId && String(cluster.id) === String(update.postId)) ||
            (update.imageId && String(cluster.id) === String(update.imageId));

          if (!matchesSingle) return cluster;

          const next = { ...cluster };
          if (!next._count) next._count = {};
          if (typeof update.likeCount === 'number') {
            next.likes = update.likeCount;
            next.likesCount = update.likeCount;
            next.numLikes = update.likeCount;
            next._count.tarpImgLikes = update.likeCount;
          }
          if (typeof update.commentCount === 'number') {
            next.comments = update.commentCount;
            next.commentsCount = update.commentCount;
            next._count.tarpImgComments = update.commentCount;
          }
          if (typeof update.liked === 'boolean') {
            next.hasLiked = update.liked;
            next.likedByMe = update.liked;
            next.isLiked = update.liked;
            next.liked = update.liked;
          }
          return next;
        });
      };

      setGlobalPosts(prev => {
        const updated = applyUpdate(prev);
        AsyncStorage.setItem('globalPosts', JSON.stringify(updated)).catch(() => { });
        return updated;
      });
      if (viewMode === 'posts') {
        setServerPosts(prev => applyUpdate(prev));
      }
    };
    (global as any).refreshPostsInView = () => {
      console.log("🔄 Refreshing posts in view after report");
      const currentRegion = mapRegion || location;
      if (currentRegion && viewMode === "posts") {
        loadPostsInView(currentRegion);
      }
    };
    (global as any).refreshAfterReport = () => {
      setViewMode("posts");
      zoomToWorldView();
      setTimeout(() => {
        const currentRegion = mapRegion || location;
        if (currentRegion) {
          loadPostsInView(currentRegion);
        }
      }, 100);
    };
    (global as any).getGlobalPosts = () => {
      console.log("📋 Providing global posts to post screen:", globalPosts.length);
      return globalPosts;
    };
    return () => {
      delete (global as any).markPostsAsViewed;
      delete (global as any).refreshPostsInView;
      delete (global as any).refreshAfterReport;
      delete (global as any).getGlobalPosts;
      delete (global as any).updatePostMetrics;
    };
  }, [mapRegion, location, viewMode, globalPosts]);

  // Hand animation blinking effect
  useEffect(() => {
    if (!showHandAnimation) return;

    const blinkInterval = setInterval(() => {
      setHandAnimationVisible(prev => !prev);
    }, 1500); // Blink every 1.5 seconds

    return () => {
      clearInterval(blinkInterval);
    };
  }, [showHandAnimation]);

  // Auto-hide hand animation after 10 seconds, but only in posts view
  useEffect(() => {
    if (viewMode !== "posts" || !showHandAnimation) return;

    const hideTimer = setTimeout(() => {
      void dismissHandAnimation();
    }, 10000); // Hide after 10 seconds

    return () => {
      clearTimeout(hideTimer);
    };
  }, [viewMode, showHandAnimation]);

  // Load hand animation seen state on mount
  useEffect(() => {
    AsyncStorage.getItem('tarps.hasSeenHandAnimation').then(seen => {
      if (seen === 'true') {
        hasSeenHintRef.current = true;
      }
    });
  }, []);

  // Show hand animation when switching to posts view, if not seen
  useEffect(() => {
    if (viewMode === "posts" && !hasSeenHintRef.current) {
      // Double check storage to avoid race conditions
      AsyncStorage.getItem('tarps.hasSeenHandAnimation').then(seen => {
        if (seen !== 'true') {
          setShowHandAnimation(true);
        } else {
          hasSeenHintRef.current = true;
        }
      });
    }
  }, [viewMode]);

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






  // Request permission + get location (optional)
  useEffect(() => {
    (async () => {
      try {
        if (!user) {
          // If not authenticated, default to NYC without asking permissions
          setHasLocationPermission(false);
          setLocation({
            latitude: 40.7128,
            longitude: -74.0060,
            latitudeDelta: 120,
            longitudeDelta: 120,
          });
          return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status === "granted") {
          // User granted permission, get their actual location
          setHasLocationPermission(true);
          const current = await Location.getCurrentPositionAsync({});
          setLocation({
            latitude: current.coords.latitude,
            longitude: current.coords.longitude,
            latitudeDelta: 120, // Start with world view
            longitudeDelta: 120, // Start with world view
          });
        } else {
          // User denied permission, use default location (e.g., New York City)
          console.log("Location permission denied, using default location");
          setHasLocationPermission(false);
          setLocation({
            latitude: 40.7128, // New York City latitude
            longitude: -74.0060, // New York City longitude
            latitudeDelta: 120, // Start with world view
            longitudeDelta: 120, // Start with world view
          });
        }

        // Load saved markers regardless of location permission
        const saved = await AsyncStorage.getItem("tarps.posts");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) setMarkers(parsed);
          } catch { }
        }
      } catch (error) {
        // Handle any errors by using default location
        console.error("Error getting location:", error);
        setHasLocationPermission(false);
        setLocation({
          latitude: 40.7128, // New York City latitude
          longitude: -74.0060, // New York City longitude
          latitudeDelta: 120, // Start with world view
          longitudeDelta: 120, // Start with world view
        });
      }
    })();
  }, []);





  const computeZoomLevel = (region: typeof location) => {
    if (!region) return 10;
    const delta = region.longitudeDelta || 0.05;
    const zoom = Math.round(Math.log2(360 / delta));
    return Math.max(1, Math.min(20, zoom));
  };

  const buildViewport = (region: NonNullable<typeof location>) => {
    const minLat = region.latitude - region.latitudeDelta / 2;
    const maxLat = region.latitude + region.latitudeDelta / 2;
    const minLng = region.longitude - region.longitudeDelta / 2;
    const maxLng = region.longitude + region.longitudeDelta / 2;
    const zoomLevel = computeZoomLevel(region);
    return { minLat, maxLat, minLng, maxLng, zoomLevel };
  };

  const postsUrl = ({ minLat, maxLat, minLng, maxLng, zoomLevel }: { minLng: number; maxLng: number; minLat: number; maxLat: number; zoomLevel: number }) => {
    const query = new URLSearchParams({
      minLat: minLat.toString(),
      maxLat: maxLat.toString(),
      minLng: minLng.toString(),
      maxLng: maxLng.toString(),
      zoomLevel: zoomLevel.toString(),
    });
    return `/tarps/posts?${query.toString()}`;
  };

  const peopleUrl = ({ minLat, maxLat, minLng, maxLng, zoomLevel }: { minLng: number; maxLng: number; minLat: number; maxLat: number; zoomLevel: number }) => {
    const query = new URLSearchParams({
      minLat: minLat.toString(),
      maxLat: maxLat.toString(),
      minLng: minLng.toString(),
      maxLng: maxLng.toString(),
      zoomLevel: zoomLevel.toString(),
    });
    return `/tarps/people?${query.toString()}`;
  };


  const loadPostsInView = async (region: typeof location) => {
    if (!region) return;
    const requestId = ++lastPostRequestId.current;
    const vp = buildViewport(region);
    try {
      const url = postsUrl(vp);
      console.log("PostsInView:request", { url, ...vp });
      const res = await api.get(url);
      if (requestId !== lastPostRequestId.current) return;
      console.log("PostsInView:response", { status: res?.status, ok: res?.status >= 200 && res?.status < 300 });
      console.log("PostsInView:rawData", res?.data);
      const list = (res as any).data?.data || (res as any).data?.posts || (res as any).data;
      console.log("PostsInView:listResolved", {
        isArray: Array.isArray(list),
        length: Array.isArray(list) ? list.length : undefined,
        sample: Array.isArray(list) ? list[0] : list,
      });
      const resolveImageUrl = (item: any): string | null => {
        if (!item || typeof item !== "object") return null;
        const candidates: any[] = [
          item.imageUrl,
          item.photoUrl,
          item.image,
          item.coverUrl,
          item.thumbnail,
          item.thumbUrl,
          item.bgUrl,
          item.url,
          item?.image?.url,
          item?.photo?.url,
          Array.isArray(item.images) ? (typeof item.images[0] === "string" ? item.images[0] : item.images[0]?.url) : null,
          Array.isArray(item.files) ? (typeof item.files[0] === "string" ? item.files[0] : item.files[0]?.url) : null,
          Array.isArray(item.medias) ? (typeof item.medias[0] === "string" ? item.medias[0] : item.medias[0]?.url) : null,
        ];
        const raw = candidates.find((v) => typeof v === "string" && v.length > 0) ?? null;
        if (!raw) return null;
        if (/^https?:\/\//i.test(raw)) return raw;
        return `${UrlConstants.baseUrl}${raw.startsWith("/") ? "" : "/"}${raw}`;
      };
      let mapped: { id: string; image: string | null; latitude: number; longitude: number; count?: number; items?: any[] }[] = [];
      if (Array.isArray(list)) {
        const looksLikeGrid = list.length > 0 && typeof list[0]?.avgLat === "number" && typeof list[0]?.avgLng === "number" && "result" in list[0];
        if (looksLikeGrid) {
          mapped = list
            .map((cell: any) => {
              const items = Array.isArray(cell.result) ? cell.result : [];
              const cover = resolveImageUrl(items[0]);
              return {
                id: String(cell.id ?? `${cell.avgLat}-${cell.avgLng}`),
                image: cover,
                latitude: Number(cell.avgLat),
                longitude: Number(cell.avgLng),
                count: items.length,
                isCluster: items.length !== 1,
                items,
              };
            })
            .filter((c: any) => !isNaN(c.latitude) && !isNaN(c.longitude) && !!c.image);
        } else {
          mapped = list
            .map((p: any) => ({
              id: String(p.id ?? `${p.latitude}-${p.longitude}-${p.image}`),
              image: resolveImageUrl(p),
              latitude: Number(p.latitude ?? p.lat),
              longitude: Number(p.longitude ?? p.lng),
              count: 1,
              isCluster: false,
              items: [p],
            }))
            .filter((p: any) => !isNaN(p.latitude) && !isNaN(p.longitude) && !!p.image);
        }
      }

      // Filter out reported posts
      if (reportedPostsRef.current.size > 0) {
        mapped = mapped.filter(p => {
          if (reportedPostsRef.current.has(p.id)) return false;
          if (p.items && Array.isArray(p.items)) {
            p.items = p.items.filter((item: any) => !reportedPostsRef.current.has(item.id));
            if (p.items.length === 0) return false;
            p.count = p.items.length;
          }
          return true;
        });
      }

      // Detect new posts by comparing individual post IDs and locations
      const newPosts = new Set<string>();
      const currentKnownPosts = new Map(knownPosts);
      let hasNewPosts = false;

      // Process all individual posts from clusters and single posts
      const allIndividualPosts: any[] = [];
      mapped.forEach(cluster => {
        if (cluster.items && cluster.items.length > 0) {
          allIndividualPosts.push(...cluster.items);
        }
      });

      console.log("Processing individual posts:", {
        totalClusters: mapped.length,
        totalIndividualPosts: allIndividualPosts.length,
        knownPostsCount: knownPosts.size,
        previewedPostsCount: previewedPosts.size
      });

      // Check each individual post
      allIndividualPosts.forEach(post => {
        const postId = post.id;
        const postLat = Number(post.lat || post.latitude);
        const postLng = Number(post.lng || post.longitude);

        if (!postId || isNaN(postLat) || isNaN(postLng)) return;

        // Check if this post ID is known
        if (!knownPosts.has(postId)) {
          console.log("🆕 New post detected:", {
            id: postId,
            location: `${postLat}, ${postLng}`,
            caption: post.caption?.substring(0, 30) + "..."
          });

          // Add to known posts (posts seen on map)
          currentKnownPosts.set(postId, {
            lat: postLat,
            lng: postLng,
            timestamp: Date.now()
          });
          hasNewPosts = true;
        }

        // Check if post should show red border (known but not previewed)
        if (knownPosts.has(postId) && !previewedPosts.has(postId)) {
          newPosts.add(postId);
        } else if (!knownPosts.has(postId) && !previewedPosts.has(postId)) {
          // New post that hasn't been previewed
          newPosts.add(postId);
        }
      });

      // Update known posts if we found new ones
      if (hasNewPosts) {
        setKnownPosts(currentKnownPosts);
        saveKnownPosts(currentKnownPosts);
      }

      console.log("New post detection results:", {
        newPostsFound: newPosts.size,
        newPostIds: Array.from(newPosts),
        totalKnownPosts: currentKnownPosts.size,
        totalPreviewedPosts: previewedPosts.size
      });

      // Update new posts state
      setNewPostIds(newPosts);

      setServerPosts(mapped);
      console.log("PostsInView:mappedSample", JSON.stringify(mapped[0], null, 2));
      console.log("PostsInView:loaded", { count: mapped.length });
    } catch (e: any) {
      console.log("PostsInView:error", { status: e?.response?.status, data: e?.response?.data, message: e?.message });
      // Keep previous posts on error to prevent flickering
    }
  };

  const loadPeopleInView = async (region: typeof location) => {
    if (!region) return;
    const requestId = ++lastPeopleRequestId.current;
    const vp = buildViewport(region);
    try {
      const url = peopleUrl(vp);
      console.log("PeopleInView:request", { url, ...vp });
      const res = await api.get(url);
      if (requestId !== lastPeopleRequestId.current) return;
      console.log("PeopleInView:response", { status: res?.status, ok: res?.status >= 200 && res?.status < 300 });
      console.log(
        "PeopleInView:rawData",
        JSON.stringify(res?.data, null, 2)
      );
      const list = (res as any).data?.data || (res as any).data?.people || (res as any).data;
      console.log("PeopleInView:listResolved", {
        isArray: Array.isArray(list),
        length: Array.isArray(list) ? list.length : undefined,
        sample: Array.isArray(list) ? list[0] : list,
      });
      const resolveImageUrl = (item: any): string | null => {
        if (!item || typeof item !== "object") return null;
        const candidates: any[] = [
          item.imageUrl,
          item.photoUrl,
          item.image,
          item.coverUrl,
          item.thumbnail,
          item.thumbUrl,
          item.bgUrl,
          item.url,
          item?.image?.url,
          item?.photo?.url,
          Array.isArray(item.images) ? (typeof item.images[0] === "string" ? item.images[0] : item.images[0]?.url) : null,
          Array.isArray(item.files) ? (typeof item.files[0] === "string" ? item.files[0] : item.files[0]?.url) : null,
          Array.isArray(item.medias) ? (typeof item.medias[0] === "string" ? item.medias[0] : item.medias[0]?.url) : null,
        ];
        const raw = candidates.find((v) => typeof v === "string" && v.length > 0) ?? null;
        if (!raw) return null;
        if (/^https?:\/\//i.test(raw)) return raw;
        return `${UrlConstants.baseUrl}${raw.startsWith("/") ? "" : "/"}${raw}`;
      };
      const mapped = Array.isArray(list)
        ? list
          .map((p: any) => ({
            id: String(p.id ?? `${p.lat}-${p.lng}-${p.owner?.id ?? ""}`),
            latitude: Number(p.lat ?? p.latitude),
            longitude: Number(p.lng ?? p.longitude),
            imageUrl: resolveImageUrl(p) ?? resolveImageUrl(p?.owner) ?? undefined,
            owner: p.owner,
            locationName: p.locationName ?? p.owner?.locationName ?? p.location ?? p.owner?.location ?? "",
            activity: p.activity ?? p.statusActivity ?? p.owner?.activity ?? p.owner?.status ?? "",
            caption: p.caption ?? p.owner?.caption ?? "",
            lastActiveAt: p.lastActiveAt ?? p.owner?.lastActiveAt ?? p.updatedAt ?? p.owner?.updatedAt ?? null,
          }))
          .filter((p: any) => !isNaN(p.latitude) && !isNaN(p.longitude))
        : [];
      setServerPeople(mapped);
      console.log("PeopleInView:mappedSample", JSON.stringify(mapped[0], null, 2));
      console.log("PeopleInView:loaded", { count: mapped.length });
    } catch (e: any) {
      console.log("PeopleInView:error", { status: e?.response?.status, data: e?.response?.data, message: e?.message });
      // Keep previous people on error
    }
  };

  const handleLoadMessages = async () => {
    if (!selectedPerson?.owner?.id) {
      console.log("No selected person or owner ID");
      return;
    }
    if (!user) {
      toast.error("Please sign in to message");
      return;
    }

    try {
      setLoadingMessage(true);
      setChatOpen(true);
      setPersonOpen(false);

      console.log("Loading messages for user:", selectedPerson.owner.id);
      const res = await api.get(UrlConstants.fetchPeopleMessages(String(selectedPerson.owner.id)));
      const data = (res as any)?.data?.data || (res as any)?.data;

      console.log("Messages response:", data);
      setGroupDetails(data?.groupDetails || null);
      setGroupMessages(Array.isArray(data?.messages) ? data.messages : []);

      setTimeout(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    } catch (e: any) {
      console.log("PeopleMessage:error", {
        status: e?.response?.status,
        data: e?.response?.data,
        message: e?.message,
        stack: e?.stack
      });
      toast.error("Failed to load messages");
      setChatOpen(false); // Close chat on error
    } finally {
      setLoadingMessage(false);
    }
  };

  const handleNavigate = () => {
    console.log("🔄 Navigate button clicked - SIMPLE VERSION");

    // Prevent multiple rapid clicks during modal transitions
    if (modalTransitioning) {
      console.log("⚠️ Modal transition in progress, ignoring click");
      return;
    }

    // Simple validation
    if (!selectedPerson) {
      console.log("❌ No selected person");
      toast.error("No person selected");
      return;
    }

    if (!user) {
      console.log("❌ User not authenticated");
      toast.error("Please sign in first");
      return;
    }

    console.log("✅ Starting modal transition...");
    setModalTransitioning(true);

    // Close the person modal first to prevent conflicts
    setPersonOpen(false);

    // Use longer timeout to ensure person modal fully closes and React Native modal stack is cleared
    setTimeout(() => {
      console.log("✅ Person modal should be closed, now showing confirmation modal");
      setShowMapConfirmModal(true);
      setModalTransitioning(false);
    }, 400); // Increased delay to 400ms for better reliability
  };

  const handleViewLocationViewers = async () => {
    if (showViewersList) {
      setShowViewersList(false);
      return;
    }

    try {
      setLoadingViewers(true);
      setShowViewersList(true);

      const response = await api.get(UrlConstants.fetchFriendsPrivacy);

      if (response.data?.status === 'success' && Array.isArray(response.data?.data)) {
        const viewers = response.data.data
          .filter((f: any) => f.locationVisible !== false) // Include undefined (default true) and explicit true
          .map((f: any) => ({
            id: f.friend?.id || f.friendID,
            name: `${f.friend?.fname || ''} ${f.friend?.lname || ''}`.trim(),
            username: f.friend?.username,
            avatar: f.friend?.bgUrl
          }));
        setLocationViewers(viewers);
      }
    } catch (error) {
      console.error('Error fetching location viewers:', error);
      toast.error('Failed to load viewers');
    } finally {
      setLoadingViewers(false);
    }
  };

  const handleViewInMap = async () => {
    if (!selectedPerson?.latitude || !selectedPerson?.longitude) {
      toast.error("Location coordinates not available");
      setShowMapConfirmModal(false);
      return;
    }
    try {
      setLoadingNavigate(true);
      setShowMapConfirmModal(false);
      const lat = Number(selectedPerson.latitude);
      const lng = Number(selectedPerson.longitude);
      if (isNaN(lat) || isNaN(lng)) {
        throw new Error("Invalid coordinates");
      }
      if (Platform.OS === 'android') {
        const scheme = `comgooglemaps://?q=${lat},${lng}`;
        const geo = `geo:${lat},${lng}?q=${lat},${lng}`;
        const https = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        const canGoogle = await Linking.canOpenURL(scheme);
        const canGeo = await Linking.canOpenURL(geo);
        if (canGoogle) {
          await Linking.openURL(scheme);
        } else if (canGeo) {
          await Linking.openURL(geo);
        } else {
          await Linking.openURL(https);
        }
      } else {
        const scheme = `maps://?q=${lat},${lng}`;
        const http = `http://maps.apple.com/?ll=${lat},${lng}`;
        const canApple = await Linking.canOpenURL(scheme);
        if (canApple) {
          await Linking.openURL(scheme);
        } else {
          await Linking.openURL(http);
        }
      }
      toast.success("Opening in Maps");
    } catch (error) {
      toast.error("Failed to open Maps");
    } finally {
      setLoadingNavigate(false);
    }
  };



  const loadRecents = async () => {
    const perm = await MediaLibrary.requestPermissionsAsync();
    if (!perm.granted) {
      setRecents([]);
      return;
    }
    const assets = await MediaLibrary.getAssetsAsync({ first: 50, mediaType: MediaLibrary.MediaType.photo, sortBy: MediaLibrary.SortBy.creationTime });
    setRecents(assets.assets);
  };

  const loadGlobalPostsFromStorage = async () => {
    try {
      const data = await AsyncStorage.getItem('globalPosts');
      if (data) {
        const parsed = JSON.parse(data);
        console.log("Loading global posts from storage:", parsed.length);
        setGlobalPosts(parsed);
        setServerPosts(parsed);
      }
    } catch (error) {
      console.error('Error loading global posts from storage:', error);
    } finally {
      setIsRestoringGlobalPosts(false);
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
      console.log("🌍 Loading global posts in background:", { url, viewport: worldViewport });

      const res = await api.get(url);
      console.log("🌍 Global posts response:", { status: res?.status, ok: res?.status >= 200 && res?.status < 300 });

      const list = (res as any).data?.data || (res as any).data?.posts || (res as any).data;
      console.log("🌍 Global posts raw data:", { isArray: Array.isArray(list), length: Array.isArray(list) ? list.length : undefined });

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

      let mapped: { id: string; image: string | null; latitude: number; longitude: number; count?: number; items?: any[] }[] = [];
      if (Array.isArray(list)) {
        const looksLikeGrid = list.length > 0 && typeof list[0]?.avgLat === "number" && typeof list[0]?.avgLng === "number" && "result" in list[0];
        if (looksLikeGrid) {
          // Grid format - flatten all items
          mapped = list
            .map((cell: any) => {
              const items = Array.isArray(cell.result) ? cell.result : [];
              const cover = resolveImageUrl(items[0]);
              return {
                id: String(cell.id ?? `${cell.avgLat}-${cell.avgLng}`),
                image: cover,
                latitude: Number(cell.avgLat),
                longitude: Number(cell.avgLng),
                count: items.length,
                isCluster: items.length !== 1,
                items,
              };
            })
            .filter((c: any) => !isNaN(c.latitude) && !isNaN(c.longitude) && !!c.image);
        } else {
          // Direct posts format
          mapped = list
            .map((p: any) => ({
              id: String(p.id ?? `${p.latitude}-${p.longitude}-${p.image}`),
              image: resolveImageUrl(p),
              latitude: Number(p.latitude ?? p.lat),
              longitude: Number(p.longitude ?? p.lng),
              count: 1,
              isCluster: false,
              items: [p],
            }))
            .filter((p: any) => !isNaN(p.latitude) && !isNaN(p.longitude) && !!p.image);
        }
      }

      // Filter out reported posts
      if (reportedPostsRef.current.size > 0) {
        mapped = mapped.filter(p => {
          if (reportedPostsRef.current.has(p.id)) return false;
          if (p.items && Array.isArray(p.items)) {
            p.items = p.items.filter((item: any) => !reportedPostsRef.current.has(item.id));
            if (p.items.length === 0) return false;
            p.count = p.items.length;
          }
          return true;
        });
      }

      // Detect new posts by comparing individual post IDs and locations
      const newPosts = new Set<string>();
      // Use ref to get latest known posts (avoid closure staleness)
      const currentKnownPosts = new Map(knownPostsRef.current);
      let hasNewPosts = false;

      // Process all individual posts from clusters and single posts
      const allIndividualPosts: any[] = [];
      mapped.forEach(cluster => {
        if (cluster.items && cluster.items.length > 0) {
          allIndividualPosts.push(...cluster.items);
        }
      });

      // Check each individual post
      allIndividualPosts.forEach(post => {
        const postId = post.id;
        const postLat = Number(post.lat || post.latitude);
        const postLng = Number(post.lng || post.longitude);

        if (!postId || isNaN(postLat) || isNaN(postLng)) return;

        // Check if this post ID is known
        if (!knownPostsRef.current.has(postId)) {
          // Add to known posts (posts seen on map)
          currentKnownPosts.set(postId, {
            lat: postLat,
            lng: postLng,
            timestamp: Date.now()
          });
          hasNewPosts = true;
        }

        // Check if post should show red border (known but not previewed)
        if (knownPostsRef.current.has(postId) && !previewedPostsRef.current.has(postId)) {
          newPosts.add(postId);
        } else if (!knownPostsRef.current.has(postId) && !previewedPostsRef.current.has(postId)) {
          // New post that hasn't been previewed
          newPosts.add(postId);
        }
      });

      // Update known posts if we found new ones
      if (hasNewPosts) {
        setKnownPosts(currentKnownPosts);
        saveKnownPosts(currentKnownPosts);
      }

      // Update new posts state
      setNewPostIds(newPosts);

      setGlobalPosts(mapped);
      setServerPosts(mapped); // Populate map with global posts
      AsyncStorage.setItem('globalPosts', JSON.stringify(mapped)).catch(e => console.error("Failed to save global posts", e));
      console.log("🌍 Global posts loaded and mapped successfully:", { count: mapped.length });

      return mapped;
    } catch (e: any) {
      console.log("🌍 Global posts error:", { status: e?.response?.status, data: e?.response?.data, message: e?.message });
      // Don't show error toast here since it's background loading
      return [];
    } finally {
      setIsLoadingGlobalPosts(false);
    }
  };

  useEffect(() => {
    if (!location || isRestoringGlobalPosts) return;

    // Load data for the current view mode
    if (viewMode === "people") {
      loadPeopleInView(location);
    } else if (viewMode === "posts") {
      // Use global posts if available to avoid refetching on every move
      if (globalPosts.length > 0) {
        setServerPosts(globalPosts);
      } else if (!isLoadingGlobalPosts) {
        // Fallback to fetch if global posts are empty and not loading
        loadPostsInView(location);
      }
    }
  }, [location, viewMode, globalPosts, isLoadingGlobalPosts, isRestoringGlobalPosts]);

  // Load global posts on tarps screen mount for faster post browsing
  useEffect(() => {
    console.log("🚀 Starting background global posts loading...");
    loadGlobalPostsFromStorage().then(() => {
      loadGlobalPosts();
    });

    const timer = setTimeout(() => {
      setCanLoadImages(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!chatOpen || !groupDetails || !user) return;
    const socket = io(UrlConstants.groupsRoute, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
    });
    socketRef.current = socket;
    socket.on("connect", () => {
      socket.emit("joinGroupRoom", { roomID: groupDetails.id, userID: user.id });
    });
    socket.on("joinGroupRoom", ({ messages }: any) => {
      if (Array.isArray(messages)) {
        setGroupMessages(messages);
        setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 10);
      }
    });
    socket.on("groupRoomMessage", (data: any) => {
      if (!groupDetails || data.roomID !== groupDetails.id) return;
      setGroupMessages((prev) => {
        const exists = prev.slice(-5).find((m: any) => m?.content?.id === data?.content?.id);
        if (exists) return prev;
        return [...prev, data];
      });
      setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 10);
    });
    socket.on("error", async (err: any) => {
      if (err?.message === "unauthorized") {
        try {
          await api.get(UrlConstants.fetchAuthUser);
        } catch {
          toast.error("Session expired. Please login.");
        }
      } else {
        toast.error(err?.message || "Socket error");
      }
    });
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [chatOpen, groupDetails, user]);

  const handleSendChat = () => {
    if (!chatText.trim() || !socketRef.current || !groupDetails || !user) return;
    const messageID = String((uuid as any).v4());
    const payload = {
      roomID: groupDetails.id,
      content: { id: messageID, message: chatText.trim() },
      messageType: "user",
      sender: { id: user.id, fname: user.fname },
      createdAt: new Date().toISOString(),
    };
    setGroupMessages((prev) => [...prev, payload]);
    setChatText("");
    setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 10);
    socketRef.current.emit("groupRoomMessage", payload, (res: any) => {
      if (res?.status === "ok" && res?.id) {
        setGroupMessages((prev) =>
          prev.map((m: any) =>
            m?.content?.id === messageID ? { ...m, content: { ...m.content, id: res.id } } : m
          )
        );
      }
    });
  };

  // Optimized chat messages with precomputed data for performance
  const chatMessages = useMemo(() => {
    if (!groupMessages || !Array.isArray(groupMessages)) {
      return [];
    }

    return groupMessages.map((m: any, index: number) => {
      const isOwn = m?.sender?.id === user?.id;
      const displayName = selectedPerson?.owner?.fname || "User";
      const initial = (displayName?.[0] ?? "U").toUpperCase();
      const timeString = m?.createdAt ? moment(m.createdAt).fromNow() : "";

      return {
        ...m,
        isOwn,
        displayName,
        initial,
        timeString,
        id: m?.content?.id || `msg-${index}`
      };
    });
  }, [groupMessages, user?.id, selectedPerson?.owner?.fname]);

  // Memoized chat row component
  const ChatRow = useCallback(({ item }: { item: any }) => {
    if (!item) {
      return null;
    }

    return (
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
          {!item.isOwn && (
            <>
              {selectedPerson?.imageUrl ? (
                <ExpoImage
                  source={{ uri: selectedPerson.imageUrl }}
                  style={{ width: 24, height: 24, borderRadius: 12 }}
                  contentFit="cover"
                />
              ) : (
                <View style={{ width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#888" }}>
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>{item.initial || "U"}</Text>
                </View>
              )}
            </>
          )}
          <View style={[
            {
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 12,
              flex: 1,
              marginRight: item.isOwn ? 0 : 16,
              marginLeft: item.isOwn ? 16 : 0,
              alignSelf: item.isOwn ? "flex-end" : "flex-start",
              maxWidth: "80%"
            },
            item.isOwn
              ? { backgroundColor: "#0a0a0a" }
              : isDark ? { backgroundColor: "#1A1A1A" } : { backgroundColor: "#F5F5F5" }
          ]}>
            {!item.isOwn && item.displayName && (
              <Text style={{ fontSize: 12, fontWeight: "700", color: isDark ? "#FFFFFF" : "#0a0a0a", marginBottom: 2 }}>
                {item.displayName}
              </Text>
            )}
            <Text style={{ fontSize: 12, color: item.isOwn ? "#FFFFFF" : isDark ? "#FFFFFF" : "#0a0a0a" }}>
              {typeof item?.content === "string"
                ? item.content
                : (item?.content?.message ?? item?.content?.text ?? "")}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginLeft: item.isOwn ? 16 : 32 }}>
          <Text style={{ fontSize: 10, color: isDark ? "#9AA0A6" : "#666" }}>{item.timeString || ""}</Text>
        </View>
      </View>
    );
  }, [isDark, selectedPerson?.imageUrl]);

  const renderChatMessage = useCallback(({ item }: { item: any }) => (
    <ChatRow item={item} />
  ), [ChatRow]);

  const chatKeyExtractor = useCallback((item: any, index: number) => item.id || index.toString(), []);

  // Calculate optimal bounds for posts/people
  const calculateOptimalBounds = (items: any[]) => {
    if (items.length === 0) return null;

    const lats = items.map(item => item.latitude || item.lat || 0);
    const lngs = items.map(item => item.longitude || item.lng || 0);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Add padding around the bounds
    const latPadding = (maxLat - minLat) * 0.1 || 0.01;
    const lngPadding = (maxLng - minLng) * 0.1 || 0.01;

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(0.01, (maxLat - minLat) + latPadding),
      longitudeDelta: Math.max(0.01, (maxLng - minLng) + lngPadding),
    };
  };

  // Helper to immediately separate a cluster into individual posts or smaller sub-clusters
  const handleClusterExpansion = (clusterId: string, items: any[]) => {
    console.log("💥 Optimistically expanding cluster:", clusterId, "items:", items.length);

    if (items.length <= 1) return;

    // 1. Calculate the bounding box of the items to determine scale
    const lats = items.map(i => Number(i.latitude ?? i.lat));
    const lngs = items.map(i => Number(i.longitude ?? i.lng));
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latSpan = maxLat - minLat;
    const lngSpan = maxLng - minLng;

    // If items are practically at the same spot, we can't sub-cluster by location.
    // Fallback to exploding them so they might be visible if the map handles collisions or just show them overlapping.
    if (latSpan < 0.0001 && lngSpan < 0.0001) {
      // Just explode to individuals (as before)
      const expandedPosts = items
        .map((item: any) => {
          const img = extractImageUrl(item);
          const lat = Number(item.latitude ?? item.lat);
          const lng = Number(item.longitude ?? item.lng);
          if (!img || isNaN(lat) || isNaN(lng)) return null;
          return {
            id: String(item.id ?? `${lat}-${lng}-${Math.random()}`),
            image: img,
            latitude: lat,
            longitude: lng,
            count: 1,
            isCluster: false,
            items: [item]
          };
        })
        .filter((p: any) => p !== null) as typeof serverPosts;

      if (expandedPosts.length === 0) return;
      setServerPosts(prev => {
        const otherPosts = prev.filter(p => p.id !== clusterId);
        return [...otherPosts, ...expandedPosts];
      });
      return;
    }

    // 2. Determine clustering radius (e.g., 1/3 or 1/4 of the span)
    // This controls how aggressive the sub-clustering is.
    // A divisor of 3 or 4 usually breaks a large cluster into 3-5 distinct sub-groups.
    const radiusLat = Math.max(latSpan / 3.5, 0.00005);
    const radiusLng = Math.max(lngSpan / 3.5, 0.00005);

    // 3. Greedy Clustering Algorithm
    const unclustered = [...items];
    const newClusters: typeof serverPosts = [];

    while (unclustered.length > 0) {
      // Pick a center (first available item)
      const centerItem = unclustered[0];
      const centerLat = Number(centerItem.latitude ?? centerItem.lat);
      const centerLng = Number(centerItem.longitude ?? centerItem.lng);

      // Find all items within the radius of this center
      // (Using simple rectangular bounds for speed)
      const clusterItems = unclustered.filter(item => {
        const iLat = Number(item.latitude ?? item.lat);
        const iLng = Number(item.longitude ?? item.lng);
        return Math.abs(iLat - centerLat) <= radiusLat &&
          Math.abs(iLng - centerLng) <= radiusLng;
      });

      // Remove these items from unclustered
      const clusterIds = new Set(clusterItems.map((i: any) => i.id));
      // Manual filter since we might have duplicates or tricky IDs in raw data
      // We iterate backwards or just rebuild unclustered
      let i = unclustered.length;
      while (i--) {
        if (clusterIds.has(unclustered[i].id)) {
          unclustered.splice(i, 1);
        }
      }

      // Create the new cluster/post object
      const count = clusterItems.length;

      // Calculate average position for the new marker
      const avgLat = clusterItems.reduce((sum, i) => sum + Number(i.latitude ?? i.lat), 0) / count;
      const avgLng = clusterItems.reduce((sum, i) => sum + Number(i.longitude ?? i.lng), 0) / count;

      // Use image of the first item (or could pick representative)
      const img = extractImageUrl(clusterItems[0]);

      if (img && !isNaN(avgLat) && !isNaN(avgLng)) {
        newClusters.push({
          id: count === 1
            ? String(clusterItems[0].id ?? `${avgLat}-${avgLng}-${Math.random()}`)
            : `subcluster-${clusterId}-${avgLat}-${avgLng}`, // distinct ID for new cluster
          image: img,
          latitude: avgLat,
          longitude: avgLng,
          count: count,
          items: clusterItems
        });
      }
    }

    if (newClusters.length === 0) return;

    // 4. Update state immediately
    setServerPosts(prev => {
      const otherPosts = prev.filter(p => p.id !== clusterId);
      return [...otherPosts, ...newClusters];
    });
  };



  // Intelligent zoom out - use recorded zoom history to go back exactly
  const handleZoomOut = () => {
    // 1. Determine current zoom/delta
    let currentZoom = 1;
    let currentLatDelta = 120;

    if (Platform.OS === 'android' && useMapboxGL) {
      currentZoom = mapboxCamera.zoomLevel;
    } else if (mapRegion) {
      currentLatDelta = mapRegion.latitudeDelta;
      // Approximate zoom for comparison consistency if needed, but delta checking is fine for iOS
      currentZoom = Math.round(Math.log2(360 / currentLatDelta));
    }

    // 2. Find a valid target in history
    let targetIndex = -1;

    // Scan backwards to find the first state that is "wider" (more zoomed out) than current
    for (let i = zoomHistory.length - 1; i >= 0; i--) {
      const entry = zoomHistory[i];
      let isWider = false;

      if (Platform.OS === 'android' && useMapboxGL) {
        // Mapbox: target zoom must be smaller than current
        // Use a buffer (0.5) to ensure it's a significant zoom out
        isWider = (entry.zoomLevel || 0) < (currentZoom - 0.5);
      } else {
        // iOS: target delta must be larger than current
        isWider = entry.latitudeDelta > (currentLatDelta * 1.1);
      }

      if (isWider) {
        targetIndex = i;
        break;
      }
    }

    // 3. Fallback logic if no valid history found
    if (targetIndex === -1) {
      console.log("🔙 Smart Zoom Out: No wider history found. Clearing history and resetting.");
      setZoomHistory([]);
      zoomToWorldView();
      return;
    }

    // 4. Restore the specific target state
    const targetState = zoomHistory[targetIndex];
    console.log(`🔙 Smart Zoom Out: Restoring history index ${targetIndex}`);

    // We consume the history up to the target (target becomes current)
    setZoomHistory(prev => prev.slice(0, targetIndex));

    // Restore cached posts if available
    if (viewMode === "posts" && targetState.posts && targetState.posts.length > 0) {
      console.log("♻️ Restoring cached posts from history:", targetState.posts.length);
      setServerPosts(targetState.posts);
    }

    if (Platform.OS === 'android' && useMapboxGL) {
      const postsForBounds = targetState.posts && targetState.posts.length > 0 ? targetState.posts : [];

      if (postsForBounds.length > 0 && mapboxCameraRef.current && mapboxCameraRef.current.setCamera) {
        const latitudes = postsForBounds.map((p: any) => Number(p.latitude));
        const longitudes = postsForBounds.map((p: any) => Number(p.longitude));
        const minLat = Math.min(...latitudes);
        const maxLat = Math.max(...latitudes);
        const minLng = Math.min(...longitudes);
        const maxLng = Math.max(...longitudes);

        mapboxCameraRef.current.setCamera({
          bounds: { ne: [maxLng, maxLat], sw: [minLng, minLat] },
          padding: { paddingLeft: 48, paddingRight: 48, paddingTop: 48, paddingBottom: 48 },
          animationDuration: 1200,
          animationMode: 'easeTo',
        });
      } else {
        // Fallback to center/zoom restoration
        setMapboxCamera({
          centerCoordinate: [targetState.longitude, targetState.latitude],
          zoomLevel: targetState.zoomLevel || 1,
          animationDuration: 1200,
        });
      }
      setCurrentZoomLevel(targetState.zoomLevel || 1);
    } else if (mapRef.current) {
      // Apple Maps restoration
      const newRegion = {
        latitude: targetState.latitude,
        longitude: targetState.longitude,
        latitudeDelta: targetState.latitudeDelta,
        longitudeDelta: targetState.longitudeDelta,
      };

      mapRef.current.animateToRegion(newRegion, 2000);
      setMapRegion(newRegion);
      setLocation(newRegion);

      const zoomLevel = Math.round(Math.log2(360 / newRegion.latitudeDelta));
      setCurrentZoomLevel(Math.max(1, Math.min(20, zoomLevel)));
    }
  };

  // Function to zoom out to world view level when switching view modes
  const zoomToWorldView = () => {
    if (!location) return;

    // Define world-level zoom (global view)
    const worldRegion = {
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 120, // Large delta for world view
      longitudeDelta: 120, // Large delta for world view
    };

    if (Platform.OS === 'android' && useMapboxGL) {
      // Mapbox GL zoom to world level
      setMapboxCamera({
        centerCoordinate: [location.longitude, location.latitude],
        zoomLevel: 1, // World level zoom
        animationDuration: 800,
      });
      setCurrentZoomLevel(0); // Reset zoom level
    } else if (mapRef.current) {
      // Apple Maps zoom to world level
      mapRef.current.animateToRegion(worldRegion, 800);
      setMapRegion(worldRegion);
      setCurrentZoomLevel(0); // Reset zoom level
    }

    // Clear zoom history when switching modes
    setZoomHistory([]);
  };

  if (!location) {
    return (
      <View style={styles.center}>
        <Text>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="light" />
      {/* Conditional Map Rendering: Mapbox GL for Android (if available), Apple Maps for iOS */}
      {Platform.OS === 'android' && useMapboxGL && MapboxGL ? (
        // Mapbox GL for Android (when available)
        <MapboxGL.MapView
          style={{ flex: 1 }}
          styleURL={'mapbox://styles/mapbox/streets-v12'}
          projection="globe"
          scaleBarEnabled={false}
          onRegionDidChange={(feature: any) => {
            // Handle region changes for Mapbox GL
            if (feature && feature.properties) {
              const { zoomLevel, visibleBounds } = feature.properties;
              const center = feature.geometry.coordinates;
              // We update mapboxCamera state to keep it in sync, but without triggering a re-render loop if possible
              // However, since handleZoomOut relies on mapboxCamera state, we need to update it.
              // To avoid jitters, we might only update if significantly different or just rely on ref if available?
              // Actually, let's just update the ref's knowledge or state.
              // Updating state might cause re-renders. Let's try to be careful.
              // For now, let's update state so handleZoomOut works.
              setMapboxCamera((prev: any) => ({
                ...prev,
                zoomLevel: zoomLevel,
                centerCoordinate: center,
              }));
              // Also sync currentZoomLevel for consistency
              setCurrentZoomLevel(zoomLevel);
            }
          }}
        >
          <MapboxGL.Camera
            ref={mapboxCameraRef}
            centerCoordinate={mapboxCamera.centerCoordinate}
            zoomLevel={mapboxCamera.zoomLevel}
            animationDuration={mapboxCamera.animationDuration}
          />

          {/* Posts Markers for Mapbox GL */}
          {viewMode === "posts" && serverPosts
            .filter((p) => !!p.image)
            .map((p) => (
              <MapboxGL.PointAnnotation
                key={p.id}
                id={p.id}
                coordinate={[p.longitude, p.latitude]}
                onSelected={() => {
                  // Same logic as Apple Maps marker press
                  if (p.count && p.count > 1 && Array.isArray(p.items)) {
                    const latDiff = Math.max(...p.items.map((i: any) => Number(i.latitude ?? i.lat ?? p.latitude))) -
                      Math.min(...p.items.map((i: any) => Number(i.latitude ?? i.lat ?? p.latitude)));
                    const lngDiff = Math.max(...p.items.map((i: any) => Number(i.longitude ?? i.lng ?? p.longitude))) -
                      Math.min(...p.items.map((i: any) => Number(i.longitude ?? i.lng ?? p.longitude)));

                    if (latDiff < 0.001 && lngDiff < 0.001) {
                      // Handle stacked posts
                      try {
                        const allUrls: string[] = [];
                        const allIds: (string | null)[] = [];
                        const allItems: any[] = [];

                        p.items.forEach((item: any) => {
                          const resolveItemImageSet = (item: any): { urls: string[]; ids: (string | null)[] } => {
                            const urls: string[] = [];
                            const ids: (string | null)[] = [];
                            if (Array.isArray(item?.images) && item.images.length > 0) {
                              item.images.forEach((im: any) => {
                                const raw = typeof im === "string" ? im : im?.url;
                                const id = typeof im?.id === "string" || typeof im?.id === "number" ? String(im.id) : null;
                                if (typeof raw === "string" && raw.length > 0) {
                                  const cleaned = raw.replace(/`/g, "").trim();
                                  urls.push(cleaned);
                                  ids.push(id);
                                }
                              });
                            } else {
                              const cover = extractImageUrl(item);
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
                              const fallbackId = extractImageId(item);
                              if (cover) {
                                urls.push(cover);
                                ids.push(fallbackId);
                              }
                            }
                            return { urls, ids };
                          };

                          const itemSet = resolveItemImageSet(item);
                          allUrls.push(...itemSet.urls);
                          allIds.push(...itemSet.ids);
                          itemSet.urls.forEach(() => allItems.push(item));
                        });

                        const primaryItem = p.items[0];
                        const combinedSet = { urls: allUrls, ids: allIds };

                        // Mark all posts in the stack as viewed immediately
                        if (allIds.length > 0) {
                          const validIds = allIds.filter((id): id is string => id !== null);
                          markPostsAsViewed(validIds);
                        }

                        router.push(`/post/${primaryItem.id || 'unknown'}?item=${encodeURIComponent(JSON.stringify(primaryItem))}&images=${encodeURIComponent(JSON.stringify(combinedSet))}&allItems=${encodeURIComponent(JSON.stringify(allItems))}&idx=0&serverPosts=${encodeURIComponent(JSON.stringify(serverPosts))}`);
                      } catch (error) {
                        console.error("Failed to navigate to stacked posts:", error);
                        toast.error("Failed to open posts");
                      }
                    } else {
                      // Zoom to separate posts
                      // Record current state before zooming in
                      setZoomHistory(prev => [...prev, {
                        latitude: mapboxCamera.centerCoordinate[1],
                        longitude: mapboxCamera.centerCoordinate[0],
                        latitudeDelta: 0, // Not used for Mapbox
                        longitudeDelta: 0, // Not used for Mapbox
                        zoomLevel: mapboxCamera.zoomLevel,
                        posts: serverPosts // Cache current posts
                      }]);

                      // Optimistically expand cluster
                      handleClusterExpansion(p.id, p.items);

                      const bounds = {
                        minLat: Math.min(...p.items.map((i: any) => Number(i.latitude ?? i.lat ?? p.latitude))),
                        maxLat: Math.max(...p.items.map((i: any) => Number(i.latitude ?? i.lat ?? p.latitude))),
                        minLng: Math.min(...p.items.map((i: any) => Number(i.longitude ?? i.lng ?? p.longitude))),
                        maxLng: Math.max(...p.items.map((i: any) => Number(i.longitude ?? i.lng ?? p.longitude))),
                      };
                      if (mapboxCameraRef.current && mapboxCameraRef.current.setCamera) {
                        mapboxCameraRef.current.setCamera({
                          bounds: {
                            ne: [bounds.maxLng, bounds.maxLat],
                            sw: [bounds.minLng, bounds.minLat],
                          },
                          padding: { paddingLeft: 48, paddingRight: 48, paddingTop: 48, paddingBottom: 48 },
                          animationDuration: 1200,
                          animationMode: 'easeTo',
                        });
                      } else {
                        const centerLat = (bounds.minLat + bounds.maxLat) / 2;
                        const centerLng = (bounds.minLng + bounds.maxLng) / 2;
                        const latDelta = Math.max(0.01, Math.abs(bounds.maxLat - bounds.minLat) * 1.5);
                        const zoomLevel = Math.max(3, Math.min(16, Math.log2(360 / latDelta)));
                        setMapboxCamera({
                          centerCoordinate: [centerLng, centerLat],
                          zoomLevel,
                          animationDuration: 1200,
                        });
                      }
                    }
                  } else if (p.image && Array.isArray(p.items) && p.items.length > 0) {
                    // Handle single post
                    const item = p.items[0];
                    try {
                      const resolveItemImageSet = (item: any): { urls: string[]; ids: (string | null)[] } => {
                        const urls: string[] = [];
                        const ids: (string | null)[] = [];
                        if (Array.isArray(item?.images) && item.images.length > 0) {
                          item.images.forEach((im: any) => {
                            const raw = typeof im === "string" ? im : im?.url;
                            const id = typeof im?.id === "string" || typeof im?.id === "number" ? String(im.id) : null;
                            if (typeof raw === "string" && raw.length > 0) {
                              const cleaned = raw.replace(/`/g, "").trim();
                              urls.push(cleaned);
                              ids.push(id);
                            }
                          });
                        } else {
                          const cover = extractImageUrl(item);
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
                          const fallbackId = extractImageId(item);
                          if (cover) {
                            urls.push(cover);
                            ids.push(fallbackId);
                          }
                        }
                        return { urls, ids };
                      };
                      const set = resolveItemImageSet(item);
                      // Mark single post as viewed immediately
                      if (item.id) {
                        markPostsAsViewed([item.id]);
                      }
                      router.push(`/post/${item.id || 'unknown'}?item=${encodeURIComponent(JSON.stringify(item))}&images=${encodeURIComponent(JSON.stringify(set))}&idx=0&serverPosts=${encodeURIComponent(JSON.stringify(serverPosts))}`);
                    } catch (error) {
                      console.error("Failed to navigate to post:", error);
                      toast.error("Failed to open post");
                    }
                  }
                }}
              >
                <View style={[
                  styles.markerContainer,
                  isDark ? styles.markerDark : styles.markerLight,
                  p.items?.some((item: any) => newPostIds.has(item.id)) && styles.markerContainerNew
                ]}>
                  <RNImage
                    source={{ uri: p.image as string }}
                    style={styles.markerImage}
                    resizeMode="cover"
                  />
                  {!!p.count && p.count > 1 && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countText}>{p.count >= 1000 ? `${Math.floor(p.count / 1000)}k` : `${p.count}`}</Text>
                    </View>
                  )}
                </View>
              </MapboxGL.PointAnnotation>
            ))}

          {/* People Markers for Mapbox GL */}
          {viewMode === "people" && serverPeople.map((p) => (
            <MapboxGL.PointAnnotation
              key={p.id}
              id={p.id}
              coordinate={[p.longitude, p.latitude]}
              onSelected={() => {
                setSelectedPerson(p);
                setPersonOpen(true);
              }}
            >
              <View style={[styles.markerContainer, isDark ? styles.markerDark : styles.markerLight]}>
                {p.imageUrl ? (
                  <RNImage
                    source={{ uri: p.imageUrl }}
                    style={styles.markerImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.markerImage, { alignItems: "center", justifyContent: "center", backgroundColor: "#888" }]}>
                    <Text style={{ color: "#fff", fontWeight: "700" }}>{p.owner?.fname?.[0]?.toUpperCase() || "F"}</Text>
                  </View>
                )}
                <View style={styles.locBadge}>
                  <Ionicons name="location-outline" size={14} color="#FFFFFF" />
                </View>
              </View>
            </MapboxGL.PointAnnotation>
          ))}
        </MapboxGL.MapView>
      ) : (
        // Fallback to regular MapView for iOS or when Mapbox GL is not available on Android
        // Apple Maps for iOS
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
          style={{ flex: 1 }}
          initialRegion={location}
          onRegionChangeComplete={(r) => {
            const reg = { latitude: r.latitude, longitude: r.longitude, latitudeDelta: r.latitudeDelta, longitudeDelta: r.longitudeDelta } as typeof location;
            setMapRegion(reg);

            // Load data for the current view mode (removed automatic zoom level updates)
            if (viewMode === "posts") {
              setTimeout(() => {
                loadPostsInView(reg);
              }, 50);
            }
            if (viewMode === "people") {
              loadPeopleInView(reg);
            }
          }}
          mapType="hybridFlyover"
          showsCompass={true}
          showsPointsOfInterests={true}
          showsBuildings={true}
          showsTraffic={false}
          showsIndoors={true}
          showsUserLocation={false}
          followsUserLocation={false}
          toolbarEnabled={false}
          zoomControlEnabled={false}
          pitchEnabled={true}
          rotateEnabled={true}
          scrollEnabled={true}
          zoomEnabled={true}
          maxZoomLevel={20}
          minZoomLevel={3}
        >
          {viewMode === "posts"
            ? serverPosts
              .filter((p) => !!p.image)
              .map((p) => (
                <Marker
                  key={p.id}
                  coordinate={{ latitude: p.latitude, longitude: p.longitude }}
                  onPress={() => {
                    if (!user) {
                      setShowAuthModal(true);
                      return;
                    }

                    if (p.count && p.count > 1 && Array.isArray(p.items)) {
                      // Check if posts are actually stacked (very close together) or just clustered
                      const latDiff = Math.max(...p.items.map((i: any) => Number(i.latitude ?? i.lat ?? p.latitude))) -
                        Math.min(...p.items.map((i: any) => Number(i.latitude ?? i.lat ?? p.latitude)));
                      const lngDiff = Math.max(...p.items.map((i: any) => Number(i.longitude ?? i.lng ?? p.longitude))) -
                        Math.min(...p.items.map((i: any) => Number(i.longitude ?? i.lng ?? p.longitude)));

                      console.log("Multiple posts detected:", { count: p.count, latDiff, lngDiff, threshold: 0.001 });

                      // If posts are very close together (stacked), open post preview with all items
                      if (latDiff < 0.001 && lngDiff < 0.001) {
                        console.log("Posts are stacked, opening combined preview");
                        try {
                          // Create a combined image set from all items in the stack
                          const allUrls: string[] = [];
                          const allIds: (string | null)[] = [];
                          const allItems: any[] = [];

                          p.items.forEach((item: any) => {
                            const resolveItemImageSet = (item: any): { urls: string[]; ids: (string | null)[] } => {
                              const urls: string[] = [];
                              const ids: (string | null)[] = [];
                              if (Array.isArray(item?.images) && item.images.length > 0) {
                                item.images.forEach((im: any) => {
                                  const raw = typeof im === "string" ? im : im?.url;
                                  const id = typeof im?.id === "string" || typeof im?.id === "number" ? String(im.id) : null;
                                  if (typeof raw === "string" && raw.length > 0) {
                                    const cleaned = raw.replace(/`/g, "").trim();
                                    urls.push(cleaned);
                                    ids.push(id);
                                  }
                                });
                              } else {
                                const cover = extractImageUrl(item);
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
                                const fallbackId = extractImageId(item);
                                if (cover) {
                                  urls.push(cover);
                                  ids.push(fallbackId);
                                }
                              }
                              return { urls, ids };
                            };

                            const itemSet = resolveItemImageSet(item);
                            allUrls.push(...itemSet.urls);
                            allIds.push(...itemSet.ids);
                            // Add the item for each of its images so we can track which item each image belongs to
                            itemSet.urls.forEach(() => allItems.push(item));
                          });

                          // Use the first item as the primary item, but pass all images and items
                          const primaryItem = p.items[0];
                          const combinedSet = { urls: allUrls, ids: allIds };

                          // Mark all posts in the stack as viewed immediately
                          if (allIds.length > 0) {
                            const validIds = allIds.filter((id): id is string => id !== null);
                            markPostsAsViewed(validIds);
                          }

                          console.log("Combined set created:", { totalImages: allUrls.length, totalItems: allItems.length });
                          router.push(`/post/${primaryItem.id || 'unknown'}?item=${encodeURIComponent(JSON.stringify(primaryItem))}&images=${encodeURIComponent(JSON.stringify(combinedSet))}&allItems=${encodeURIComponent(JSON.stringify(allItems))}&idx=0&serverPosts=${encodeURIComponent(JSON.stringify(serverPosts))}`);
                        } catch (error) {
                          console.error("Failed to navigate to stacked posts:", error);
                          toast.error("Failed to open posts");
                        }
                      } else {
                        // Posts are spread out, zoom in to separate them
                        console.log("Posts are spread out, zooming in to separate");

                        // Record current state before zooming in
                        const currentRegion = mapRegion || location;
                        if (currentRegion) {
                          setZoomHistory(prev => [...prev, {
                            latitude: currentRegion.latitude,
                            longitude: currentRegion.longitude,
                            latitudeDelta: currentRegion.latitudeDelta,
                            longitudeDelta: currentRegion.longitudeDelta,
                            posts: serverPosts // Cache current posts
                          }]);
                        }

                        // Optimistically expand cluster
                        handleClusterExpansion(p.id, p.items);

                        const bounds = {
                          minLat: Math.min(...p.items.map((i: any) => Number(i.latitude ?? i.lat ?? p.latitude))),
                          maxLat: Math.max(...p.items.map((i: any) => Number(i.latitude ?? i.lat ?? p.latitude))),
                          minLng: Math.min(...p.items.map((i: any) => Number(i.longitude ?? i.lng ?? p.longitude))),
                          maxLng: Math.max(...p.items.map((i: any) => Number(i.longitude ?? i.lng ?? p.longitude))),
                        };
                        const region = {
                          latitude: (bounds.minLat + bounds.maxLat) / 2,
                          longitude: (bounds.minLng + bounds.maxLng) / 2,
                          latitudeDelta: Math.max(0.01, Math.abs(bounds.maxLat - bounds.minLat) * 1.5),
                          longitudeDelta: Math.max(0.01, Math.abs(bounds.maxLng - bounds.minLng) * 1.5),
                        } as any;
                        mapRef.current?.animateToRegion(region, 50);
                      }
                    } else if (p.image && Array.isArray(p.items) && p.items.length > 0) {
                      const item = p.items[0];
                      try {
                        const resolveItemImageSet = (item: any): { urls: string[]; ids: (string | null)[] } => {
                          const urls: string[] = [];
                          const ids: (string | null)[] = [];
                          if (Array.isArray(item?.images) && item.images.length > 0) {
                            item.images.forEach((im: any) => {
                              const raw = typeof im === "string" ? im : im?.url;
                              const id = typeof im?.id === "string" || typeof im?.id === "number" ? String(im.id) : null;
                              if (typeof raw === "string" && raw.length > 0) {
                                const cleaned = raw.replace(/`/g, "").trim();
                                urls.push(cleaned);
                                ids.push(id);
                              }
                            });
                          } else {
                            const cover = extractImageUrl(item);
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
                            const fallbackId = extractImageId(item);
                            if (cover) {
                              urls.push(cover);
                              ids.push(fallbackId);
                            }
                          }
                          return { urls, ids };
                        };
                        const set = resolveItemImageSet(item);
                        // Mark single post as viewed immediately
                        if (item.id) {
                          markPostsAsViewed([item.id]);
                        }
                        router.push(`/post/${item.id || 'unknown'}?item=${encodeURIComponent(JSON.stringify(item))}&images=${encodeURIComponent(JSON.stringify(set))}&idx=0&serverPosts=${encodeURIComponent(JSON.stringify(serverPosts))}`);
                      } catch (error) {
                        console.error("Failed to navigate to post:", error);
                        toast.error("Failed to open post");
                      }
                    }
                  }}
                >
                  <View style={[
                    styles.markerContainer,
                    isDark ? styles.markerDark : styles.markerLight,
                    p.items?.some((item: any) => newPostIds.has(item.id)) && styles.markerContainerNew
                  ]}>
                    <ExpoImage
                      source={canLoadImages ? { uri: p.image as string } : require("@/assets/images/peop.png")}
                      style={styles.markerImage}
                      contentFit="cover"
                      cachePolicy="none"
                      placeholder={require("@/assets/images/peop.png")}
                      placeholderContentFit="cover"
                      transition={200}
                    />
                    {!!p.count && p.count > 1 && (
                      <View style={styles.countBadge}>
                        <Text style={styles.countText}>{p.count >= 1000 ? `${Math.floor(p.count / 1000)}k` : `${p.count}`}</Text>
                      </View>
                    )}
                  </View>
                  <View style={[styles.pointer, styles.pointerLight]} />
                </Marker>
              ))
            : serverPeople.map((p) => (
              <Marker
                key={p.id}
                coordinate={{ latitude: p.latitude, longitude: p.longitude }}
                onPress={() => {
                  if (!user) {
                    setShowAuthModal(true);
                    return;
                  }
                  setSelectedPerson(p);
                  setPersonOpen(true);
                }}
              >
                <View style={[styles.markerContainer, isDark ? styles.markerDark : styles.markerLight]}>
                  {p.imageUrl ? (
                    <ExpoImage
                      source={{ uri: p.imageUrl }}
                      style={styles.markerImage}
                      contentFit="cover"
                      placeholder={isDark ? require("@/assets/images/peop.png") : require("@/assets/images/peop.png")}
                      placeholderContentFit="cover"
                      transition={200}
                    />
                  ) : (
                    <View style={[styles.markerImage, { alignItems: "center", justifyContent: "center", backgroundColor: "#888" }]}>
                      <Text style={{ color: "#fff", fontWeight: "700" }}>{p.owner?.fname?.[0]?.toUpperCase() || "F"}</Text>
                    </View>
                  )}
                  <View style={styles.locBadge}>
                    <Ionicons name="location-outline" size={14} color="#FFFFFF" />
                  </View>
                </View>
                <View style={[styles.pointer, styles.pointerLight]} />
              </Marker>
            ))}
        </MapView>
      )}

      <Modal visible={chatOpen} transparent animationType="fade" onRequestClose={() => setChatOpen(false)}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.shareSheet,
              {
                height: Dimensions.get("window").height * 0.70,
              },
              isDark ? styles.sheetDark : styles.sheetLight
            ]}
          >
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              keyboardVerticalOffset={Platform.OS === "ios" ? 240 : 240}
            >
              <View style={styles.sheetHeader}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Ionicons name="chatbubble-outline" size={18} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
                  <Text style={[styles.sheetTitle, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>
                    Message {selectedPerson?.owner?.fname || "User"} {selectedPerson?.owner?.lname || ""}
                  </Text>
                </View>
                <Pressable style={styles.headerIcon} onPress={() => setChatOpen(false)}>
                  <Ionicons name="close" size={20} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
                </Pressable>
              </View>

              {chatMessages && chatMessages.length >= 0 ? (
                <FlatList
                  ref={chatScrollRef}
                  data={chatMessages}
                  renderItem={renderChatMessage}
                  keyExtractor={chatKeyExtractor}
                  style={{ flex: 1 }}
                  contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, gap: 12 }}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={true}
                  removeClippedSubviews={false}
                  maxToRenderPerBatch={10}
                  windowSize={10}
                  initialNumToRender={8}
                  ListEmptyComponent={
                    <Text style={{ color: isDark ? "#9AA0A6" : "#666" }}>No messages yet</Text>
                  }
                />
              ) : (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                  <ActivityIndicator size="large" color={isDark ? "#FFFFFF" : "#0a0a0a"} />
                  <Text style={{ color: isDark ? "#9AA0A6" : "#666", marginTop: 10 }}>Loading messages...</Text>
                </View>
              )}

              <View style={[
                styles.inputContainer,
                {
                  paddingBottom: insets.bottom,
                  borderTopColor: isDark ? "#333" : "#E0E0E0",
                  backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF"
                }
              ]}>
                <View style={[styles.chatInputBox, isDark ? styles.chatInputDark : styles.chatInputLight]}>
                  <TextInput
                    value={chatText}
                    onChangeText={setChatText}
                    placeholder="Type a message..."
                    placeholderTextColor={isDark ? "#888" : "#999"}
                    style={[styles.chatInput, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}
                  />
                  <Pressable
                    style={[styles.chatSendBtn, isDark ? styles.chatSendDark : styles.chatSendLight]}
                    onPress={handleSendChat}
                  >
                    <Ionicons name="paper-plane-outline" size={18} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
                  </Pressable>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </View>
      </Modal>

      {/* Zoom Controls */}
      <View style={[styles.zoomControls, { bottom: insets.bottom + 20 }]}>

        <Pressable
          style={[styles.zoomButton, isDark ? styles.zoomButtonDark : styles.zoomButtonLight]}
          onPress={handleZoomOut}
        >
          <Ionicons name="remove" size={20} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
        </Pressable>
      </View>

      {/* Hand Animation Guide - Only show in posts view */}
      {showHandAnimation && viewMode === "posts" && (
        <View style={[styles.handAnimationContainer, { top: insets.top + 80 }]}>
          <View
            style={[
              styles.handAnimationCard,
              {
                opacity: isHandAnimationVisible ? 1 : 0.3,
                transform: [{ scale: isHandAnimationVisible ? 1 : 0.95 }]
              },
              isDark ? styles.handAnimationDark : styles.handAnimationLight
            ]}
          >
            <View style={styles.handAnimationContent}>
              <Text style={styles.handEmoji}>👇</Text>
              <Text style={[styles.handAnimationText, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>
                Rotate the globe to view posts in other continents
              </Text>
            </View>
            <Pressable
              style={styles.handAnimationClose}
              onPress={() => void dismissHandAnimation()}
            >
              <Ionicons name="close" size={16} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
            </Pressable>
          </View>
        </View>
      )}

      {/* Upload Status Indicator - Centered at top */}
      {isUploading && (
        <View style={[styles.uploadStatusPill, isDark ? styles.pillDark : styles.pillLight, { top: insets.top + 8 }]}>
          <ActivityIndicator size="small" color={isDark ? "#FFFFFF" : "#000000"} />
          <Text style={[styles.uploadStatusText, { color: isDark ? "#FFFFFF" : "#000000" }]}>
            Posting...
          </Text>
        </View>
      )}

      <View style={[styles.topBar, { top: insets.top + 8 }]}>

        <View style={styles.leftButtons}>
          <View style={[styles.viewTogglePill, isDark ? styles.pillDark : styles.pillLight]}>
            <Pressable
              style={[styles.pillSeg, viewMode === "posts" ? (isDark ? styles.pillSegActiveDark : styles.pillSegActiveLight) : null]}
              onPress={() => {
                if (!user) {
                  setShowAuthModal(true);
                  return;
                }
                setViewMode("posts");
                zoomToWorldView(); // Zoom out to world view level
                // Load posts after a short delay to allow zoom animation
                setTimeout(() => {
                  loadPostsInView(mapRegion || location);
                }, 100);
              }}
            >
              <Ionicons name="image-outline" size={18} color={viewMode === "posts" ? "#FFFFFF" : (isDark ? "#FFFFFF" : "#0a0a0a")} />
            </Pressable>
            <Pressable
              style={[styles.pillSeg, viewMode === "people" ? (isDark ? styles.pillSegActiveDark : styles.pillSegActiveLight) : null]}
              onPress={() => {
                if (!user) {
                  setShowAuthModal(true);
                  return;
                }
                setViewMode("people");
                zoomToWorldView(); // Zoom out to world view level
                // Load people after a short delay to allow zoom animation
                setTimeout(() => {
                  loadPeopleInView(mapRegion || location);
                }, 100);
              }}
            >
              <Ionicons name="people-outline" size={18} color={viewMode === "people" ? "#FFFFFF" : (isDark ? "#FFFFFF" : "#0a0a0a")} />
            </Pressable>
          </View>

          {/* Location Permission Indicator */}
          {!hasLocationPermission && (
            <Pressable
              style={[styles.locationIndicator, isDark ? styles.locationIndicatorDark : styles.locationIndicatorLight]}
              onPress={() => {
                if (!user) {
                  setShowAuthModal(true);
                  return;
                }
                Alert.alert(
                  "Enable Location",
                  "Go to your settings to give location permission.",
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Open Settings", onPress: () => Linking.openSettings() }
                  ]
                );
              }}
            >
              <Ionicons name="location-outline" size={14} color={isDark ? "#FFA500" : "#FF8C00"} />
              <Text style={[styles.locationIndicatorText, { color: isDark ? "#FFA500" : "#FF8C00" }]}>
                Enable Location
              </Text>
            </Pressable>
          )}
        </View>
        <Pressable
          style={[styles.myPostsBtn, isDark ? styles.myPostsDark : styles.myPostsLight]}
          onPress={openProfileScreen}
        >
          <Ionicons name="person" size={16} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
          <Text style={[styles.myPostsText, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>My Posts</Text>
        </Pressable>
      </View>

      {viewMode === "posts" ? (
        <Pressable
          style={[styles.uploadButton, isDark ? styles.uploadBtnDark : styles.uploadBtnLight, { borderColor: "#FF0000" }]}
          onPress={handleCreatePostPress}
          accessibilityLabel="Post Photo"
        >
          <Ionicons name="add" size={24} color="#FF0000" />
        </Pressable>
      ) : (
        <Pressable
          style={[styles.uploadButton, isDark ? styles.uploadBtnDark : styles.uploadBtnLight]}
          onPress={handleShareLocation}
          accessibilityLabel="Share Location"
        >
          <Ionicons name="send-outline" size={20} color={isDark ? "#FFFFFF" : "#0a0a0a"} style={{ transform: [{ rotate: "-45deg" }] }} />
        </Pressable>
      )}



      <Modal visible={personOpen} transparent animationType="fade" onRequestClose={() => setPersonOpen(false)}>
        <Pressable style={styles.createOverlay} onPress={() => setPersonOpen(false)}>
          <Pressable style={[styles.dialogCard, isDark ? styles.sheetDark : styles.sheetLight]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                {selectedPerson?.imageUrl ? (
                  <ExpoImage source={{ uri: selectedPerson.imageUrl }} style={{ width: 36, height: 36, borderRadius: 18 }} contentFit="cover" />
                ) : (
                  <View style={[styles.userAvatar]}>
                    <Text style={{ color: "#FFF", fontWeight: "700" }}>{selectedPerson?.owner?.fname?.[0]?.toUpperCase() || "F"}</Text>
                  </View>
                )}
                <Text style={[styles.sheetTitle, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>
                  {selectedPerson?.owner?.fname} {selectedPerson?.owner?.lname || ""}
                </Text>
              </View>
              <Pressable style={styles.headerIcon} onPress={() => setPersonOpen(false)}>
                <Ionicons name="close" size={20} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
              </Pressable>
            </View>
            <View style={{ paddingHorizontal: 20, paddingBottom: 20, gap: 12 }}>
              {selectedPerson?.locationName ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="location-outline" size={16} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
                  <Text style={{ color: isDark ? "#FFFFFF" : "#0a0a0a" }}>
                    {(() => {
                      const locationName = selectedPerson.locationName;
                      if (!locationName) return "";

                      // Split by comma and get the last two parts (state, country)
                      const parts = locationName.split(',').map((part: string) => part.trim());

                      if (parts.length >= 2) {
                        // Get the last two parts and remove any numbers (zip codes)
                        let state = parts[parts.length - 2].replace(/\d+/g, '').trim();
                        const country = parts[parts.length - 1].replace(/\d+/g, '').trim();

                        // If state is empty after removing numbers, try the part before it
                        if (!state && parts.length >= 3) {
                          state = parts[parts.length - 3].replace(/\d+/g, '').trim();
                        }

                        return state && country ? `${state}, ${country}` : locationName;
                      }

                      // If less than 2 parts, return as is (but remove numbers)
                      return locationName.replace(/\d+/g, '').trim();
                    })()}
                  </Text>
                </View>
              ) : null}

              {/* Debug info - Remove this after testing */}
              {!isCurrentUser && (
                <View style={{
                  padding: 8,
                  backgroundColor: isDark ? "#1a1a1a" : "#f0f0f0",
                  borderRadius: 8,
                  marginVertical: 4
                }}>
                  <Text style={{
                    fontSize: 10,
                    color: isDark ? "#CCCCCC" : "#666666",
                    fontFamily: 'monospace'
                  }}>
                    Debug: ID={selectedPersonId}, Loading={profileLoading ? 'true' : 'false'},
                    HasData={!!profileDetails ? 'true' : 'false'},
                    Error={profileError ? 'true' : 'false'}
                  </Text>
                  {profileDetails && (
                    <Text style={{
                      fontSize: 10,
                      color: isDark ? "#CCCCCC" : "#666666",
                      fontFamily: 'monospace'
                    }}>
                      Data: F={profileDetails.friends}, Fo={profileDetails.followers}, Fg={profileDetails.following}
                    </Text>
                  )}
                </View>
              )}

              {/* Profile Stats - Only show for friends, not current user */}
              {!isCurrentUser && profileDetails && (
                <View style={{
                  flexDirection: "row",
                  justifyContent: "space-around",
                  paddingVertical: 12,
                  backgroundColor: isDark ? "#2a2a2a" : "#f8f9fa",
                  borderRadius: 12,
                  marginVertical: 8
                }}>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{
                      fontSize: 18,
                      fontWeight: "700",
                      color: isDark ? "#FFFFFF" : "#0a0a0a"
                    }}>
                      {profileDetails.friends !== undefined ? profileDetails.friends : '0'}
                    </Text>
                    <Text style={{
                      fontSize: 12,
                      color: isDark ? "#CCCCCC" : "#666666",
                      marginTop: 2
                    }}>
                      Friends
                    </Text>
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{
                      fontSize: 18,
                      fontWeight: "700",
                      color: isDark ? "#FFFFFF" : "#0a0a0a"
                    }}>
                      {profileDetails.followers !== undefined ? profileDetails.followers : '0'}
                    </Text>
                    <Text style={{
                      fontSize: 12,
                      color: isDark ? "#CCCCCC" : "#666666",
                      marginTop: 2
                    }}>
                      Followers
                    </Text>
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{
                      fontSize: 18,
                      fontWeight: "700",
                      color: isDark ? "#FFFFFF" : "#0a0a0a"
                    }}>
                      {profileDetails.following !== undefined ? profileDetails.following : '0'}
                    </Text>
                    <Text style={{
                      fontSize: 12,
                      color: isDark ? "#CCCCCC" : "#666666",
                      marginTop: 2
                    }}>
                      Following
                    </Text>
                  </View>
                </View>
              )}

              {/* Error state for profile stats */}
              {!isCurrentUser && profileError && (
                <View style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  paddingVertical: 12,
                  backgroundColor: isDark ? "#2a2a2a" : "#f8f9fa",
                  borderRadius: 12,
                  marginVertical: 8
                }}>
                  <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
                  <Text style={{
                    marginLeft: 8,
                    color: "#EF4444",
                    fontSize: 14
                  }}>
                    Failed to load profile
                  </Text>
                </View>
              )}

              {/* Loading state for profile stats */}
              {!isCurrentUser && profileLoading && (
                <View style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  paddingVertical: 12,
                  backgroundColor: isDark ? "#2a2a2a" : "#f8f9fa",
                  borderRadius: 12,
                  marginVertical: 8
                }}>
                  <ActivityIndicator size="small" color={isDark ? "#FFFFFF" : "#0a0a0a"} />
                  <Text style={{
                    marginLeft: 8,
                    color: isDark ? "#CCCCCC" : "#666666",
                    fontSize: 14
                  }}>
                    Loading profile...
                  </Text>
                </View>
              )}

              {selectedPerson?.caption || selectedPerson?.activity ? (
                <View style={[styles.chip, isDark ? { borderColor: "#333" } : { borderColor: "#e0e0e0" }]}>
                  <Text style={[styles.chipText, { color: isDark ? "#FFF" : "#000" }]}>{selectedPerson?.caption || selectedPerson?.activity}</Text>
                </View>
              ) : null}
              {selectedPerson?.lastActiveAt ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="time-outline" size={16} color={isDark ? "#9AA0A6" : "#666"} />
                  <Text style={{ color: isDark ? "#9AA0A6" : "#666" }}>
                    Active {moment(selectedPerson.lastActiveAt).fromNow()}
                  </Text>
                </View>
              ) : null}
              <Text style={[styles.inputLabel, { color: isDark ? "#FFFFFF" : "#0a0a0a", paddingHorizontal: 0 }]}>Last shared photo:</Text>
              {selectedPerson?.owner?.bgUrl ? (
                <ExpoImage
                  source={{ uri: selectedPerson.owner.bgUrl }}
                  style={{ width: "92%", height: 160, borderRadius: 16, alignSelf: "center" }}
                  contentFit="cover"
                />
              ) : null}
            </View>
            <View style={styles.dialogActions}>
              {isCurrentUser ? (
                <View style={{ flex: 1, flexDirection: 'column' }}>
                  <Pressable
                    style={[
                      styles.actionBtnPrimary,
                      isDark ? { backgroundColor: "#0a0a0a", borderColor: "#333" } : { backgroundColor: "#0a0a0a", borderColor: "#0a0a0a" },
                      { width: '100%', flex: 0 }
                    ]}
                    onPress={handleViewLocationViewers}
                    disabled={loadingViewers}
                  >
                    {loadingViewers ? (
                      <>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                        <Text style={[styles.actionTextPrimary, { marginLeft: 8 }]}>Loading...</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name={showViewersList ? "eye-off-outline" : "eye-outline"} size={16} color="#FFFFFF" />
                        <Text style={[styles.actionTextPrimary, { marginLeft: 8 }]}>
                          {showViewersList ? "Hide who can see your location" : "View who can see your location"}
                        </Text>
                      </>
                    )}
                  </Pressable>

                  {showViewersList && (
                    <View style={{ marginTop: 12, maxHeight: 200, width: '100%' }}>
                      <ScrollView nestedScrollEnabled={true} style={{ width: '100%' }}>
                        {locationViewers.length === 0 ? (
                          <View key="empty-viewers" style={{ padding: 10, alignItems: 'center' }}>
                            <Text style={{ color: isDark ? "#9AA0A6" : "#666", fontSize: 14 }}>
                              No one can see your location right now
                            </Text>
                          </View>
                        ) : (
                          locationViewers.map((viewer, index) => (
                            <View
                              key={`${viewer.id || 'viewer'}-${index}`}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 8,
                                borderBottomWidth: 1,
                                borderBottomColor: isDark ? '#333' : '#eee'
                              }}
                            >
                              <ExpoImage
                                source={viewer.avatar ? { uri: viewer.avatar } : require("@/assets/images/peop.png")}
                                style={{ width: 32, height: 32, borderRadius: 16, marginRight: 10 }}
                                contentFit="cover"
                              />
                              <View>
                                <Text style={{
                                  color: isDark ? "#FFFFFF" : "#0a0a0a",
                                  fontWeight: '600',
                                  fontSize: 14
                                }}>
                                  {viewer.name}
                                </Text>
                                {viewer.username && (
                                  <Text style={{
                                    color: isDark ? "#9AA0A6" : "#666",
                                    fontSize: 12
                                  }}>
                                    @{viewer.username}
                                  </Text>
                                )}
                              </View>
                            </View>
                          ))
                        )}
                      </ScrollView>
                    </View>
                  )}
                </View>
              ) : (
                <>
                  <Pressable style={[styles.actionBtnPrimary, isDark ? { backgroundColor: "#0a0a0a", borderColor: "#333" } : { backgroundColor: "#0a0a0a", borderColor: "#0a0a0a" }]} onPress={handleLoadMessages} disabled={loadingMessage}>
                    {loadingMessage ? (
                      <>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                        <Text style={[styles.actionTextPrimary, { marginLeft: 8 }]}>Message...</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="chatbubble-outline" size={16} color="#FFFFFF" />
                        <Text style={[styles.actionTextPrimary, { marginLeft: 8 }]}>Message</Text>
                      </>
                    )}
                  </Pressable>
                  <Pressable
                    style={[
                      styles.actionBtnSecondary,
                      isDark ? { borderColor: "#333" } : { borderColor: "#e0e0e0" }
                    ]}
                    onPress={() => {
                      console.log("🔘 Navigate button pressed");
                      handleNavigate();
                    }}
                    disabled={loadingNavigate || loadingMessage || modalTransitioning}
                  >
                    {loadingNavigate || modalTransitioning ? (
                      <>
                        <ActivityIndicator size="small" color={isDark ? "#FFFFFF" : "#0a0a0a"} />
                        <Text style={[styles.actionTextSecondary, { marginLeft: 8 }, isDark ? { color: "#FFFFFF" } : { color: "#0a0a0a" }]}>
                          {modalTransitioning ? "Opening..." : "Navigate..."}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="paper-plane-outline" size={16} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
                        <Text style={[styles.actionTextSecondary, { marginLeft: 8 }, isDark ? { color: "#FFFFFF" } : { color: "#0a0a0a" }]}>Navigate</Text>
                      </>
                    )}
                  </Pressable>
                </>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Map Confirmation Modal */}
      <Modal visible={showMapConfirmModal} transparent animationType="fade" onRequestClose={() => setShowMapConfirmModal(false)}>
        <Pressable style={styles.confirmOverlay} onPress={() => setShowMapConfirmModal(false)}>
          <Pressable style={[styles.dialogCard, isDark ? styles.sheetDark : styles.sheetLight, { width: '85%', maxWidth: 320 }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.dialogHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={[styles.iconContainer, { backgroundColor: isDark ? "#333" : "#F3F4F6" }]}>
                  <Ionicons name="map-outline" size={20} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
                </View>
                <View>
                  <Text style={[styles.dialogTitle, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>
                    View in Map
                  </Text>
                  <Text style={[styles.dialogSubtitle, { color: isDark ? "#CCCCCC" : "#666666" }]}>
                    Navigate to location
                  </Text>
                </View>
              </View>
              <Pressable style={styles.headerIcon} onPress={() => setShowMapConfirmModal(false)}>
                <Ionicons name="close" size={20} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
              </Pressable>
            </View>

            <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
              <Text style={[styles.confirmText, { color: isDark ? "#FFFFFF" : "#0a0a0a", textAlign: 'center', marginBottom: 20 }]}>
                Do you want to view {selectedPerson?.owner?.fname || 'this person'}'s location on the map?
              </Text>

              <View style={styles.dialogActions}>
                <Pressable
                  style={[styles.actionBtnSecondary, isDark ? { borderColor: "#333" } : { borderColor: "#e0e0e0" }]}
                  onPress={() => {
                    console.log("🔘 Cancel button pressed");
                    setShowMapConfirmModal(false);
                  }}
                >
                  <Text style={[styles.actionTextSecondary, isDark ? { color: "#FFFFFF" } : { color: "#0a0a0a" }]}>
                    Cancel
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.actionBtnPrimary, { backgroundColor: "#3b82f6", borderColor: "#3b82f6" }]}
                  onPress={() => {
                    console.log("🔘 Yes, View in Map button pressed");
                    handleViewInMap();
                  }}
                  disabled={loadingNavigate}
                >
                  {loadingNavigate ? (
                    <>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={[styles.actionTextPrimary, { marginLeft: 8 }]}>Loading...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="map" size={16} color="#FFFFFF" />
                      <Text style={[styles.actionTextPrimary, { marginLeft: 8 }]}>Yes</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <AuthModal visible={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadButton: {
    position: "absolute",
    bottom: 48,
    right: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  shareFab: {
    backgroundColor: "#fbfbfbff",
    right: 90,
  },
  uploadBtnDark: { backgroundColor: "#0a0a0a", borderWidth: 1, borderColor: "#333333" },
  uploadBtnLight: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E0E0E0" },
  viewTogglePill: {
    flexDirection: "row",
    gap: 6,
    borderRadius: 24,
    padding: 6,
    borderWidth: 1,
  },
  pillDark: { backgroundColor: "#0f1115", borderColor: "#2a2e37" },
  pillLight: { backgroundColor: "#F2F4F8", borderColor: "#E0E0E0" },
  pillSeg: {
    width: 44,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  pillSegActiveDark: {
    backgroundColor: "#3b82f6",
    shadowColor: "#3b82f6",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4
  },
  pillSegActiveLight: {
    backgroundColor: "#3b82f6",
    shadowColor: "#3b82f6",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3
  },
  locationIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginLeft: 8,
  },
  locationIndicatorDark: {
    backgroundColor: "rgba(255, 165, 0, 0.1)",
    borderColor: "rgba(255, 165, 0, 0.3)",
  },
  locationIndicatorLight: {
    backgroundColor: "rgba(255, 140, 0, 0.1)",
    borderColor: "rgba(255, 140, 0, 0.3)",
  },
  locationIndicatorText: {
    fontSize: 10,
    fontWeight: "600",
  },
  createOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    zIndex: 1000, // Higher z-index to ensure it appears above other modals
  },
  createSheet: {
    width: "100%",
    maxWidth: 520,
    height: "85%",
    borderRadius: 14,
    overflow: "hidden",
  },
  sheetDark: { backgroundColor: "#0f1115", borderWidth: 1, borderColor: "#2a2e37" },
  sheetLight: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E0E0E0" },
  sheetHeader: {
    height: 56,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#2a2e37",
  },
  sheetTitle: { fontSize: 18, fontWeight: "700" },
  sectionHeaderRow: { paddingHorizontal: 14, paddingTop: 14 },
  sectionTitle: { fontSize: 14, fontWeight: "700" },
  sectionSub: { paddingHorizontal: 14, paddingTop: 8, fontSize: 12 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  gridItem: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#2a2e37",
  },
  gridItemActive: { borderColor: "#FFFFFF", shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  gridImage: { width: "100%", height: "100%" },
  galleryTile: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#141922",
  },
  galleryText: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },
  galleryScroll: { height: 220 },
  helperText: { fontSize: 12, paddingHorizontal: 14 },
  selectedGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 14, paddingTop: 10 },
  orderBadge: { position: "absolute", left: 8, bottom: 8, backgroundColor: "#0a0a0a", width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  orderText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  sectionSubRow: { paddingHorizontal: 14, paddingTop: 8, flexDirection: "row", justifyContent: "space-between" },
  inputLabel: { fontSize: 13, fontWeight: "700", paddingHorizontal: 14, paddingTop: 14 },
  inputWrapper: {
    marginTop: 8,
    marginHorizontal: 14,
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
  },
  inputDark: { backgroundColor: "#0a0a0a", borderColor: "#2a2e37" },
  inputLight: { backgroundColor: "#FFFFFF", borderColor: "#E0E0E0" },
  textInput: { flex: 1, fontSize: 13 },
  inputHint: { fontSize: 12, paddingHorizontal: 14, paddingTop: 6 },
  textAreaWrapper: {
    marginTop: 8,
    marginHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    height: 120,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  textArea: { flex: 1, fontSize: 13 },
  sheetFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: "#2a2e37",
  },
  cancelBtn: {
    height: 40,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2a2e37",
  },
  cancelText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  postBtn: {
    height: 40,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3b82f6",
    flexDirection: "row",
  },
  postDisabled: { backgroundColor: "#5a667a" },
  postText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  markerContainer: {
    width: 96,
    height: 96,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "visible",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  markerContainerNew: {
    borderWidth: 2,
    borderColor: "#FF0000",
  },
  markerDark: { borderColor: "#333333", backgroundColor: "#1A1A1A" },
  markerLight: { borderColor: "#E0E0E0", backgroundColor: "#FFFFFF" },
  markerImage: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
  countBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    zIndex: 2,
  },
  countText: { fontSize: 12, fontWeight: "700" },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    alignSelf: "center",
    marginTop: 4,
  },
  pointerDark: { borderTopColor: "#1A1A1A" },
  pointerLight: { borderTopColor: "#FFFFFF" },
  locBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#22C55E",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    zIndex: 2,
  },
  topBar: {
    position: "absolute",
    top: 20,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftButtons: { flexDirection: "row", gap: 10 },
  squareBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  squareDark: { backgroundColor: "#0a0a0a", borderColor: "#333333" },
  squareLight: { backgroundColor: "#FFFFFF", borderColor: "#E0E0E0" },
  myPostsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  myPostsDark: { backgroundColor: "#0a0a0a", borderColor: "#333333" },
  myPostsLight: { backgroundColor: "#FFFFFF", borderColor: "#E0E0E0" },
  myPostsText: { fontSize: 12, fontWeight: "700" },
  previewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  previewContent: {
    width: "100%",
    height: "100%",
    borderRadius: 0,
    overflow: "hidden",
  },
  previewImage: { width: "100%", height: "100%" },
  closeBtn: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  shareSheet: {
    width: "100%",
    height: "90%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  sheetSub: {
    fontSize: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  photoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  privacyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  recentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recentsTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
  },
  miniGalleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chatInputBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chatInputDark: { backgroundColor: "#0f1115", borderColor: "#2a2e37" },
  chatInputLight: { backgroundColor: "#FFFFFF", borderColor: "#E0E0E0" },
  chatInput: { flex: 1, fontSize: 13 },
  chatSendBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chatSendDark: { backgroundColor: "#0a0a0a", borderColor: "#333" },
  chatSendLight: { backgroundColor: "#FFFFFF", borderColor: "#E0E0E0" },
  dialogCard: {
    width: "99%",
    maxWidth: 990,
    borderRadius: 20,
    overflow: "hidden",
  },
  dialogActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: "#2a2e37",
  },
  actionBtnPrimary: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  actionBtnSecondary: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    backgroundColor: "transparent",
  },
  actionTextPrimary: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  actionTextSecondary: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  dialogHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmText: {
    fontSize: 16,
    lineHeight: 22,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },
  dialogSubtitle: {
    fontSize: 14,
  },
  miniGalleryItem: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  selectedPhotoContainer: {
    width: '100%',
    aspectRatio: 1.5,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  selectedPhoto: {
    width: '100%',
    height: '100%',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 0, 0, 0.6)',
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoOverlayText: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  dropdownList: {
    position: 'absolute',
    top: 74,
    left: 0,
    right: 0,
    borderRadius: 10,
    borderWidth: 1,
    zIndex: 1000,
    overflow: 'hidden',
    marginTop: 4,
    marginHorizontal: 0,
  },
  dropdownDark: {
    backgroundColor: '#0a0a0a',
    borderColor: '#2a2e37',
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  dropdownLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E0E0',
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownItemDark: {
    borderBottomColor: '#2a2e37',
  },
  dropdownItemLight: {
    borderBottomColor: '#f0f0f0',
  },
  inputContainer: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
  },
  zoomControls: {
    position: "absolute",
    left: 16,
    flexDirection: "column",
    gap: 8,
  },
  zoomButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  zoomButtonDark: {
    backgroundColor: "#0a0a0a",
    borderColor: "#333333"
  },
  zoomButtonLight: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E0E0E0"
  },
  handAnimationContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    alignItems: "center",
  },
  handAnimationCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    maxWidth: 300,
  },
  handAnimationDark: {
    backgroundColor: "#0a0a0a",
    borderColor: "#333333",
  },
  handAnimationLight: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E0E0E0",
  },
  handAnimationContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  handEmoji: {
    fontSize: 24,
  },
  handAnimationText: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
    textAlign: "left",
  },
  handAnimationClose: {
    padding: 4,
    marginLeft: 8,
  },
  // Current Location Button Styles
  currentLocationBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
    marginHorizontal: 14,
  },
  currentLocationBtnDark: {
    backgroundColor: "transparent",
    borderColor: "#333333",
  },
  currentLocationBtnLight: {
    backgroundColor: "transparent",
    borderColor: "#E0E0E0",
  },
  currentLocationBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  uploadStatusPill: {
    position: "absolute",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    zIndex: 10,
  },
  uploadStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
