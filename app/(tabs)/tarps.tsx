import { api } from "@/api/client";
import { UrlConstants } from "@/constants/apiUrls";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuthStore } from "@/state/authStore";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image as ExpoImage } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import * as MediaLibrary from "expo-media-library";
import { StatusBar } from "expo-status-bar";
import moment from "moment";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, InteractionManager, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import uuid from "react-native-uuid";
import io from "socket.io-client";
import { toast } from "sonner-native";

export default function TarpsScreen() {
  const { isDark } = useTheme();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  // Correct type for Map region
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null>(null);

  const [markers, setMarkers] = useState<
    { id: number; image: string; latitude: number; longitude: number; userId?: string; createdAt?: number }[]
  >([]);
  const [showMine, setShowMine] = useState(false);
  const [preview, setPreview] = useState<{ uri: string } | null>(null);
  const [postOpen, setPostOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [recents, setRecents] = useState<MediaLibrary.Asset[]>([]);
  const [placeName, setPlaceName] = useState("");
  const [caption, setCaption] = useState("");
  const [isUploadingPost, setIsUploadingPost] = useState(false);
  const [postLocSuggestions, setPostLocSuggestions] = useState<string[]>([]);
  const [showPostLocDropdown, setShowPostLocDropdown] = useState(false);
  const [loadingPostSuggest, setLoadingPostSuggest] = useState(false);

  const [shareModalVisible, setShareModalVisible] = useState(false);
  
  // Share Status State
  const [statusLocation, setStatusLocation] = useState("");
  const [statusActivity, setStatusActivity] = useState("");
  const [statusDuration, setStatusDuration] = useState("2 hours");
  const [withPhoto, setWithPhoto] = useState(false);
  const [shareSelectedPhoto, setShareSelectedPhoto] = useState<string | null>(null);
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [loadingLocSuggest, setLoadingLocSuggest] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [viewMode, setViewMode] = useState<"people" | "posts">("people");
  const [mapRegion, setMapRegion] = useState(location);
  const [serverPosts, setServerPosts] = useState<{ id: string; image: string | null; latitude: number; longitude: number; count?: number; items?: any[] }[]>([]);
  const [serverPeople, setServerPeople] = useState<
    { id: string; latitude: number; longitude: number; imageUrl?: string; owner?: { id: string; fname: string; lname?: string; bgUrl?: string } }[]
  >([]);
  const mapRef = useRef<MapView | null>(null);
  const [zoomedWorld, setZoomedWorld] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null);
  const [personOpen, setPersonOpen] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [loadingNavigate, setLoadingNavigate] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [groupDetails, setGroupDetails] = useState<any | null>(null);
  const [groupMessages, setGroupMessages] = useState<any[]>([]);
  const [chatText, setChatText] = useState("");
  const chatScrollRef = useRef<ScrollView | null>(null);
  const socketRef = useRef<any | null>(null);

  const durationOptions = ["1 hour", "2 hours", "5 hours", "1 day"];

  const suggestions = [
    "studying", "eating lunch", "working out", "hanging out", 
    "in class", "at meeting", "chilling", "grabbing coffee", 
    "at event", "playing sports"
  ];

  const handleShareStatus = async () => {
    if (isSharing) return;
    const address = statusLocation.trim();
    if (address.length === 0) {
      toast.error("Enter a location");
      return;
    }
    const form = new FormData();
    if (withPhoto && shareSelectedPhoto) {
      form.append("image", {
        uri: shareSelectedPhoto,
        name: "location.jpg",
        type: "image/jpeg",
      } as any);
    }
    if (statusActivity.trim().length > 0) {
      form.append("caption", statusActivity.trim());
    }
    form.append("address", address);
    setIsSharing(true);
    try {
      console.log("ShareLocation:start", {
        address,
        // durationHours,
        hasPhoto: !!shareSelectedPhoto,
        caption: statusActivity.trim(),
      });
      const res = await api.post(`${UrlConstants.baseUrl}/tarps/upload/location`, form);
      console.log("ShareLocation:success", {
        status: res.status,
        data: res.data,
      });
      toast.success("Location shared!");
      setShareModalVisible(false);
      setStatusLocation("");
      setStatusActivity("");
      setWithPhoto(false);
      setShareSelectedPhoto(null);
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      const message = err?.message;
      console.log("ShareLocation:error", { status, data, message });
      toast.error("Failed to share location");
    } finally {
      console.log("ShareLocation:done");
      setIsSharing(false);
    }
  };

  const handleShareLocation = () => {
    setShareModalVisible(true);
  };

  const [currentPostItem, setCurrentPostItem] = useState<any | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [isLiking, setIsLiking] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFriending, setIsFriending] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyingToID, setReplyingToID] = useState<string | null>(null);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [pendingCommentsImageID, setPendingCommentsImageID] = useState<string | null>(null);
  
  const [friendStatus, setFriendStatus] = useState<"not_friends" | "pending" | "friends">("not_friends");
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentImageIds, setCurrentImageIds] = useState<string[]>([]);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [following, setFollowing] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

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
  const extractUserId = (item: any): string | null => {
    const v =
      item?.userID ??
      item?.creator?.id ??
      item?.owner?.id ??
      item?.user?.id ??
      item?.createdBy?.id ??
      item?.author?.id;
    return v != null ? String(v) : null;
  };
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
      const fallbackId = extractImageId(item);
      if (cover) {
        urls.push(cover);
        ids.push(fallbackId);
      }
    }
    // Deduplicate by URL while preserving ID alignment
    const seen = new Set<string>();
    const finalUrls: string[] = [];
    const finalIds: (string | null)[] = [];
    urls.forEach((u, idx) => {
      if (!seen.has(u)) {
        seen.add(u);
        finalUrls.push(u);
        finalIds.push(ids[idx] ?? null);
      }
    });
    return { urls: finalUrls, ids: finalIds };
  };
  const getCurrentImageId = (): string | null => {
    const idx = currentImageIndex;
    const id = currentImageIds[idx];
    return id ?? (currentPostItem ? extractImageId(currentPostItem) : null);
  };
  const syncImageMeta = (idx: number) => {
    if (!currentPostItem) return;
    const imgMeta = Array.isArray(currentPostItem.images) ? currentPostItem.images[idx] : null;
    const likedVal =
      typeof imgMeta?.hasLiked === "boolean"
        ? imgMeta.hasLiked
        : extractLiked(currentPostItem);
    const likeCountVal =
      typeof imgMeta?.likes === "number"
        ? imgMeta.likes
        : extractLikeCount(currentPostItem);
    const commentCountVal =
      typeof imgMeta?.comments === "number"
        ? imgMeta.comments
        : Array.isArray(currentPostItem.comments)
        ? currentPostItem.comments.length
        : commentCount;
    setLiked(!!likedVal);
    setLikeCount(typeof likeCountVal === "number" ? likeCountVal : 0);
    setCommentCount(typeof commentCountVal === "number" ? commentCountVal : 0);
  };
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

  const openComments = () => {
    const imageID = getCurrentImageId();
    setPendingCommentsImageID(imageID ?? null);
    setPreview(null);
    InteractionManager.runAfterInteractions(() => {
      setCommentsOpen(true);
    });
  };

  const refreshComments = async () => {
    const imageID = pendingCommentsImageID ?? getCurrentImageId();
    if (!imageID) return;
    try {
      setIsLoadingComments(true);
      const res = await api.get(UrlConstants.tarpPostComments(imageID));
      const list = (res as any)?.data?.data ?? (res as any)?.data?.comments ?? (res as any)?.data;
      setComments(Array.isArray(list) ? list : []);
      setCommentCount(Array.isArray(list) ? list.length : 0);
    } catch (e: any) {
      toast.error("Failed to fetch comments");
    } finally {
      setIsLoadingComments(false);
    }
  };

  useEffect(() => {
    if (!commentsOpen || isLoadingComments) return;
    const imageID = pendingCommentsImageID;
    if (!imageID) return;
    let cancelled = false;
    const run = async () => {
      try {
        setIsLoadingComments(true);
        const res = await api.get(UrlConstants.tarpPostComments(imageID));
        if (cancelled) return;
        const list = (res as any)?.data?.data ?? (res as any)?.data?.comments ?? (res as any)?.data;
        setComments(Array.isArray(list) ? list : []);
        setCommentCount(Array.isArray(list) ? list.length : 0);
      } catch (e: any) {
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
  }, [commentsOpen, pendingCommentsImageID]);
  const sendComment = async () => {
    const imageID = getCurrentImageId();
    const msg = commentText.trim();
    console.log("Comments:send", { imageID, msgLength: msg.length, replyingToID });
    if (!imageID || msg.length === 0) return;
    try {
      const body = { message: msg, ...(replyingToID ? { replyingToID } : {}) };
      console.log("Comments:postRequest", { url: UrlConstants.tarpPostComments(imageID), body });
      const res = await api.post(UrlConstants.tarpPostComments(imageID), body);
      console.log("Comments:postResponse", { status: res?.status, data: (res as any)?.data });
      setCommentText("");
      setReplyingToID(null);
      await refreshComments();
      toast.success("Comment posted");
    } catch (e: any) {
      console.log("Comments:postError", { status: e?.response?.status, data: e?.response?.data, message: e?.message });
      toast.error("Failed to post comment");
    }
  };

  const toggleLike = async (action: "like" | "unlike") => {
    if (!currentPostItem || isLiking) return;
    const imageID = getCurrentImageId();
    if (!imageID) return;
    try {
      setIsLiking(true);
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
    } finally {
      setIsLiking(false);
    }
  };
  const toggleFriend = async (action: "friend" | "unfriend") => {
    if (!currentPostItem || isFriending) return;
    const userID = extractUserId(currentPostItem);
    if (!userID) return;
    try {
      setIsFriending(true);
      await api.post(UrlConstants.tarpToggleFriend, { userID, action });
      if (action === "friend") {
        setFriendStatus("pending");
        toast.success("Friend request sent");
      } else {
        setFriendStatus("not_friends");
        toast.success("Unfriended");
      }
    } catch {
      toast.error("Failed to toggle friend");
    } finally {
      setIsFriending(false);
    }
  };
  const toggleFollow = async (action: "follow" | "unfollow") => {
    if (!currentPostItem || isFollowing) return;
    const userID = extractUserId(currentPostItem);
    if (!userID) return;
    try {
      setIsFollowing(true);
      await api.post(UrlConstants.tarpToggleFollow, { userID, action });
      setFollowing(action === "follow");
      toast.success(action === "follow" ? "Following" : "Unfollowed");
    } catch {
      toast.error("Failed to toggle follow");
    } finally {
      setIsFollowing(false);
    }
  };

  const clearSavedPosts = async () => {
    await AsyncStorage.removeItem("tarps.posts");
    setMarkers([]);
  };

  // Request permission + get location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const current = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });

      const saved = await AsyncStorage.getItem("tarps.posts");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setMarkers(parsed);
        } catch {}
      }
    })();
  }, []);

  // Upload image + add marker (saves to storage)
  const uploadImage = async () => {
    if (!location) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const newItem = {
        id: Date.now(),
        image: uri,
        latitude: location.latitude,
        longitude: location.longitude,
        userId: user?.id,
        createdAt: Date.now(),
      };
      setMarkers((prev) => {
        const next = [...prev, newItem];
        AsyncStorage.setItem("tarps.posts", JSON.stringify(next));
        return next;
      });
    }
  };

  // Simple clustering by proximity
  const filtered = useMemo(() => {
    if (showMine && user?.id) return markers.filter((m) => m.userId === user.id);
    return markers;
  }, [markers, showMine, user?.id]);

  const clusters = useMemo(() => {
    const t = 0.01; // threshold degrees
    const groups: { lat: number; lng: number; items: typeof filtered }[] = [] as any;
    filtered.forEach((m) => {
      const g = groups.find((gr) => Math.abs(gr.lat - m.latitude) < t && Math.abs(gr.lng - m.longitude) < t);
      if (g) {
        g.items.push(m);
        // keep centroid simple
        g.lat = (g.lat * (g.items.length - 1) + m.latitude) / g.items.length;
        g.lng = (g.lng * (g.items.length - 1) + m.longitude) / g.items.length;
      } else {
        groups.push({ lat: m.latitude, lng: m.longitude, items: [m] });
      }
    });
    return groups;
  }, [filtered]);
  
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
    const vp = buildViewport(region);
    try {
      const url = postsUrl(vp);
      console.log("PostsInView:request", { url, ...vp });
      const res = await api.get(url);
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
      setServerPosts(mapped);
      console.log("PostsInView:mappedSample", JSON.stringify(mapped[0], null, 2));
      console.log("PostsInView:loaded", { count: mapped.length });
    } catch (e: any) {
      console.log("PostsInView:error", { status: e?.response?.status, data: e?.response?.data, message: e?.message });
      setServerPosts([]);
    }
  };
 
  const loadPeopleInView = async (region: typeof location) => {
    if (!region) return;
    const vp = buildViewport(region);
    try {
      const url = peopleUrl(vp);
      console.log("PeopleInView:request", { url, ...vp });
      const res = await api.get(url);
      const list = (res as any).data?.data || (res as any).data?.people || (res as any).data;
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
      console.log("PeopleInView:loaded", { count: mapped.length });
    } catch (e: any) {
      console.log("PeopleInView:error", { status: e?.response?.status, data: e?.response?.data, message: e?.message });
      setServerPeople([]);
    }
  };

  const handleLoadMessages = async () => {
    if (!selectedPerson?.owner?.id) return;
    if (!user) {
      toast.error("Please sign in to message");
      return;
    }
    try {
      setLoadingMessage(true);
      setChatOpen(true);
      setPersonOpen(false);
      const res = await api.get(UrlConstants.fetchPeopleMessages(String(selectedPerson.owner.id)));
      const data = (res as any)?.data?.data || (res as any)?.data;
      setGroupDetails(data?.groupDetails || null);
      setGroupMessages(Array.isArray(data?.messages) ? data.messages : []);
      setTimeout(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollToEnd({ animated: true });
        }
      }, 10);
    } catch (e: any) {
      console.log("PeopleMessage:error", { status: e?.response?.status, data: e?.response?.data, message: e?.message });
      toast.error("Failed to load messages");
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
    try {
      setLoadingNavigate(true);
      const res = await api.get(
        UrlConstants.tarpNavigateToUser({
          locationID: String(selectedPerson.id),
          startingLat: Number(location.latitude),
          startingLng: Number(location.longitude),
          startingLocation: "Current Location",
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

  const pickFromLibrary = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 1,
    });
    if (!res.canceled) {
      const uris = res.assets.map((a) => a.uri).slice(0, 10);
      setSelectedImages(uris);
    }
  };

  const pickLocationPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 1,
    });
    if (!res.canceled) {
      setShareSelectedPhoto(res.assets[0].uri);
    }
  };

  const toggleSelect = (uri: string) => {
    setSelectedImages((prev) => {
      const exists = prev.includes(uri);
      if (exists) return prev.filter((u) => u !== uri);
      if (prev.length >= 10) return prev;
      return [...prev, uri];
    });
  };

  const canPost = selectedImages.length > 0 && placeName.trim().length > 0 && caption.trim().length > 0 && !isUploadingPost;

  const submitPost = async () => {
    if (!location || selectedImages.length === 0 || !placeName.trim() || !caption.trim() || isUploadingPost) return;
    try {
      setIsUploadingPost(true);

      console.log("UploadPost:payloadMeta", {
        images: selectedImages,
        caption: caption.trim(),
        address: placeName.trim(),
        endpoint: UrlConstants.uploadTarps,
        baseUrl: UrlConstants.baseUrl,
      });

      const resolvedUris = await Promise.all(
        selectedImages.map(async (uri) => {
          if (typeof uri === "string" && uri.startsWith("ph://")) {
            const asset = recents.find((a) => a.uri === uri);
            if (asset) {
              try {
                const info = await MediaLibrary.getAssetInfoAsync(asset.id);
                return (info as any)?.localUri || (info as any)?.uri || uri;
              } catch (e) {
                console.log("UploadPost:resolveUriError", { uri, message: (e as any)?.message });
                return uri;
              }
            }
          }
          return uri;
        })
      );

      console.log("UploadPost:resolvedUris", resolvedUris);

      const form = new FormData();
      resolvedUris.forEach((uri, idx) => {
        form.append("image", {
          uri,
          name: `photo_${idx + 1}.jpg`,
          type: "image/jpeg",
        } as any);
      });
      form.append("caption", caption.trim());
      form.append("address", placeName.trim());

      const debugParts = (form as any)?._parts;
      if (debugParts) {
        console.log("UploadPost:formDataParts", debugParts);
      }

      const res = await api.post(UrlConstants.uploadTarps, form, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("UploadPost:success", { status: res.status, data: res.data });
      toast.success("Posted successfully");

      setPostOpen(false);
      setSelectedImages([]);
      setCaption("");
      setPlaceName("");
    } catch (e: any) {
      console.log("UploadPost:error", { status: e?.response?.status, data: e?.response?.data, message: e?.message });
      toast.error("Failed to post photo");
    } finally {
      setIsUploadingPost(false);
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
    if (postOpen || (shareModalVisible && withPhoto)) loadRecents();
  }, [postOpen, shareModalVisible, withPhoto]);

  // Location suggestions for Post Photo modal
  useEffect(() => {
    if (!postOpen) return;
    const q = placeName.trim();
    if (q.length === 0) {
      setPostLocSuggestions([]);
      setShowPostLocDropdown(false);
      return;
    }
    setLoadingPostSuggest(true);
    const t = setTimeout(async () => {
      try {
        const res = await api.get(`tarps/location/suggest?query=${encodeURIComponent(q)}`);
        const arr = Array.isArray((res as any).data?.data)
          ? (res as any).data.data
          : (res as any).data?.data?.data;
        setPostLocSuggestions(Array.isArray(arr) ? arr : []);
        setShowPostLocDropdown(true);
      } catch {
        setPostLocSuggestions([]);
        setShowPostLocDropdown(false);
      } finally {
        setLoadingPostSuggest(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [placeName, postOpen]);

  useEffect(() => {
    const q = statusLocation.trim();
    if (!shareModalVisible) return;
    if (q.length === 0) {
      setLocationSuggestions([]);
      setShowLocationDropdown(false);
      return;
    }
    setLoadingLocSuggest(true);
    const t = setTimeout(async () => {
      try {
        const res = await api.get(`tarps/location/suggest?query=${encodeURIComponent(q)}`);
        const arr = Array.isArray((res as any).data?.data)
          ? (res as any).data.data
          : (res as any).data?.data?.data;
        setLocationSuggestions(Array.isArray(arr) ? arr : []);
        setShowLocationDropdown(true);
      } catch {
        setLocationSuggestions([]);
        setShowLocationDropdown(false);
      } finally {
        setLoadingLocSuggest(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [statusLocation, shareModalVisible]);

  useEffect(() => {
    if (!location) return;
    if (!zoomedWorld && mapRef.current) {
      const world = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 120,
        longitudeDelta: 120,
      } as NonNullable<typeof location>;
      mapRef.current.animateToRegion(world, 600);
      setZoomedWorld(true);
    } else {
      if (viewMode === "people") {
        loadPeopleInView(location);
      } else if (viewMode === "posts") {
        loadPostsInView(location);
      }
    }
  }, [location, viewMode, zoomedWorld]);

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
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={location}
        onRegionChangeComplete={(r) => {
          const reg = { latitude: r.latitude, longitude: r.longitude, latitudeDelta: r.latitudeDelta, longitudeDelta: r.longitudeDelta } as typeof location;
          setMapRegion(reg);
          if (viewMode === "posts") {
            setTimeout(() => {
              loadPostsInView(reg);
            }, 250);
          }
          if (viewMode === "people") {
            loadPeopleInView(reg);
          }
        }}
        mapType="satellite"
        showsCompass={false}
        showsPointsOfInterests={false}
        showsBuildings={false}
        toolbarEnabled={false}
        zoomControlEnabled={false}
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
                    mapRef.current?.animateToRegion(region, 500);
                  } else if (p.image && Array.isArray(p.items) && p.items.length > 0) {
                    const item = p.items[0];
                    const url = extractImageUrl(item) ?? (p.image as string);
                    setCurrentPostItem(item);
                    setLiked(extractLiked(item));
                    setLikeCount(extractLikeCount(item));
                    setFollowing(extractFollowing(item));
                    setFriendStatus(typeof item?.isFriend === "string" ? item.isFriend : "not_friends");
                    setCommentCount(
                      typeof item?.commentsCount === "number"
                        ? item.commentsCount
                        : Array.isArray(item?.comments)
                        ? item.comments.length
                        : Array.isArray(item?.images) && typeof item.images[0]?.comments === "number"
                        ? item.images[0].comments
                        : 0
                    );
                    const set = resolveItemImageSet(item);
                    setCurrentImages(set.urls);
                    setCurrentImageIds(set.ids.filter((x) => typeof x === "string") as string[]);
                    setCurrentImageIndex(0);
                    syncImageMeta(0);
                    setPreview({ uri: url });
                  }
                }}
              >
                <View style={[styles.markerContainer, isDark ? styles.markerDark : styles.markerLight]}>
                  <ExpoImage source={{ uri: p.image as string }} style={styles.markerImage} contentFit="cover" cachePolicy="none" />
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
                    <ExpoImage source={{ uri: p.imageUrl }} style={styles.markerImage} contentFit="cover" cachePolicy="none" />
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

      <Modal visible={!!preview} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <StatusBar hidden />
        <Pressable style={styles.previewOverlay} onPress={() => setPreview(null)}>
          <Pressable style={styles.previewContent} onPress={(e) => e.stopPropagation()}>
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
              preview && <ExpoImage source={{ uri: preview.uri }} style={styles.previewImage} contentFit="cover" />
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
              <Pressable style={styles.headerIcon} onPress={() => setPreview(null)}>
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </Pressable>
              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>{currentPostItem ? extractLocationName(currentPostItem) : "Location"}</Text>
                <Text style={styles.headerSub}>{currentImageIndex + 1} / {Math.max(1, currentImages.length || 1)}</Text>
              </View>
              <Pressable style={styles.headerIcon}>
                <Ionicons name="ellipsis-vertical" size={18} color="#FFFFFF" />
              </Pressable>
            </View>

            <View style={styles.previewTopRow}>
              <View style={styles.userRow}>
                {currentPostItem?.creator && extractImageUrl(currentPostItem.creator) ? (
                  <ExpoImage source={{ uri: extractImageUrl(currentPostItem.creator) as string }} style={styles.userAvatar} contentFit="cover" />
                ) : currentPostItem?.owner && extractImageUrl(currentPostItem.owner) ? (
                  <ExpoImage source={{ uri: extractImageUrl(currentPostItem.owner) as string }} style={styles.userAvatar} contentFit="cover" />
                ) : (
                  <View style={[styles.userAvatar, { alignItems: "center", justifyContent: "center" }]}>
                    <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>
                      {(currentPostItem?.creator?.fname?.[0] || currentPostItem?.owner?.fname?.[0] || currentPostItem?.author?.name?.[0] || "U")?.toUpperCase()}
                    </Text>
                  </View>
                )}
                <View>
                  <Text style={styles.userName}>
                    {currentPostItem?.creator
                      ? `${currentPostItem.creator.fname || ""} ${currentPostItem.creator.lname || ""}`.trim() || (currentPostItem.creator.name as string)
                      : (currentPostItem?.owner?.fname || (currentPostItem?.author?.name as string) || "User")}
                  </Text>
                  <Text style={styles.userTime}>
                    {currentPostItem?.createdAt ? moment(currentPostItem.createdAt).fromNow() : "2d ago"}
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
              <Pressable style={styles.railCircle} onPress={openComments}><Ionicons name="chatbubble-outline" size={18} color="#FFFFFF" /></Pressable>
              <Text style={styles.railCount}>{commentCount}</Text>
              <Pressable style={styles.railCircle}><Ionicons name="share-social-outline" size={18} color="#FFFFFF" /></Pressable>
            </View>

            
            {currentPostItem?.caption ? (
              <View style={styles.captionBox}>
                <Text style={styles.captionText}>{currentPostItem.caption}</Text>
              </View>
            ) : null}

          </Pressable>
        </Pressable>
      </Modal>
      
      <Modal
        visible={commentsOpen}
        transparent
        animationType="slide"
        presentationStyle="overFullScreen"
        hardwareAccelerated
        statusBarTranslucent
        onRequestClose={() => setCommentsOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setCommentsOpen(false)}>
          <Pressable style={[styles.shareSheet, isDark ? styles.sheetDark : styles.sheetLight]} onPress={(e) => e.stopPropagation()}>
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              keyboardVerticalOffset={Platform.OS === "ios" ? insets.bottom + 24 : 40}
            >
            <View style={styles.sheetHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={[styles.sheetTitle, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>Comments ({commentCount})</Text>
                {isLoadingComments && <ActivityIndicator size="small" color={isDark ? "#FFFFFF" : "#0a0a0a"} />}
              </View>
              <Pressable style={styles.headerIcon} onPress={() => setCommentsOpen(false)}>
                <Ionicons name="close" size={20} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16, paddingRight: 24, gap: 12 }} keyboardShouldPersistTaps="handled">
              {comments.length === 0 ? (
                <Text style={{ color: isDark ? "#9AA0A6" : "#666" }}>No comments yet</Text>
              ) : (
                [...comments]
                  .sort((a: any, b: any) => {
                    const ta = new Date(a?.createdAt ?? 0).getTime();
                    const tb = new Date(b?.createdAt ?? 0).getTime();
                    return tb - ta;
                  })
                  .map((c: any, i: number) => {
                    const displayName = c?.commenter
                      ? `${c?.commenter?.fname ?? ""} ${c?.commenter?.lname ?? ""}`.trim() || "User"
                      : c?.user?.name || c?.author?.name || c?.user?.fname || "User";
                    const avatarUrl =
                      c?.commenter?.bgUrl ||
                      c?.user?.avatarUrl ||
                      c?.author?.avatarUrl ||
                      undefined;
                    const initial =
                      (c?.commenter?.fname?.[0] ||
                        c?.user?.fname?.[0] ||
                        c?.user?.name?.[0] ||
                        "U")?.toUpperCase();
                    const time = c?.createdAt ? moment(c.createdAt).fromNow() : "";
                    return (
                      <View key={c?.id ?? i} style={{ gap: 6 }}>
                        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                          {avatarUrl ? (
                            <ExpoImage source={{ uri: avatarUrl }} style={styles.commentAvatar} contentFit="cover" />
                          ) : (
                            <View style={[styles.commentAvatar, { alignItems: "center", justifyContent: "center", backgroundColor: "#888" }]}>
                              <Text style={{ color: "#fff", fontWeight: "700" }}>{initial}</Text>
                            </View>
                          )}
                          <View style={[styles.commentBubble, isDark ? styles.commentBubbleDark : styles.commentBubbleLight]}>
                            <Text style={[styles.commentName, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>{displayName}</Text>
                            <Text style={[styles.commentText, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>{c?.message || c?.text || ""}</Text>
                          </View>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginLeft: 32 }}>
                          <Text style={[styles.commentMeta, { color: isDark ? "#9AA0A6" : "#666" }]}>{time}</Text>
                          <Pressable onPress={() => setReplyingToID(String(c?.id))}>
                            <Text style={{ color: isDark ? "#9AA0A6" : "#666", textDecorationLine: "underline" }}>Reply</Text>
                          </Pressable>
                        </View>
                        {Array.isArray(c?.replies) && c.replies.length > 0
                          ? c.replies
                              .slice()
                              .sort((a: any, b: any) => {
                                const ta = new Date(a?.createdAt ?? 0).getTime();
                                const tb = new Date(b?.createdAt ?? 0).getTime();
                                return ta - tb;
                              })
                              .map((r: any, ri: number) => {
                                const rName = r?.commenter
                                  ? `${r?.commenter?.fname ?? ""} ${r?.commenter?.lname ?? ""}`.trim() || "User"
                                  : r?.user?.name || r?.author?.name || r?.user?.fname || "User";
                                const rAvatarUrl =
                                  r?.commenter?.bgUrl ||
                                  r?.user?.avatarUrl ||
                                  r?.author?.avatarUrl ||
                                  undefined;
                                const rInitial =
                                  (r?.commenter?.fname?.[0] ||
                                    r?.user?.fname?.[0] ||
                                    r?.user?.name?.[0] ||
                                    "U")?.toUpperCase();
                                const rTime = r?.createdAt ? moment(r.createdAt).fromNow() : "";
                                return (
                                  <View key={r?.id ?? ri} style={{ gap: 6, marginLeft: 32 }}>
                                    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                                      {rAvatarUrl ? (
                                        <ExpoImage source={{ uri: rAvatarUrl }} style={styles.commentAvatar} contentFit="cover" />
                                      ) : (
                                        <View style={[styles.commentAvatar, { alignItems: "center", justifyContent: "center", backgroundColor: "#888" }]}>
                                          <Text style={{ color: "#fff", fontWeight: "700" }}>{rInitial}</Text>
                                        </View>
                                      )}
                                      <View style={[styles.commentBubble, isDark ? styles.commentBubbleDark : styles.commentBubbleLight]}>
                                        <Text style={[styles.commentName, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>{rName}</Text>
                                        <Text style={[styles.commentText, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>{r?.message || r?.text || ""}</Text>
                                      </View>
                                    </View>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginLeft: 32 }}>
                                      <Text style={[styles.commentMeta, { color: isDark ? "#9AA0A6" : "#666" }]}>{rTime}</Text>
                                    </View>
                                  </View>
                                );
                              })
                          : null}
                      </View>
                    );
                  })
              )}
            </ScrollView>
            <View style={{ padding: 14, paddingBottom: insets.bottom + 8, borderTopWidth: 1, borderTopColor: isDark ? "#333" : "#E0E0E0" }}>
              {replyingToID && (
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text style={{ color: isDark ? "#FFFFFF" : "#0a0a0a" }}>Replying…</Text>
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
                  style={[styles.chatSendBtn, isDark ? styles.chatSendDark : styles.chatSendLight]}
                  onPress={sendComment}
                >
                  <Ionicons name="paper-plane-outline" size={18} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
                </Pressable>
              </View>
            </View>
            </KeyboardAvoidingView>
          </Pressable>
        </Pressable>
      </Modal>
      
      <Modal visible={chatOpen} transparent animationType="fade" onRequestClose={() => setChatOpen(false)}>
        <Pressable style={styles.createOverlay} onPress={() => setChatOpen(false)}>
          <Pressable style={[styles.dialogCard, isDark ? styles.sheetDark : styles.sheetLight]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="chatbubble-outline" size={18} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
                <Text style={[styles.sheetTitle, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>
                  Message {selectedPerson?.owner?.fname} {selectedPerson?.owner?.lname || ""}
                </Text>
              </View>
              <Pressable style={styles.headerIcon} onPress={() => setChatOpen(false)}>
                <Ionicons name="close" size={20} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
              </Pressable>
            </View>
            <ScrollView ref={chatScrollRef} style={{ maxHeight: 360, paddingHorizontal: 14, paddingTop: 14 }}>
              {groupMessages.map((m, i) => {
                const isOwn = m?.sender?.id === user?.id;
                return (
                  <View key={m?.content?.id || i} style={{ marginBottom: 10 }}>
                    {!isOwn && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        {selectedPerson?.imageUrl ? (
                          <ExpoImage source={{ uri: selectedPerson.imageUrl }} style={{ width: 20, height: 20, borderRadius: 10 }} />
                        ) : (
                          <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: "#888", alignItems: "center", justifyContent: "center" }}>
                            <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>{selectedPerson?.owner?.fname?.[0]?.toUpperCase() || "F"}</Text>
                          </View>
                        )}
                        <Text style={{ color: isDark ? "#FFFFFF" : "#0a0a0a", fontWeight: "600" }}>
                          {selectedPerson?.owner?.fname}
                        </Text>
                      </View>
                    )}
                    <View
                      style={[
                        { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, maxWidth: "80%" },
                        isOwn
                          ? { alignSelf: "flex-end", backgroundColor: "#0a0a0a" }
                          : { alignSelf: "flex-start", backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5" },
                      ]}
                    >
                      <Text style={{ color: isOwn ? "#FFFFFF" : isDark ? "#FFFFFF" : "#0a0a0a" }}>
                        {m?.content?.message || m?.content || ""}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
            <View style={{ padding: 14, borderTopWidth: 1, borderTopColor: "#2a2e37" }}>
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
          </Pressable>
        </Pressable>
      </Modal>

      <View style={[styles.topBar, { top: insets.top + 8 }]}>
        <View style={styles.leftButtons}>
          <View style={[styles.viewTogglePill, isDark ? styles.pillDark : styles.pillLight]}>
            <Pressable
              style={[styles.pillSeg, viewMode === "posts" ? (isDark ? styles.pillSegActiveDark : styles.pillSegActiveLight) : null]}
              onPress={() => {
                setViewMode("posts");
                loadPostsInView(mapRegion || location);
              }}
            >
              <Ionicons name="image-outline" size={18} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
            </Pressable>
            <Pressable
              style={[styles.pillSeg, viewMode === "people" ? (isDark ? styles.pillSegActiveDark : styles.pillSegActiveLight) : null]}
              onPress={() => {
                setViewMode("people");
                loadPeopleInView(mapRegion || location);
              }}
            >
              <Ionicons name="people-outline" size={18} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
            </Pressable>
          </View>
        </View>
        <Pressable
          style={[styles.myPostsBtn, isDark ? styles.myPostsDark : styles.myPostsLight]}
          onPress={() => {
            const allItems = serverPosts.flatMap((p) => Array.isArray(p.items) ? p.items : []);
            const mine = allItems.find((it: any) => extractUserId(it) === String(user?.id));
            if (!mine) {
              toast.error("No posts found");
              return;
            }
            const url = extractImageUrl(mine);
            if (url) {
              setCurrentPostItem(mine);
              setPreview({ uri: url });
            } else {
              toast.error("Unable to open post");
            }
          }}
        >
          <Ionicons name="person" size={16} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
          <Text style={[styles.myPostsText, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>{showMine ? "My Posts" : "My Posts"}</Text>
        </Pressable>
      </View>

      {viewMode === "posts" ? (
        <Pressable
          style={[styles.uploadButton, isDark ? styles.uploadBtnDark : styles.uploadBtnLight]}
          onPress={() => setPostOpen(true)}
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

      <Modal visible={postOpen} transparent animationType="fade" onRequestClose={() => setPostOpen(false)}>
        <View style={styles.createOverlay}>
          <KeyboardAvoidingView
            style={[styles.createSheet, isDark ? styles.sheetDark : styles.sheetLight]}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? insets.bottom + 24 : 40}
          >
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>Post Photo</Text>
              <Pressable style={styles.headerIcon} onPress={() => setPostOpen(false)}>
                <Ionicons name="close" size={20} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
              </Pressable>
            </View>

            <View style={{ flex: 1 }}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }} nestedScrollEnabled>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>Photos (up to 10)</Text>
              </View>
              <View style={styles.selectedGrid}>
                {selectedImages.map((uri, i) => (
                  <View key={`${uri}-sel-${i}`} style={[styles.gridItem, styles.gridItemActive]}>
                    <ExpoImage source={{ uri }} style={styles.gridImage} contentFit="cover" />
                    <View style={styles.orderBadge}><Text style={styles.orderText}>{i + 1}</Text></View>
                  </View>
                ))}
              </View>
              <View style={styles.sectionSubRow}>
                <Text style={[styles.sectionSub, { color: isDark ? "#9AA0A6" : "#666" }]}>Recents</Text>
                <Text style={[styles.sectionSub, { color: isDark ? "#9AA0A6" : "#666" }]}>{selectedImages.length}/10 selected</Text>
              </View>
              <ScrollView style={styles.galleryScroll} nestedScrollEnabled>
                <View style={styles.grid}>
                  {recents.map((asset, i) => {
                    const uri = asset.uri;
                    const order = selectedImages.indexOf(uri);
                    const active = order !== -1;
                    return (
                      <Pressable key={`${asset.id}-${i}`} style={[styles.gridItem, active && styles.gridItemActive]} onPress={() => toggleSelect(uri)}>
                        <ExpoImage source={{ uri }} style={styles.gridImage} contentFit="cover" />
                        {active && (
                          <View style={styles.orderBadge}><Text style={styles.orderText}>{order + 1}</Text></View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>

              <Text style={[styles.helperText, { color: isDark ? "#9AA0A6" : "#666" }]}>Tap photos to select • Scroll to see more</Text>

              <Text style={[styles.inputLabel, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>Location *</Text>
              <View style={{ position: "relative" }}>
                <View style={[styles.inputWrapper, isDark ? styles.inputDark : styles.inputLight]}>
                  <Ionicons name="location-outline" size={16} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
                  <TextInput
                    value={placeName}
                    onChangeText={setPlaceName}
                    placeholder="Where was this photo taken?"
                    placeholderTextColor={isDark ? "#888" : "#999"}
                    style={[styles.textInput, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}
                  />
                </View>
                {showPostLocDropdown && (
                  <View style={[styles.dropdownList, isDark ? styles.dropdownDark : styles.dropdownLight]}>
                    {loadingPostSuggest ? (
                      <View style={styles.dropdownItem}>
                        <Text style={{ color: isDark ? "#FFF" : "#000", fontSize: 13 }}>Loading...</Text>
                      </View>
                    ) : (
                      postLocSuggestions.slice(0, 8).map((option) => (
                        <Pressable
                          key={option}
                          style={[styles.dropdownItem, isDark ? styles.dropdownItemDark : styles.dropdownItemLight]}
                          onPress={() => {
                            setPlaceName(option);
                            setShowPostLocDropdown(false);
                          }}
                        >
                          <Text style={{ color: isDark ? "#FFF" : "#000", fontSize: 13 }}>{option}</Text>
                        </Pressable>
                      ))
                    )}
                  </View>
                )}
              </View>
              <Text style={[styles.inputHint, { color: isDark ? "#9AA0A6" : "#666" }]}>e.g., Library, Student Center, Campus Quad</Text>

              <Text style={[styles.inputLabel, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>Caption *</Text>
              <View style={[styles.textAreaWrapper, isDark ? styles.inputDark : styles.inputLight]}>
                <TextInput
                  value={caption}
                  onChangeText={setCaption}
                  placeholder="Share your thoughts about this moment..."
                  placeholderTextColor={isDark ? "#888" : "#999"}
                  style={[styles.textArea, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}
                  multiline
                />
              </View>
            </ScrollView>
            </View>

            <View style={[styles.sheetFooter, { paddingBottom: insets.bottom + 8 }]}>
              <Pressable style={[styles.cancelBtn]} onPress={() => setPostOpen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable disabled={!canPost} style={[styles.postBtn, !canPost && styles.postDisabled]} onPress={submitPost}>
                {isUploadingPost ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={[styles.postText, { marginLeft: 8 }]}>Posting...</Text>
                  </>
                ) : (
                  <Text style={styles.postText}>Post</Text>
                )}
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal visible={shareModalVisible} transparent animationType="slide" onRequestClose={() => setShareModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShareModalVisible(false)}>
            <Pressable style={[styles.shareSheet, isDark ? styles.sheetDark : styles.sheetLight]} onPress={(e) => e.stopPropagation()}>
                <View style={styles.sheetHeader}>
                    <View>
                        <Text style={[styles.sheetTitle, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>Share Your Location</Text>
                        <Text style={[styles.sheetSub, { color: isDark ? "#9AA0A6" : "#666" }]}>Let your friends know where you are on campus</Text>
                    </View>
                     <Pressable style={styles.headerIcon} onPress={() => setShareModalVisible(false)}>
                        <Ionicons name="close" size={20} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
                    </Pressable>
                </View>
                
                <ScrollView contentContainerStyle={{padding: 20, gap: 20}}>
                    <View style={{position: 'relative'}}>
                        <Text style={[styles.inputLabel, { color: isDark ? "#FFFFFF" : "#0a0a0a", paddingHorizontal: 0 }]}>Where are you?</Text>
                        <View style={[styles.inputWrapper, isDark ? styles.inputDark : styles.inputLight, { marginHorizontal: 0 }]}>
                            <Ionicons name="location-outline" size={16} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
                            <TextInput
                                value={statusLocation}
                                onChangeText={setStatusLocation}
                                placeholder="Type or select a location"
                                placeholderTextColor={isDark ? "#888" : "#999"}
                                style={[styles.textInput, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}
                            />
                             <Ionicons name="compass-outline" size={16} color={isDark ? "#888" : "#999"} />
                        </View>
                        {showLocationDropdown && (
                          <View style={[styles.dropdownList, isDark ? styles.dropdownDark : styles.dropdownLight]}>
                            {loadingLocSuggest ? (
                              <View style={styles.dropdownItem}>
                                <Text style={{color: isDark ? "#FFF" : "#000", fontSize: 13}}>Loading...</Text>
                              </View>
                            ) : (
                              locationSuggestions.slice(0, 8).map((option) => (
                                <Pressable
                                  key={option}
                                  style={[styles.dropdownItem, isDark ? styles.dropdownItemDark : styles.dropdownItemLight]}
                                  onPress={() => {
                                    setStatusLocation(option);
                                    setShowLocationDropdown(false);
                                  }}
                                >
                                  <Text style={{color: isDark ? "#FFF" : "#000", fontSize: 13}}>{option}</Text>
                                </Pressable>
                              ))
                            )}
                          </View>
                        )}
                    </View>

                    {/* Activity Input */}
                    <View>
                        <Text style={[styles.inputLabel, { color: isDark ? "#FFFFFF" : "#0a0a0a", paddingHorizontal: 0 }]}>What are you doing?</Text>
                        <View style={[styles.inputWrapper, isDark ? styles.inputDark : styles.inputLight, { marginHorizontal: 0 }]}>
                            <TextInput
                                value={statusActivity}
                                onChangeText={setStatusActivity}
                                placeholder="e.g., studying, eating lunch, hanging out"
                                placeholderTextColor={isDark ? "#888" : "#999"}
                                style={[styles.textInput, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}
                            />
                        </View>
                         <Text style={[styles.inputHint, { paddingHorizontal: 0 }]}>Quick suggestions:</Text>
                         <View style={styles.chipContainer}>
                            {suggestions.map((s) => (
                                <Pressable 
                                    key={s} 
                                    style={[styles.chip, statusActivity === s && styles.chipActive, isDark ? {borderColor: "#333"} : {borderColor: "#e0e0e0"}]}
                                    onPress={() => setStatusActivity(s)}
                                >
                                    <Text style={[styles.chipText, statusActivity === s && {color: "#FFF"}, {color: isDark ? "#FFF" : "#000"}]}>{s}</Text>
                                </Pressable>
                            ))}
                         </View>
                    </View>

                    {/* Duration */}
                     <View style={{zIndex: 100}}>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                             <Ionicons name="time-outline" size={16} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
                             <Text style={[styles.inputLabel, { color: isDark ? "#FFFFFF" : "#0a0a0a", paddingHorizontal: 0, paddingTop: 0 }]}>How long will you be here?</Text>
                        </View>
                        <Pressable 
                            style={[styles.inputWrapper, isDark ? styles.inputDark : styles.inputLight, { marginHorizontal: 0, justifyContent: 'space-between' }]}
                            onPress={() => setShowDurationDropdown(!showDurationDropdown)}
                        >
                            <Text style={{color: isDark ? "#FFF" : "#000"}}>{statusDuration}</Text>
                            <Ionicons name={showDurationDropdown ? "chevron-up" : "chevron-down"} size={16} color={isDark ? "#888" : "#999"} />
                        </Pressable>
                        
                        {showDurationDropdown && (
                            <View style={[styles.dropdownList, isDark ? styles.dropdownDark : styles.dropdownLight]}>
                                {durationOptions.map((option) => (
                                    <Pressable
                                        key={option}
                                        style={[styles.dropdownItem, isDark ? styles.dropdownItemDark : styles.dropdownItemLight]}
                                        onPress={() => {
                                            setStatusDuration(option);
                                            setShowDurationDropdown(false);
                                        }}
                                    >
                                        <Text style={{color: isDark ? "#FFF" : "#000", fontSize: 13}}>{option}</Text>
                                        {statusDuration === option && (
                                            <Ionicons name="checkmark" size={16} color="#3b82f6" />
                                        )}
                                    </Pressable>
                                ))}
                            </View>
                        )}
                        
                         <Text style={[styles.inputHint, { paddingHorizontal: 0 }]}>Your location will automatically stop being shared after this time</Text>
                    </View>

                    {/* Photo Option */}
                    <View>
                        <View style={[styles.photoOption, isDark ? styles.inputDark : styles.inputLight]}>
                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                                <View style={[styles.iconBox, {backgroundColor: isDark ? "#222" : "#f0f0f0"}]}>
                                    <Ionicons name="camera-outline" size={20} color={isDark ? "#FFF" : "#000"} />
                                </View>
                                <View>
                                    <Text style={{color: isDark ? "#FFF" : "#000", fontWeight: '600'}}>Share a photo with your location</Text>
                                    <Text style={{color: isDark ? "#888" : "#666", fontSize: 12}}>Let friends see where you are</Text>
                                </View>
                            </View>
                            <Pressable onPress={() => setWithPhoto(!withPhoto)}>
                                <Ionicons name={withPhoto ? "checkbox" : "square-outline"} size={24} color={isDark ? "#FFF" : "#000"} />
                            </Pressable>
                        </View>

                        {withPhoto && (
                            <View style={{marginTop: 12}}>
                                {!shareSelectedPhoto ? (
                                    <>
                                        <View style={styles.recentsHeader}>
                                            <Text style={[styles.recentsTitle, {color: isDark ? "#FFF" : "#000"}]}>Recents</Text>
                                            <Pressable onPress={pickLocationPhoto}>
                                                <Text style={[styles.seeAllText, { color: isDark ? "#FFF" : "#000" }]}>See All</Text>
                                            </Pressable>
                                        </View>
                                        <View style={styles.miniGalleryGrid}>
                                            {recents.slice(0, 6).map((asset, i) => (
                                                <Pressable key={asset.id ?? i} style={styles.miniGalleryItem} onPress={() => setShareSelectedPhoto(asset.uri)}>
                                                    <ExpoImage source={{ uri: asset.uri }} style={styles.gridImage} contentFit="cover" />
                                                </Pressable>
                                            ))}
                                        </View>
                                    </>
                                ) : (
                                    <View style={styles.selectedPhotoContainer}>
                                        <ExpoImage source={{ uri: shareSelectedPhoto }} style={styles.selectedPhoto} contentFit="cover" />
                                        <Pressable style={styles.removePhotoBtn} onPress={() => setShareSelectedPhoto(null)}>
                                            <Ionicons name="trash-outline" size={16} color="#FFF" />
                                        </Pressable>
                                        <Text style={styles.photoOverlayText}>Photo will be shared with your location</Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>

                    {/* Privacy Card */}
                    <View style={[styles.privacyCard, {backgroundColor: isDark ? "#111" : "#f9f9f9", borderColor: isDark ? "#333" : "#e0e0e0"}]}>
                        <View style={{flexDirection: 'row', gap: 12, flex: 1}}>
                             <Ionicons name="shield-checkmark-outline" size={24} color={isDark ? "#888" : "#666"} />
                             <View style={{flex: 1}}>
                                <Text style={{color: isDark ? "#FFF" : "#000", fontWeight: '600', marginBottom: 2}}>Location Privacy</Text>
                                <Text style={{color: isDark ? "#888" : "#666", fontSize: 12}}>All friends can see your location by default</Text>
                             </View>
                        </View>
                        <Pressable style={[styles.privacyBtn, {borderColor: isDark ? "#444" : "#ddd"}]}>
                            <Ionicons name="eye-outline" size={14} color={isDark ? "#FFF" : "#000"} />
                            <Text style={{color: isDark ? "#FFF" : "#000", fontSize: 12, fontWeight: '600'}}>Manage</Text>
                        </Pressable>
                    </View>

                    <Text style={{color: isDark ? "#888" : "#666", fontSize: 12}}>
                        Location will be shared based on your privacy settings
                    </Text>

                </ScrollView>
                
                <View style={styles.sheetFooter}>
                    <Pressable style={[styles.cancelBtn]} onPress={() => setShareModalVisible(false)}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.postBtn,
                        {backgroundColor: isDark ? "#E0E0E0" : "#0a0a0a"},
                        (isSharing || !statusLocation.trim()) && styles.postDisabled
                      ]}
                      disabled={isSharing || !statusLocation.trim()}
                      onPress={handleShareStatus}
                    >
                        <Ionicons name="location-outline" size={16} color={isDark ? "#000" : "#FFF"} style={{marginRight: 6}} />
                        <Text style={[styles.postText, {color: isDark ? "#000" : "#FFF"}]}>{isSharing ? "Sharing..." : "Share Location"}</Text>
                    </Pressable>
                </View>
            </Pressable>
        </Pressable>
      </Modal>

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
                  <Text style={{ color: isDark ? "#FFFFFF" : "#0a0a0a" }}>{selectedPerson.locationName}</Text>
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
              {(selectedPerson?.owner?.bgUrl || selectedPerson?.imageUrl) ? (
                <ExpoImage
                  source={{ uri: (selectedPerson?.owner?.bgUrl || selectedPerson?.imageUrl) as string }}
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
  pillSegActiveDark: { backgroundColor: "#1A1A1A" },
  pillSegActiveLight: { backgroundColor: "#EAF2FF" },
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
  previewHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  headerCenter: { position: "absolute", top: 54, left: 0, right: 0, alignItems: "center", gap: 2 },
  headerTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "700", width: "60%", textAlign: "center" },
  headerSub: { color: "#FFFFFF", opacity: 0.8, fontSize: 12, width: "60%", textAlign: "center" },
  previewTopRow: {
    position: "absolute",
    top: 90,
    left: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop:20},
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  userName: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  userTime: { color: "#FFFFFF", fontSize: 12, opacity: 0.85 },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop:20 },
  friendBtn: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  friendBtnPending: {
    backgroundColor: "#CCCCCC",
  },
  friendText: { color: "#0a0a0a", fontSize: 12, fontWeight: "700" },
  followBtn: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#1877F2",
    alignItems: "center",
    justifyContent: "center",
  },
  followBtnActive: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  followText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  rightRail: {
    position: "absolute",
    right: 14,
    top: 160,
    alignItems: "center",
    gap: 10,
  },
  railCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  railCount: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  previewBadge: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: [{ translateX: -40 }, { translateY: -12 }],
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 10,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  previewBadgeText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  gradientTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "25%",
  },
  gradientBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "25%",
  },
  captionBox: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  captionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
  commentBubble: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingRight: 18,
    maxWidth: "85%",
  },
  commentBubbleDark: { backgroundColor: "#1A1A1A" },
  commentBubbleLight: { backgroundColor: "#E9EAED" },
  commentName: { fontSize: 13, fontWeight: "700", marginBottom: 4 },
  commentText: { fontSize: 13 },
  commentMeta: { fontSize: 12 },
  commentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
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
});
