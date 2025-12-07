import { useTheme } from "@/contexts/ThemeContext";
import { useAuthStore } from "@/state/authStore";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image as ExpoImage } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

  if (!location) {
    return (
      <View style={styles.center}>
        <Text>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <MapView style={{ flex: 1 }} initialRegion={location}>
        {clusters.map((c, idx) => {
          const cover = c.items[0];
          const count = c.items.length;
          return (
            <Marker key={idx} coordinate={{ latitude: c.lat, longitude: c.lng }} onPress={() => setPreview({ uri: cover.image })}>
              <View style={[styles.markerContainer, isDark ? styles.markerDark : styles.markerLight]}>
                <ExpoImage source={{ uri: cover.image }} style={styles.markerImage} contentFit="cover" cachePolicy="none" />
                <View style={styles.countBadge}><Text style={styles.countText}>{count >= 1000 ? `${Math.floor(count/1000)}k` : `${count}`}</Text></View>
              </View>
              <View style={[styles.pointer, isDark ? styles.pointerDark : styles.pointerLight]} />
            </Marker>
          );
        })}
      </MapView>

      <Modal visible={!!preview} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <StatusBar hidden />
        <Pressable style={styles.previewOverlay} onPress={() => setPreview(null)}>
          <Pressable style={styles.previewContent} onPress={(e) => e.stopPropagation()}>
            {preview && (
              <ExpoImage source={{ uri: preview.uri }} style={styles.previewImage} contentFit="cover" />
            )}
            <View style={[styles.previewHeader, { paddingTop: insets.top + 6 }]}>
              <Pressable style={styles.headerIcon} onPress={() => setPreview(null)}>
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </Pressable>
              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>Pool Area</Text>
                <Text style={styles.headerSub}>1 / 1</Text>
              </View>
              <Pressable style={styles.headerIcon}>
                <Ionicons name="ellipsis-vertical" size={18} color="#FFFFFF" />
              </Pressable>
            </View>

            <View style={styles.previewTopRow}>
              <View style={styles.userRow}>
                <View style={styles.userAvatar}><Ionicons name="person" size={18} color="#FFFFFF" /></View>
                <View>
                  <Text style={styles.userName}>Isabella Garcia</Text>
                  <Text style={styles.userTime}>2d ago</Text>
                </View>
              </View>
              <View style={styles.actionRow}>
                <Pressable style={styles.friendBtn}><Text style={styles.friendText}>Friend</Text></Pressable>
                <Pressable style={styles.followBtn}><Text style={styles.followText}>Follow</Text></Pressable>
              </View>
            </View>

            <View style={styles.rightRail}>
              <Pressable style={styles.railCircle}><Ionicons name="heart-outline" size={18} color="#FFFFFF" /></Pressable>
              <Text style={styles.railCount}>412</Text>
              <Pressable style={styles.railCircle}><Ionicons name="chatbubble-outline" size={18} color="#FFFFFF" /></Pressable>
              <Text style={styles.railCount}>2</Text>
              <Pressable style={styles.railCircle}><Ionicons name="share-social-outline" size={18} color="#FFFFFF" /></Pressable>
            </View>

            <View style={styles.previewBadge}><Text style={styles.previewBadgeText}>Preview</Text></View>

          </Pressable>
        </Pressable>
      </Modal>

      <View style={[styles.topBar, { top: insets.top + 8 }]}>
        <View style={styles.leftButtons}>
          <Pressable style={[styles.squareBtn, isDark ? styles.squareDark : styles.squareLight]}>
            <Ionicons name="people-outline" size={18} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
          </Pressable>
          <Pressable style={[styles.squareBtn, isDark ? styles.squareDark : styles.squareLight]}>
            <Ionicons name="send-outline" size={18} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
          </Pressable>
          <Pressable style={[styles.squareBtn, isDark ? styles.squareDark : styles.squareLight]} onPress={clearSavedPosts}>
            <Ionicons name="trash-outline" size={18} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
          </Pressable>
        </View>
        <Pressable style={[styles.myPostsBtn, isDark ? styles.myPostsDark : styles.myPostsLight]} onPress={() => setShowMine((s) => !s)}>
          <Ionicons name="person" size={16} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
          <Text style={[styles.myPostsText, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>{showMine ? "My Posts" : "My Posts"}</Text>
        </Pressable>
      </View>

      <Pressable style={[styles.uploadButton]} onPress={uploadImage}>
        <Ionicons name="add" size={26} color="#0a0a0a" />
      </Pressable>
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
  markerContainer: {
    width: 86,
    height: 86,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "visible",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
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
    bottom: -9,
    right: -9,
    backgroundColor: "#FFFFFF",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
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
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  headerCenter: { alignItems: "center", gap: 2 },
  headerTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  headerSub: { color: "#FFFFFF", opacity: 0.8, fontSize: 12 },
  previewTopRow: {
    position: "absolute",
    top: 90,
    left: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userRow: { flexDirection: "row", alignItems: "center", gap: 10 },
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
  actionRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  friendBtn: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
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
  followText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  rightRail: {
    position: "absolute",
    right: 14,
    top: 160,
    alignItems: "center",
    gap: 10,
  },
  railCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
});
