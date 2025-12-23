import { api } from "@/api/client";
import { UrlConstants } from "@/constants/apiUrls";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuthStore } from "@/state/authStore";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image as ExpoImage } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import moment from "moment";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import uuid from "react-native-uuid";
import io from "socket.io-client";
import { toast } from "sonner-native";

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

  const [markers, setMarkers] = useState<
    { id: number; image: string; latitude: number; longitude: number; userId?: string; createdAt?: number }[]
  >([]);
  const [showMine, setShowMine] = useState(false);
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
  const chatScrollRef = useRef<FlatList | null>(null);
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

  // Optimized chat messages with precomputed data for performance
  const chatMessages = useMemo(() => {
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
        id: m?.content?.id || index.toString()
      };
    });
  }, [groupMessages, user?.id, selectedPerson?.owner?.fname]);

  // Memoized chat row component
  const ChatRow = useCallback(({ item }: { item: any }) => {
    return (
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
          {!item.isOwn && (
            <>
              {selectedPerson?.imageUrl ? (
                <ExpoImage source={{ uri: selectedPerson.imageUrl }} style={{ width: 24, height: 24, borderRadius: 12 }} contentFit="cover" />
              ) : (
                <View style={{ width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#888" }}>
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>{item.initial}</Text>
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
            {!item.isOwn && (
              <Text style={{ fontSize: 12, fontWeight: "700", color: isDark ? "#FFFFFF" : "#0a0a0a", marginBottom: 2 }}>
                {item.displayName}
              </Text>
            )}
            <Text style={{ fontSize: 12, color: item.isOwn ? "#FFFFFF" : isDark ? "#FFFFFF" : "#0a0a0a" }}>
              {item?.content?.message || item?.content || ""}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginLeft: item.isOwn ? 16 : 32 }}>
          <Text style={{ fontSize: 10, color: isDark ? "#9AA0A6" : "#666" }}>{item.timeString}</Text>
        </View>
      </View>
    );
  }, [isDark, selectedPerson?.imageUrl]);

  const renderChatMessage = useCallback(({ item }: { item: any }) => (
    <ChatRow item={item} />
  ), [ChatRow]);

  const chatKeyExtractor = useCallback((item: any, index: number) => item.id || index.toString(), []);

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
                        nav.push(`/post/${primaryItem.id || 'unknown'}?item=${encodeURIComponent(JSON.stringify(primaryItem))}&images=${encodeURIComponent(JSON.stringify(combinedSet))}&allItems=${encodeURIComponent(JSON.stringify(allItems))}&idx=0`);
                      } catch (error) {
                        console.error("Failed to navigate to stacked posts:", error);
                        toast.error("Failed to open posts");
                      }
                    } else {
                      // Posts are spread out, zoom in to separate them
                      console.log("Posts are spread out, zooming in to separate");
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
                      nav.push(`/post/${item.id || 'unknown'}?item=${encodeURIComponent(JSON.stringify(item))}&images=${encodeURIComponent(JSON.stringify(set))}&idx=0`);
                    } catch (error) {
                      console.error("Failed to navigate to post:", error);
                      toast.error("Failed to open post");
                    }
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
                    Message {selectedPerson?.owner?.fname} {selectedPerson?.owner?.lname || ""}
                  </Text>
                </View>
                <Pressable style={styles.headerIcon} onPress={() => setChatOpen(false)}>
                  <Ionicons name="close" size={20} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
                </Pressable>
              </View>
              
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
              <Ionicons name="image-outline" size={18} color={viewMode === "posts" ? "#FFFFFF" : (isDark ? "#FFFFFF" : "#0a0a0a")} />
            </Pressable>
            <Pressable
              style={[styles.pillSeg, viewMode === "people" ? (isDark ? styles.pillSegActiveDark : styles.pillSegActiveLight) : null]}
              onPress={() => {
                setViewMode("people");
                loadPeopleInView(mapRegion || location);
              }}
            >
              <Ionicons name="people-outline" size={18} color={viewMode === "people" ? "#FFFFFF" : (isDark ? "#FFFFFF" : "#0a0a0a")} />
            </Pressable>
          </View>
        </View>
        <Pressable
          style={[styles.myPostsBtn, isDark ? styles.myPostsDark : styles.myPostsLight]}
          onPress={() => {
            const allItems = serverPosts.flatMap((p) => Array.isArray(p.items) ? p.items : []);
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
            const mine = allItems.find((it: any) => extractUserId(it) === String(user?.id));
            if (!mine) {
              toast.error("No posts found");
              return;
            }
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
                  const cover = extractImageUrl(mine);
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
                  const fallbackId = extractImageId(mine);
                  if (cover) {
                    urls.push(cover);
                    ids.push(fallbackId);
                  }
                }
                return { urls, ids };
              };
              const set = resolveItemImageSet(mine);
              nav.push(`/post/${mine.id || 'unknown'}?item=${encodeURIComponent(JSON.stringify(mine))}&images=${encodeURIComponent(JSON.stringify(set))}&idx=0`);
            } catch (error) {
              console.error("Failed to navigate to post:", error);
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
});