import { api } from "@/api/client";
import { UrlConstants } from "@/constants/apiUrls";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuthStore } from "@/state/authStore";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image as ExpoImage } from "expo-image";
import * as Location from "expo-location";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import moment from "moment";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import uuid from "react-native-uuid";
import io from "socket.io-client";
import { toast } from "sonner-native";

// Conditional Mapbox GL imports for Android only
let MapboxGL: any = null;
let useMapboxGL = false;

if (Platform.OS === 'android') {
  try {
    console.log('🔄 Attempting to load Mapbox GL for Android...');
    const MapboxGLModule = require('@react-native-mapbox-gl/maps');
    console.log('🔍 Raw MapboxGL module:', MapboxGLModule);
    console.log('🔍 MapboxGL keys:', Object.keys(MapboxGLModule));
    
    // Try different possible structures
    if (MapboxGLModule.default) {
      MapboxGL = MapboxGLModule.default;
      console.log('🔍 Using default export, keys:', Object.keys(MapboxGL));
    } else {
      MapboxGL = MapboxGLModule;
      console.log('🔍 Using direct export, keys:', Object.keys(MapboxGL));
    }
    
    // Initialize Mapbox GL for Android
    const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
    console.log('🔍 Token available:', !!token);
    
    if (token) {
      if (MapboxGL.setAccessToken) {
        MapboxGL.setAccessToken(token);
        useMapboxGL = true;
        console.log('✅ Mapbox GL initialized for Android with token:', token.substring(0, 20) + '...');
      } else {
        console.error('❌ setAccessToken method not found');
        console.log('Available methods:', Object.keys(MapboxGL));
      }
    } else {
      console.error('❌ Mapbox token not found in environment variables');
    }
  } catch (error) {
    console.error('❌ Failed to load Mapbox GL module:', error);
    console.log('📱 Falling back to Google Maps for Android');
    useMapboxGL = false;
  }
} else {
  console.log('🍎 iOS detected - using Apple Maps (Mapbox disabled)');
}

export default function TarpsScreen() {
  const { isDark } = useTheme();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const nav = useRouter();
  // Correct type for Map region
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean>(false);

  const [markers, setMarkers] = useState<
    { id: number; image: string; latitude: number; longitude: number; userId?: string; createdAt?: number }[]
  >([]);
  const [showMine, setShowMine] = useState(false);


  const [myTarpsModalVisible, setMyTarpsModalVisible] = useState(false);
  const [recents, setRecents] = useState<MediaLibrary.Asset[]>([]);
  
  // Map and Posts State
  const [viewMode, setViewMode] = useState<"people" | "posts">("posts");
  const [mapRegion, setMapRegion] = useState(location);
  const [serverPosts, setServerPosts] = useState<{ id: string; image: string | null; latitude: number; longitude: number; count?: number; items?: any[] }[]>([]);
  const [newPostIds, setNewPostIds] = useState<Set<string>>(new Set());
  const [knownPosts, setKnownPosts] = useState<Map<string, { lat: number; lng: number; timestamp: number }>>(new Map());
  const [previewedPosts, setPreviewedPosts] = useState<Set<string>>(new Set());
  const [showHandAnimation, setShowHandAnimation] = useState(true);
  const [handAnimationVisible, setHandAnimationVisible] = useState(true);
  const [serverPeople, setServerPeople] = useState<
    { id: string; latitude: number; longitude: number; imageUrl?: string; owner?: { id: string; fname: string; lname?: string; bgUrl?: string } }[]
  >([]);
  const mapRef = useRef<MapView | null>(null);
  const [mapboxCamera, setMapboxCamera] = useState({
    centerCoordinate: [0, 0] as [number, number],
    zoomLevel: 1,
    animationDuration: 0,
  });

  // Update Mapbox GL camera when location changes
  useEffect(() => {
    if (Platform.OS === 'android' && location && useMapboxGL) {
      setMapboxCamera({
        centerCoordinate: [location.longitude, location.latitude],
        zoomLevel: 1,
        animationDuration: 1000,
      });
    }
  }, [location, useMapboxGL]);
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null);
  const [personOpen, setPersonOpen] = useState(false);
  const [currentZoomLevel, setCurrentZoomLevel] = useState(0); // Track zoom level for intelligent zooming
  const [zoomHistory, setZoomHistory] = useState<Array<{
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
    zoomLevel?: number; // For Mapbox
  }>>([]);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [loadingNavigate, setLoadingNavigate] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [groupDetails, setGroupDetails] = useState<any | null>(null);
  const [groupMessages, setGroupMessages] = useState<any[]>([]);
  const [chatText, setChatText] = useState("");
  const chatScrollRef = useRef<FlatList | null>(null);
  const socketRef = useRef<any | null>(null);
  const lastPostRequestId = useRef(0);
  const lastPeopleRequestId = useRef(0);

  // Profile modal state - REMOVED (now using full screen)


  const durationOptions = ["1 hour", "2 hours", "5 hours", "1 day"];

  const suggestions = [
    "studying", "eating lunch", "working out", "hanging out", 
    "in class", "at meeting", "chilling", "grabbing coffee", 
    "at event", "playing sports"
  ];

  // Function to open profile screen
  const openProfileScreen = () => {
    nav.push('/my-tarps');
  };

  const handleShareLocation = () => {
    nav.push('/share-location');
  };

  // Function to load known posts from storage
  const loadKnownPosts = async () => {
    try {
      const knownPostsData = await AsyncStorage.getItem('knownPosts');
      console.log("Loading known posts from storage:", knownPostsData);
      if (knownPostsData) {
        const parsedData = JSON.parse(knownPostsData);
        console.log("Parsed known posts:", parsedData);
        // Convert array back to Map with proper typing
        const postsMap = new Map<string, { lat: number; lng: number; timestamp: number }>(parsedData);
        setKnownPosts(postsMap);
      } else {
        console.log("No known posts found in storage");
        setKnownPosts(new Map());
      }
    } catch (error) {
      console.error('Error loading known posts:', error);
      setKnownPosts(new Map());
    }
  };

  // Function to load previewed posts from storage
  const loadPreviewedPosts = async () => {
    try {
      const previewedPostsData = await AsyncStorage.getItem('previewedPosts');
      console.log("Loading previewed posts from storage:", previewedPostsData);
      if (previewedPostsData) {
        const parsedData = JSON.parse(previewedPostsData);
        console.log("Parsed previewed posts:", parsedData);
        setPreviewedPosts(new Set(parsedData));
      } else {
        console.log("No previewed posts found in storage");
        setPreviewedPosts(new Set());
      }
    } catch (error) {
      console.error('Error loading previewed posts:', error);
      setPreviewedPosts(new Set());
    }
  };

  // Function to save known posts to storage
  const saveKnownPosts = async (postsMap: Map<string, { lat: number; lng: number; timestamp: number }>) => {
    try {
      // Convert Map to array for JSON storage
      const postsArray = Array.from(postsMap.entries());
      await AsyncStorage.setItem('knownPosts', JSON.stringify(postsArray));
      console.log("Saved known posts to storage:", postsArray.length, "posts");
    } catch (error) {
      console.error('Error saving known posts:', error);
    }
  };

  // Function to save previewed posts to storage
  const savePreviewedPosts = async (postsSet: Set<string>) => {
    try {
      const postsArray = Array.from(postsSet);
      await AsyncStorage.setItem('previewedPosts', JSON.stringify(postsArray));
      console.log("Saved previewed posts to storage:", postsArray.length, "posts");
    } catch (error) {
      console.error('Error saving previewed posts:', error);
    }
  };

  // Function to mark a post as viewed (when actually previewed)
  const markPostAsViewed = (postId: string) => {
    setNewPostIds(prev => {
      const updated = new Set(prev);
      updated.delete(postId);
      return updated;
    });
    
    setPreviewedPosts(prev => {
      const updated = new Set(prev);
      updated.add(postId);
      savePreviewedPosts(updated);
      return updated;
    });
    
    console.log("Post marked as previewed:", postId);
  };

  // Function to mark multiple posts as viewed (for clusters)
  const markPostsAsViewed = (postIds: string[]) => {
    setNewPostIds(prev => {
      const updated = new Set(prev);
      postIds.forEach(id => updated.delete(id));
      return updated;
    });
    
    setPreviewedPosts(prev => {
      const updated = new Set(prev);
      postIds.forEach(id => updated.add(id));
      savePreviewedPosts(updated);
      return updated;
    });
    
    console.log("Posts marked as previewed:", postIds);
  };

  // Load both known and previewed posts on mount
  useEffect(() => {
    loadKnownPosts();
    loadPreviewedPosts();
  }, []);

  // Expose global function for post screen communication
  useEffect(() => {
    (global as any).markPostsAsViewed = markPostsAsViewed;
    return () => {
      delete (global as any).markPostsAsViewed;
    };
  }, []);

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
    if (viewMode !== "posts") return;
    
    const hideTimer = setTimeout(() => {
      setShowHandAnimation(false);
    }, 10000); // Hide after 10 seconds
    
    return () => {
      clearTimeout(hideTimer);
    };
  }, [viewMode]);

  // Show hand animation when switching to posts view
  useEffect(() => {
    if (viewMode === "posts") {
      setShowHandAnimation(true);
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
          } catch {}
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

  const handleNavigate = async () => {
    if (!selectedPerson?.id || !location) return;
    if (!user) {
      toast.error("Please sign in to load navigation");
      return;
    }
    
    if (!hasLocationPermission) {
      toast.error("Location permission required for navigation");
      return;
    }
    
    try {
      setLoadingNavigate(true);
      const res = await api.get(
        UrlConstants.tarpNavigateToUser({
          locationID: String(selectedPerson.id),
          startingLat: Number(location.latitude),
          startingLng: Number(location.longitude),
          startingLocation: hasLocationPermission ? "Current Location" : "Default Location",
        })
      );
      console.log("PeopleNavigate:response", { status: res?.status });
      toast.success("Loaded navigation steps");
    } catch (e: any) {
      console.log("PeopleNavigate:error", { status: e?.response?.status, data: e?.response?.data, message: e?.message });
      toast.error("Failed to load navigation");
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

  useEffect(() => {
    if (!location) return;
    
    // Load data for the current view mode
    if (viewMode === "people") {
      loadPeopleInView(location);
    } else if (viewMode === "posts") {
      loadPostsInView(location);
    }
  }, [location, viewMode]);

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

  // Intelligent zoom in - zoom to areas with posts/people
  const handleZoomIn = () => {
    const currentItems = viewMode === "posts" ? serverPosts : serverPeople;
    const flatItems = viewMode === "posts" 
      ? serverPosts.flatMap(p => p.items || [p])
      : serverPeople;
    
    if (flatItems.length === 0) {
      toast.error(`No ${viewMode} found to zoom to`);
      return;
    }

    if (Platform.OS === 'android' && useMapboxGL) {
      // Mapbox GL zoom in logic using state
      const bounds = calculateOptimalBounds(flatItems);
      if (!bounds) return;

      const centerLat = bounds.latitude;
      const centerLng = bounds.longitude;
      
      // Progressive zoom levels for Mapbox GL
      const zoomLevels = [2, 5, 8, 11, 14, 16, 18];
      
      if (currentZoomLevel >= zoomLevels.length - 1) {
        toast.error("Already at maximum zoom level");
        return;
      }
      
      // Record current state before zooming in
      setZoomHistory(prev => [...prev, {
        latitude: mapboxCamera.centerCoordinate[1],
        longitude: mapboxCamera.centerCoordinate[0],
        latitudeDelta: 0, // Not used for Mapbox
        longitudeDelta: 0, // Not used for Mapbox
        zoomLevel: zoomLevels[currentZoomLevel]
      }]);
      
      const targetZoom = zoomLevels[currentZoomLevel + 1];
      
      setMapboxCamera({
        centerCoordinate: [centerLng, centerLat],
        zoomLevel: targetZoom,
        animationDuration: 800,
      });
      
      setCurrentZoomLevel(prev => prev + 1);
    } else if (mapRef.current) {
      // Apple Maps zoom in logic - record current state before zooming
      const bounds = calculateOptimalBounds(flatItems);
      if (!bounds) return;

      // Record current map state before zooming in
      const currentRegion = mapRegion || location;
      if (currentRegion) {
        setZoomHistory(prev => [...prev, {
          latitude: currentRegion.latitude,
          longitude: currentRegion.longitude,
          latitudeDelta: currentRegion.latitudeDelta,
          longitudeDelta: currentRegion.longitudeDelta
        }]);
      }

      let targetDelta;
      
      if (currentZoomLevel === 0) {
        // From world view, zoom to show all posts/people
        targetDelta = Math.max(bounds.latitudeDelta, bounds.longitudeDelta);
        setCurrentZoomLevel(1);
      } else if (currentZoomLevel === 1) {
        // Second level - tighter view of posts/people
        targetDelta = Math.max(bounds.latitudeDelta * 0.8, 0.1);
        setCurrentZoomLevel(2);
      } else {
        // Progressive zoom in - each step halves the view
        const currentDelta = bounds.latitudeDelta * Math.pow(0.5, currentZoomLevel - 2);
        targetDelta = Math.max(currentDelta * 0.5, 0.01);
        setCurrentZoomLevel(prev => prev + 1);
      }
      
      const newRegion = {
        ...bounds,
        latitudeDelta: targetDelta,
        longitudeDelta: targetDelta,
      };
      
      mapRef.current.animateToRegion(newRegion, 800);
    }
  };

  // Intelligent zoom out - use recorded zoom history to go back exactly
  const handleZoomOut = () => {
    // Check if we have zoom history to go back to
    if (zoomHistory.length === 0) {
      toast.error("No zoom history to go back to");
      return;
    }

    // Get the last recorded state and remove it from history
    const previousState = zoomHistory[zoomHistory.length - 1];
    setZoomHistory(prev => prev.slice(0, -1));

    if (Platform.OS === 'android' && useMapboxGL) {
      // Mapbox GL zoom out using recorded history
      setMapboxCamera({
        centerCoordinate: [previousState.longitude, previousState.latitude],
        zoomLevel: previousState.zoomLevel || 1,
        animationDuration: 800,
      });
      
      // Update current zoom level based on history
      setCurrentZoomLevel(prev => Math.max(prev - 1, 0));
    } else if (mapRef.current) {
      // Apple Maps zoom out using recorded history
      const newRegion = {
        latitude: previousState.latitude,
        longitude: previousState.longitude,
        latitudeDelta: previousState.latitudeDelta,
        longitudeDelta: previousState.longitudeDelta,
      };
      
      mapRef.current.animateToRegion(newRegion, 800);
      setMapRegion(newRegion);
      
      // Update current zoom level
      setCurrentZoomLevel(prev => Math.max(prev - 1, 0));
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
          styleURL={MapboxGL.StyleURL?.Satellite || 'mapbox://styles/mapbox/satellite-v9'}
          onRegionDidChange={() => {
            // Handle region changes for Mapbox GL
          }}
        >
          <MapboxGL.Camera
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
                        
                        nav.push(`/post/${primaryItem.id || 'unknown'}?item=${encodeURIComponent(JSON.stringify(primaryItem))}&images=${encodeURIComponent(JSON.stringify(combinedSet))}&allItems=${encodeURIComponent(JSON.stringify(allItems))}&idx=0&serverPosts=${encodeURIComponent(JSON.stringify(serverPosts))}`);
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
                        zoomLevel: mapboxCamera.zoomLevel
                      }]);
                      
                      const bounds = {
                        minLat: Math.min(...p.items.map((i: any) => Number(i.latitude ?? i.lat ?? p.latitude))),
                        maxLat: Math.max(...p.items.map((i: any) => Number(i.latitude ?? i.lat ?? p.latitude))),
                        minLng: Math.min(...p.items.map((i: any) => Number(i.longitude ?? i.lng ?? p.longitude))),
                        maxLng: Math.max(...p.items.map((i: any) => Number(i.longitude ?? i.lng ?? p.longitude))),
                      };
                      const centerLat = (bounds.minLat + bounds.maxLat) / 2;
                      const centerLng = (bounds.minLng + bounds.maxLng) / 2;
                      const latDelta = Math.max(0.01, Math.abs(bounds.maxLat - bounds.minLat) * 1.5);
                      
                      // Calculate zoom level from latitude delta and update camera state
                      const zoomLevel = Math.max(1, Math.min(18, Math.log2(360 / latDelta)));
                      
                      setMapboxCamera({
                        centerCoordinate: [centerLng, centerLat],
                        zoomLevel: zoomLevel,
                        animationDuration: 200,
                      });
                      
                      // Optimistically update markers for immediate separation
                      const expandedPosts = p.items.map((item: any) => ({
                        id: String(item.id ?? `${item.lat ?? item.latitude}-${item.lng ?? item.longitude}-${extractImageUrl(item)}`),
                        image: extractImageUrl(item),
                        latitude: Number(item.lat ?? item.latitude),
                        longitude: Number(item.lng ?? item.longitude),
                        count: 1,
                        isCluster: false,
                        items: [item],
                      })).filter((post: any) => !isNaN(post.latitude) && !isNaN(post.longitude) && !!post.image);
                      
                      setServerPosts(prev => {
                        const others = prev.filter(post => post.id !== p.id);
                        return [...others, ...expandedPosts];
                      });
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
                      nav.push(`/post/${item.id || 'unknown'}?item=${encodeURIComponent(JSON.stringify(item))}&images=${encodeURIComponent(JSON.stringify(set))}&idx=0&serverPosts=${encodeURIComponent(JSON.stringify(serverPosts))}`);
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
                    source={{ uri: p.image as string }} 
                    style={styles.markerImage} 
                    contentFit="cover" 
                    cachePolicy="none"
                    placeholder={require("@/assets/images/peop.png")}
                    placeholderContentFit="cover"
                    transition={200}
                  />
                  {!!p.count && p.count > 1 && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countText}>{p.count >= 1000 ? `${Math.floor(p.count/1000)}k` : `${p.count}`}</Text>
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
                  <ExpoImage 
                    source={{ uri: p.imageUrl }} 
                    style={styles.markerImage} 
                    contentFit="cover" 
                    cachePolicy="none"
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
                          
                          console.log("Combined set created:", { totalImages: allUrls.length, totalItems: allItems.length });
                          nav.push(`/post/${primaryItem.id || 'unknown'}?item=${encodeURIComponent(JSON.stringify(primaryItem))}&images=${encodeURIComponent(JSON.stringify(combinedSet))}&allItems=${encodeURIComponent(JSON.stringify(allItems))}&idx=0&serverPosts=${encodeURIComponent(JSON.stringify(serverPosts))}`);
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
                            longitudeDelta: currentRegion.longitudeDelta
                          }]);
                        }
                        
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
                        mapRef.current?.animateToRegion(region, 200);
                        
                        // Optimistically update markers for immediate separation
                        const expandedPosts = p.items.map((item: any) => ({
                          id: String(item.id ?? `${item.lat ?? item.latitude}-${item.lng ?? item.longitude}-${extractImageUrl(item)}`),
                          image: extractImageUrl(item),
                          latitude: Number(item.lat ?? item.latitude),
                          longitude: Number(item.lng ?? item.longitude),
                          count: 1,
                          isCluster: false,
                          items: [item],
                        })).filter((post: any) => !isNaN(post.latitude) && !isNaN(post.longitude) && !!post.image);
                        
                        setServerPosts(prev => {
                          const others = prev.filter(post => post.id !== p.id);
                          return [...others, ...expandedPosts];
                        });
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
                        nav.push(`/post/${item.id || 'unknown'}?item=${encodeURIComponent(JSON.stringify(item))}&images=${encodeURIComponent(JSON.stringify(set))}&idx=0&serverPosts=${encodeURIComponent(JSON.stringify(serverPosts))}`);
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
                      source={{ uri: p.image as string }} 
                      style={styles.markerImage} 
                      contentFit="cover" 
                      cachePolicy="none"
                      placeholder={require("@/assets/images/peop.png")}
                      placeholderContentFit="cover"
                      transition={200}
                    />
                    {!!p.count && p.count > 1 && (
                      <View style={styles.countBadge}>
                        <Text style={styles.countText}>{p.count >= 1000 ? `${Math.floor(p.count/1000)}k` : `${p.count}`}</Text>
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
                        cachePolicy="none"
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
          onPress={handleZoomIn}
        >
          <Ionicons name="add" size={20} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
        </Pressable>
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
                opacity: handAnimationVisible ? 1 : 0.3,
                transform: [{ scale: handAnimationVisible ? 1 : 0.95 }]
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
              onPress={() => setShowHandAnimation(false)}
            >
              <Ionicons name="close" size={16} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
            </Pressable>
          </View>
        </View>
      )}

      <View style={[styles.topBar, { top: insets.top + 8 }]}>
        <View style={styles.leftButtons}>
          <View style={[styles.viewTogglePill, isDark ? styles.pillDark : styles.pillLight]}>
            <Pressable
              style={[styles.pillSeg, viewMode === "posts" ? (isDark ? styles.pillSegActiveDark : styles.pillSegActiveLight) : null]}
              onPress={() => {
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
            <View style={[styles.locationIndicator, isDark ? styles.locationIndicatorDark : styles.locationIndicatorLight]}>
              <Ionicons name="location-outline" size={14} color={isDark ? "#FFA500" : "#FF8C00"} />
              <Text style={[styles.locationIndicatorText, { color: isDark ? "#FFA500" : "#FF8C00" }]}>
                Default Location
              </Text>
            </View>
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
          style={[styles.uploadButton, isDark ? styles.uploadBtnDark : styles.uploadBtnLight]}
          onPress={() => nav.push('/create-post')}
          accessibilityLabel="Post Photo"
        >
          <Ionicons name="add" size={24} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
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
              <Pressable style={[styles.actionBtnSecondary, isDark ? { borderColor: "#333" } : { borderColor: "#e0e0e0" }]} onPress={handleNavigate} disabled={loadingNavigate}>
                {loadingNavigate ? (
                  <>
                    <ActivityIndicator size="small" color={isDark ? "#FFFFFF" : "#0a0a0a"} />
                    <Text style={[styles.actionTextSecondary, { marginLeft: 8 }, isDark ? { color: "#FFFFFF" } : { color: "#0a0a0a" }]}>Navigate...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="paper-plane-outline" size={16} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
                    <Text style={[styles.actionTextSecondary, { marginLeft: 8 }, isDark ? { color: "#FFFFFF" } : { color: "#0a0a0a" }]}>Navigate</Text>
                  </>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* My Tarps Modal - REMOVED (now using full screen) */}
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
    borderWidth: 4,
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
    bottom: -10,
    right: -10,
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
    bottom: -8,
    right: -8,
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
  actionTextSecondary: {color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
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
});
