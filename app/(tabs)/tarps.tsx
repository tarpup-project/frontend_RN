// import { useTheme } from "@/contexts/ThemeContext";
// import { useAuthStore } from "@/state/authStore";
// import { Ionicons } from "@expo/vector-icons";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { Image as ExpoImage } from "expo-image";
// import * as ImagePicker from "expo-image-picker";
// import * as Location from "expo-location";
// import * as MediaLibrary from "expo-media-library";
// import { StatusBar } from "expo-status-bar";
// import React, { useEffect, useMemo, useState } from "react";
// import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
// import MapView, { Marker } from "react-native-maps";
// import { useSafeAreaInsets } from "react-native-safe-area-context";

// export default function TarpsScreen() {
//   const { isDark } = useTheme();
//   const { user } = useAuthStore();
//   const insets = useSafeAreaInsets();
//   // Correct type for Map region
//   const [location, setLocation] = useState<{
//     latitude: number;
//     longitude: number;
//     latitudeDelta: number;
//     longitudeDelta: number;
//   } | null>(null);

//   const [markers, setMarkers] = useState<
//     { id: number; image: string; latitude: number; longitude: number; userId?: string; createdAt?: number }[]
//   >([]);
//   const [showMine, setShowMine] = useState(false);
//   const [preview, setPreview] = useState<{ uri: string } | null>(null);
//   const [postOpen, setPostOpen] = useState(false);
//   const [selectedImages, setSelectedImages] = useState<string[]>([]);
//   const [recents, setRecents] = useState<string[]>([]);
//   const [placeName, setPlaceName] = useState("");
//   const [caption, setCaption] = useState("");

//   const clearSavedPosts = async () => {
//     await AsyncStorage.removeItem("tarps.posts");
//     setMarkers([]);
//   };

//   // Request permission + get location
//   useEffect(() => {
//     (async () => {
//       const { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== "granted") return;

//       const current = await Location.getCurrentPositionAsync({});
//       setLocation({
//         latitude: current.coords.latitude,
//         longitude: current.coords.longitude,
//         latitudeDelta: 0.05,
//         longitudeDelta: 0.05,
//       });

//       const saved = await AsyncStorage.getItem("tarps.posts");
//       if (saved) {
//         try {
//           const parsed = JSON.parse(saved);
//           if (Array.isArray(parsed)) setMarkers(parsed);
//         } catch {}
//       }
//     })();
//   }, []);

//   // Upload image + add marker (saves to storage)
//   const uploadImage = async () => {
//     if (!location) return;

//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       quality: 1,
//     });

//     if (!result.canceled) {
//       const uri = result.assets[0].uri;
//       const newItem = {
//         id: Date.now(),
//         image: uri,
//         latitude: location.latitude,
//         longitude: location.longitude,
//         userId: user?.id,
//         createdAt: Date.now(),
//       };
//       setMarkers((prev) => {
//         const next = [...prev, newItem];
//         AsyncStorage.setItem("tarps.posts", JSON.stringify(next));
//         return next;
//       });
//     }
//   };

//   // Simple clustering by proximity
//   const filtered = useMemo(() => {
//     if (showMine && user?.id) return markers.filter((m) => m.userId === user.id);
//     return markers;
//   }, [markers, showMine, user?.id]);

//   const clusters = useMemo(() => {
//     const t = 0.01; // threshold degrees
//     const groups: { lat: number; lng: number; items: typeof filtered }[] = [] as any;
//     filtered.forEach((m) => {
//       const g = groups.find((gr) => Math.abs(gr.lat - m.latitude) < t && Math.abs(gr.lng - m.longitude) < t);
//       if (g) {
//         g.items.push(m);
//         // keep centroid simple
//         g.lat = (g.lat * (g.items.length - 1) + m.latitude) / g.items.length;
//         g.lng = (g.lng * (g.items.length - 1) + m.longitude) / g.items.length;
//       } else {
//         groups.push({ lat: m.latitude, lng: m.longitude, items: [m] });
//       }
//     });
//     return groups;
//   }, [filtered]);

//   const pickFromLibrary = async () => {
//     const res = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsMultipleSelection: true,
//       selectionLimit: 10,
//       quality: 1,
//     });
//     if (!res.canceled) {
//       const uris = res.assets.map((a) => a.uri).slice(0, 10);
//       setSelectedImages(uris);
//     }
//   };

//   const toggleSelect = (uri: string) => {
//     setSelectedImages((prev) => {
//       const exists = prev.includes(uri);
//       if (exists) return prev.filter((u) => u !== uri);
//       if (prev.length >= 10) return prev;
//       return [...prev, uri];
//     });
//   };

//   const canPost = selectedImages.length > 0 && placeName.trim().length > 0 && caption.trim().length > 0;

//   const submitPost = async () => {
//     if (!location || !canPost) return;
//     const now = Date.now();
//     setMarkers((prev) => {
//       const next = [
//         ...prev,
//         ...selectedImages.map((uri) => ({
//           id: now + Math.random(),
//           image: uri,
//           latitude: location.latitude,
//           longitude: location.longitude,
//           userId: user?.id,
//           createdAt: Date.now(),
//         })),
//       ];
//       AsyncStorage.setItem("tarps.posts", JSON.stringify(next));
//       return next;
//     });
//     setPostOpen(false);
//     setSelectedImages([]);
//     setCaption("");
//     setPlaceName("");
//   };

//   const loadRecents = async () => {
//     const perm = await MediaLibrary.requestPermissionsAsync();
//     if (!perm.granted) {
//       setRecents([]);
//       return;
//     }
//     const assets = await MediaLibrary.getAssetsAsync({ first: 50, mediaType: MediaLibrary.MediaType.photo, sortBy: MediaLibrary.SortBy.creationTime });
//     setRecents(assets.assets.map((a) => a.uri));
//   };

//   useEffect(() => {
//     if (postOpen) loadRecents();
//   }, [postOpen]);

//   if (!location) {
//     return (
//       <View style={styles.center}>
//         <Text>Loading map...</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={{ flex: 1 }}>
//       <StatusBar style="light" />
//       <MapView
//         style={{ flex: 1 }}
//         initialRegion={location}
//         mapType="satellite"
//         showsCompass={false}
//         showsPointsOfInterests={false}
//         showsBuildings={false}
//         toolbarEnabled={false}
//         zoomControlEnabled={false}
//       >
//         {clusters.map((c, idx) => {
//           const cover = c.items[0];
//           const count = c.items.length;
//           return (
//             <Marker key={idx} coordinate={{ latitude: c.lat, longitude: c.lng }} onPress={() => setPreview({ uri: cover.image })}>
//               <View style={[styles.markerContainer, isDark ? styles.markerDark : styles.markerLight]}>
//                 <ExpoImage source={{ uri: cover.image }} style={styles.markerImage} contentFit="cover" cachePolicy="none" />
//                 <View style={styles.countBadge}><Text style={styles.countText}>{count >= 1000 ? `${Math.floor(count/1000)}k` : `${count}`}</Text></View>
//               </View>
//               <View style={[styles.pointer, styles.pointerLight]} />
//             </Marker>
//           );
//         })}
//       </MapView>

//       <Modal visible={!!preview} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
//         <StatusBar hidden />
//         <Pressable style={styles.previewOverlay} onPress={() => setPreview(null)}>
//           <Pressable style={styles.previewContent} onPress={(e) => e.stopPropagation()}>
//             {preview && (
//               <ExpoImage source={{ uri: preview.uri }} style={styles.previewImage} contentFit="cover" />
//             )}
//             <View style={[styles.previewHeader, { paddingTop: insets.top + 6 }]}>
//               <Pressable style={styles.headerIcon} onPress={() => setPreview(null)}>
//                 <Ionicons name="close" size={20} color="#FFFFFF" />
//               </Pressable>
//               <View style={styles.headerCenter}>
//                 <Text style={styles.headerTitle}>Pool Area</Text>
//                 <Text style={styles.headerSub}>1 / 1</Text>
//               </View>
//               <Pressable style={styles.headerIcon}>
//                 <Ionicons name="ellipsis-vertical" size={18} color="#FFFFFF" />
//               </Pressable>
//             </View>

//             <View style={styles.previewTopRow}>
//               <View style={styles.userRow}>
//                 <View style={styles.userAvatar}><Ionicons name="person" size={18} color="#FFFFFF" /></View>
//                 <View>
//                   <Text style={styles.userName}>Isabella Garcia</Text>
//                   <Text style={styles.userTime}>2d ago</Text>
//                 </View>
//               </View>
//               <View style={styles.actionRow}>
//                 <Pressable style={styles.friendBtn}><Text style={styles.friendText}>Friend</Text></Pressable>
//                 <Pressable style={styles.followBtn}><Text style={styles.followText}>Follow</Text></Pressable>
//               </View>
//             </View>

//             <View style={styles.rightRail}>
//               <Pressable style={styles.railCircle}><Ionicons name="heart-outline" size={18} color="#FFFFFF" /></Pressable>
//               <Text style={styles.railCount}>412</Text>
//               <Pressable style={styles.railCircle}><Ionicons name="chatbubble-outline" size={18} color="#FFFFFF" /></Pressable>
//               <Text style={styles.railCount}>2</Text>
//               <Pressable style={styles.railCircle}><Ionicons name="share-social-outline" size={18} color="#FFFFFF" /></Pressable>
//             </View>

//             <View style={styles.previewBadge}><Text style={styles.previewBadgeText}>Preview</Text></View>

//           </Pressable>
//         </Pressable>
//       </Modal>

//       <View style={[styles.topBar, { top: insets.top + 8 }]}>
//         <View style={styles.leftButtons}>
//           <Pressable style={[styles.squareBtn, isDark ? styles.squareDark : styles.squareLight]}>
//             <Ionicons name="people-outline" size={18} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
//           </Pressable>
//           <Pressable style={[styles.squareBtn, isDark ? styles.squareDark : styles.squareLight]}>
//             <Ionicons name="send-outline" size={18} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
//           </Pressable>
//           <Pressable style={[styles.squareBtn, isDark ? styles.squareDark : styles.squareLight]} onPress={clearSavedPosts}>
//             <Ionicons name="trash-outline" size={18} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
//           </Pressable>
//         </View>
//         <Pressable style={[styles.myPostsBtn, isDark ? styles.myPostsDark : styles.myPostsLight]} onPress={() => setShowMine((s) => !s)}>
//           <Ionicons name="person" size={16} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
//           <Text style={[styles.myPostsText, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>{showMine ? "My Posts" : "My Posts"}</Text>
//         </Pressable>
//       </View>

//       <Pressable style={[styles.uploadButton]} onPress={() => setPostOpen(true)}>
//         <Ionicons name="add" size={26} color="#0a0a0a" />
//       </Pressable>

//       <Modal visible={postOpen} transparent animationType="fade" onRequestClose={() => setPostOpen(false)}>
//         <View style={styles.createOverlay}>
//           <View style={[styles.createSheet, isDark ? styles.sheetDark : styles.sheetLight]}>
//             <View style={styles.sheetHeader}>
//               <Text style={[styles.sheetTitle, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>Post Photo</Text>
//               <Pressable style={styles.headerIcon} onPress={() => setPostOpen(false)}>
//                 <Ionicons name="close" size={20} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
//               </Pressable>
//             </View>

//             <View style={{ flex: 1 }}>
//             <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }} nestedScrollEnabled>
//               <View style={styles.sectionHeaderRow}>
//                 <Text style={[styles.sectionTitle, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>Photos (up to 10)</Text>
//               </View>
//               <View style={styles.selectedGrid}>
//                 {selectedImages.map((uri, i) => (
//                   <View key={`${uri}-sel-${i}`} style={[styles.gridItem, styles.gridItemActive]}>
//                     <ExpoImage source={{ uri }} style={styles.gridImage} contentFit="cover" />
//                     <View style={styles.orderBadge}><Text style={styles.orderText}>{i + 1}</Text></View>
//                   </View>
//                 ))}
//               </View>
//               <View style={styles.sectionSubRow}>
//                 <Text style={[styles.sectionSub, { color: isDark ? "#9AA0A6" : "#666" }]}>Recents</Text>
//                 <Text style={[styles.sectionSub, { color: isDark ? "#9AA0A6" : "#666" }]}>{selectedImages.length}/10 selected</Text>
//               </View>
//               <ScrollView style={styles.galleryScroll} nestedScrollEnabled>
//                 <View style={styles.grid}>
//                   {recents.map((uri, i) => {
//                     const order = selectedImages.indexOf(uri);
//                     const active = order !== -1;
//                     return (
//                       <Pressable key={`${uri}-${i}`} style={[styles.gridItem, active && styles.gridItemActive]} onPress={() => toggleSelect(uri)}>
//                         <ExpoImage source={{ uri }} style={styles.gridImage} contentFit="cover" />
//                         {active && (
//                           <View style={styles.orderBadge}><Text style={styles.orderText}>{order + 1}</Text></View>
//                         )}
//                       </Pressable>
//                     );
//                   })}
//                 </View>
//               </ScrollView>

//               <Text style={[styles.helperText, { color: isDark ? "#9AA0A6" : "#666" }]}>Tap photos to select • Scroll to see more</Text>

//               <Text style={[styles.inputLabel, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>Location *</Text>
//               <View style={[styles.inputWrapper, isDark ? styles.inputDark : styles.inputLight]}>
//                 <Ionicons name="location-outline" size={16} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
//                 <TextInput
//                   value={placeName}
//                   onChangeText={setPlaceName}
//                   placeholder="Where was this photo taken?"
//                   placeholderTextColor={isDark ? "#888" : "#999"}
//                   style={[styles.textInput, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}
//                 />
//               </View>
//               <Text style={[styles.inputHint, { color: isDark ? "#9AA0A6" : "#666" }]}>e.g., Library, Student Center, Campus Quad</Text>

//               <Text style={[styles.inputLabel, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>Caption *</Text>
//               <View style={[styles.textAreaWrapper, isDark ? styles.inputDark : styles.inputLight]}>
//                 <TextInput
//                   value={caption}
//                   onChangeText={setCaption}
//                   placeholder="Share your thoughts about this moment..."
//                   placeholderTextColor={isDark ? "#888" : "#999"}
//                   style={[styles.textArea, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}
//                   multiline
//                 />
//               </View>
//             </ScrollView>
//             </View>

//             <View style={styles.sheetFooter}>
//               <Pressable style={[styles.cancelBtn]} onPress={() => setPostOpen(false)}>
//                 <Text style={styles.cancelText}>Cancel</Text>
//               </Pressable>
//               <Pressable disabled={!canPost} style={[styles.postBtn, !canPost && styles.postDisabled]} onPress={submitPost}>
//                 <Text style={styles.postText}>Post</Text>
//               </Pressable>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   center: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   uploadButton: {
//     position: "absolute",
//     bottom: 48,
//     right: 20,
//     backgroundColor: "#FFFFFF",
//     borderRadius: 28,
//     width: 56,
//     height: 56,
//     alignItems: "center",
//     justifyContent: "center",
//     shadowColor: "#000",
//     shadowOpacity: 0.2,
//     shadowRadius: 6,
//     shadowOffset: { width: 0, height: 4 },
//     elevation: 4,
//   },
//   createOverlay: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.6)",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingHorizontal: 16,
//   },
//   createSheet: {
//     width: "100%",
//     maxWidth: 520,
//     height: "85%",
//     borderRadius: 14,
//     overflow: "hidden",
//   },
//   sheetDark: { backgroundColor: "#0f1115", borderWidth: 1, borderColor: "#2a2e37" },
//   sheetLight: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E0E0E0" },
//   sheetHeader: {
//     height: 56,
//     paddingHorizontal: 14,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     borderBottomWidth: 1,
//     borderBottomColor: "#2a2e37",
//   },
//   sheetTitle: { fontSize: 18, fontWeight: "700" },
//   sectionHeaderRow: { paddingHorizontal: 14, paddingTop: 14 },
//   sectionTitle: { fontSize: 14, fontWeight: "700" },
//   sectionSub: { paddingHorizontal: 14, paddingTop: 8, fontSize: 12 },
//   grid: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     gap: 8,
//     paddingHorizontal: 14,
//     paddingVertical: 10,
//   },
//   gridItem: {
//     width: "48%",
//     aspectRatio: 1,
//     borderRadius: 12,
//     overflow: "hidden",
//     borderWidth: 2,
//     borderColor: "#2a2e37",
//   },
//   gridItemActive: { borderColor: "#FFFFFF", shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
//   gridImage: { width: "100%", height: "100%" },
//   galleryTile: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "#141922",
//   },
//   galleryText: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },
//   galleryScroll: { height: 220 },
//   helperText: { fontSize: 12, paddingHorizontal: 14 },
//   selectedGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 14, paddingTop: 10 },
//   orderBadge: { position: "absolute", left: 8, bottom: 8, backgroundColor: "#0a0a0a", width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
//   orderText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
//   sectionSubRow: { paddingHorizontal: 14, paddingTop: 8, flexDirection: "row", justifyContent: "space-between" },
//   inputLabel: { fontSize: 13, fontWeight: "700", paddingHorizontal: 14, paddingTop: 14 },
//   inputWrapper: {
//     marginTop: 8,
//     marginHorizontal: 14,
//     height: 44,
//     borderRadius: 10,
//     paddingHorizontal: 10,
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//     borderWidth: 1,
//   },
//   inputDark: { backgroundColor: "#0a0a0a", borderColor: "#2a2e37" },
//   inputLight: { backgroundColor: "#FFFFFF", borderColor: "#E0E0E0" },
//   textInput: { flex: 1, fontSize: 13 },
//   inputHint: { fontSize: 12, paddingHorizontal: 14, paddingTop: 6 },
//   textAreaWrapper: {
//     marginTop: 8,
//     marginHorizontal: 14,
//     borderRadius: 10,
//     borderWidth: 1,
//     height: 120,
//     paddingHorizontal: 10,
//     paddingVertical: 8,
//   },
//   textArea: { flex: 1, fontSize: 13 },
//   sheetFooter: {
//     flexDirection: "row",
//     justifyContent: "flex-end",
//     gap: 10,
//     padding: 14,
//     borderTopWidth: 1,
//     borderTopColor: "#2a2e37",
//   },
//   cancelBtn: {
//     height: 40,
//     paddingHorizontal: 18,
//     borderRadius: 10,
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "#2a2e37",
//   },
//   cancelText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
//   postBtn: {
//     height: 40,
//     paddingHorizontal: 18,
//     borderRadius: 10,
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "#3b82f6",
//   },
//   postDisabled: { backgroundColor: "#5a667a" },
//   postText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
//   markerContainer: {
//     width: 96,
//     height: 96,
//     backgroundColor: "#FFFFFF",
//     borderRadius: 16,
//     overflow: "visible",
//     borderWidth: 1,
//     borderColor: "#E0E0E0",
//     shadowColor: "#000",
//     shadowOpacity: 0.2,
//     shadowRadius: 10,
//     shadowOffset: { width: 0, height: 4 },
//   },
//   markerDark: { borderColor: "#333333", backgroundColor: "#1A1A1A" },
//   markerLight: { borderColor: "#E0E0E0", backgroundColor: "#FFFFFF" },
//   markerImage: {
//     width: "100%",
//     height: "100%",
//     borderRadius: 16,
//   },
//   countBadge: {
//     position: "absolute",
//     bottom: -10,
//     right: -10,
//     backgroundColor: "#FFFFFF",
//     width: 34,
//     height: 34,
//     borderRadius: 17,
//     alignItems: "center",
//     justifyContent: "center",
//     borderWidth: 1,
//     borderColor: "#E0E0E0",
//     shadowColor: "#000",
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//     shadowOffset: { width: 0, height: 3 },
//     zIndex: 2,
//   },
//   countText: { fontSize: 12, fontWeight: "700" },
//   pointer: {
//     width: 0,
//     height: 0,
//     borderLeftWidth: 8,
//     borderRightWidth: 8,
//     borderTopWidth: 12,
//     borderLeftColor: "transparent",
//     borderRightColor: "transparent",
//     alignSelf: "center",
//     marginTop: 4,
//   },
//   pointerDark: { borderTopColor: "#1A1A1A" },
//   pointerLight: { borderTopColor: "#FFFFFF" },
//   topBar: {
//     position: "absolute",
//     top: 20,
//     left: 16,
//     right: 16,
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   leftButtons: { flexDirection: "row", gap: 10 },
//   squareBtn: {
//     width: 44,
//     height: 44,
//     borderRadius: 12,
//     alignItems: "center",
//     justifyContent: "center",
//     borderWidth: 1,
//   },
//   squareDark: { backgroundColor: "#0a0a0a", borderColor: "#333333" },
//   squareLight: { backgroundColor: "#FFFFFF", borderColor: "#E0E0E0" },
//   myPostsBtn: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//     paddingHorizontal: 12,
//     height: 44,
//     borderRadius: 12,
//     borderWidth: 1,
//   },
//   myPostsDark: { backgroundColor: "#0a0a0a", borderColor: "#333333" },
//   myPostsLight: { backgroundColor: "#FFFFFF", borderColor: "#E0E0E0" },
//   myPostsText: { fontSize: 12, fontWeight: "700" },
//   previewOverlay: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.85)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   previewContent: {
//     width: "100%",
//     height: "100%",
//     borderRadius: 0,
//     overflow: "hidden",
//   },
//   previewImage: { width: "100%", height: "100%" },
//   closeBtn: {
//     position: "absolute",
//     top: 12,
//     left: 12,
//     backgroundColor: "rgba(0,0,0,0.6)",
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   previewHeader: {
//     position: "absolute",
//     top: 0,
//     left: 0,
//     right: 0,
//     height: 64,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: 14,
//   },
//   headerIcon: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "rgba(0,0,0,0.35)",
//   },
//   headerCenter: { alignItems: "center", gap: 2 },
//   headerTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
//   headerSub: { color: "#FFFFFF", opacity: 0.8, fontSize: 12 },
//   previewTopRow: {
//     position: "absolute",
//     top: 90,
//     left: 14,
//     right: 14,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//   },
//   userRow: { flexDirection: "row", alignItems: "center", gap: 10 },
//   userAvatar: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: "rgba(0,0,0,0.35)",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   userName: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
//   userTime: { color: "#FFFFFF", fontSize: 12, opacity: 0.85 },
//   actionRow: { flexDirection: "row", alignItems: "center", gap: 8 },
//   friendBtn: {
//     height: 32,
//     paddingHorizontal: 12,
//     borderRadius: 8,
//     backgroundColor: "#FFFFFF",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   friendText: { color: "#0a0a0a", fontSize: 12, fontWeight: "700" },
//   followBtn: {
//     height: 32,
//     paddingHorizontal: 12,
//     borderRadius: 8,
//     backgroundColor: "#1877F2",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   followText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
//   rightRail: {
//     position: "absolute",
//     right: 14,
//     top: 160,
//     alignItems: "center",
//     gap: 10,
//   },
//   railCircle: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: "rgba(0,0,0,0.35)",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   railCount: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
//   previewBadge: {
//     position: "absolute",
//     left: "50%",
//     top: "50%",
//     transform: [{ translateX: -40 }, { translateY: -12 }],
//     backgroundColor: "rgba(0,0,0,0.45)",
//     paddingHorizontal: 10,
//     height: 24,
//     borderRadius: 6,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   previewBadgeText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
// });
