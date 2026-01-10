import { api } from "@/api/client";
import { UrlConstants } from "@/constants/apiUrls";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { PanGestureHandler, PanGestureHandlerGestureEvent, State } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function CreatePostScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [headerHeight, setHeaderHeight] = useState(0);

  // State
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [allMedia, setAllMedia] = useState<MediaLibrary.Asset[]>([]);
  const [placeName, setPlaceName] = useState("");
  const [caption, setCaption] = useState("");
  const [isUploadingPost, setIsUploadingPost] = useState(false);
  const [postLocSuggestions, setPostLocSuggestions] = useState<string[]>([]);
  const [showPostLocDropdown, setShowPostLocDropdown] = useState(false);
  const [loadingPostSuggest, setLoadingPostSuggest] = useState(false);
  const [extractingGPS, setExtractingGPS] = useState(false);
  const [locationFromCurrent, setLocationFromCurrent] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isLoadingMedia, setIsLoadingMedia] = useState(true);

  // Animation values for drag-to-expand
  const galleryTranslateY = useRef(new Animated.Value(0)).current;
  const galleryHeight = useRef(new Animated.Value(screenHeight * 0.5)).current;
  const previewOpacity = useRef(new Animated.Value(1)).current;
  const dragY = useRef(0);
  const [isGalleryExpanded, setIsGalleryExpanded] = useState(false);
  const lastScrollY = useRef(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const previewScale = useRef(new Animated.Value(1)).current;
  const panX = useRef(new Animated.Value(0)).current; // For horizontal panning
  const panY = useRef(new Animated.Value(0)).current; // For vertical panning

  const toggleZoom = () => {
    const to = isZoomed ? 1 : 1.2; // Reduced from 2 to 1.5 for more moderate zoom
    
    // Reset pan position when toggling zoom
    Animated.parallel([
      Animated.timing(previewScale, {
        toValue: to,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false, // Changed to false for pan support
      }),
      Animated.timing(panX, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(panY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start(() => setIsZoomed(!isZoomed));
  };

  // Pan gesture handlers for preview image
  const onPanGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: panX, translationY: panY } }],
    { useNativeDriver: false }
  );

  const onPanHandlerStateChange = (event: PanGestureHandlerGestureEvent) => {
    if (event.nativeEvent.state === State.END) {
      // Constrain pan within reasonable bounds when zoomed
      if (isZoomed) {
        const maxPan = 50; // Maximum pan distance
        
        Animated.parallel([
          Animated.spring(panX, {
            toValue: Math.max(-maxPan, Math.min(maxPan, event.nativeEvent.translationX)),
            useNativeDriver: false,
            tension: 100,
            friction: 8,
          }),
          Animated.spring(panY, {
            toValue: Math.max(-maxPan, Math.min(maxPan, event.nativeEvent.translationY)),
            useNativeDriver: false,
            tension: 100,
            friction: 8,
          }),
        ]).start();
      } else {
        // Reset to center if not zoomed
        Animated.parallel([
          Animated.spring(panX, {
            toValue: 0,
            useNativeDriver: false,
            tension: 100,
            friction: 8,
          }),
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: false,
            tension: 100,
            friction: 8,
          }),
        ]).start();
      }
    }
  };
  const animateExpand = () => {
    if (isGalleryExpanded) return;
    Animated.parallel([
      Animated.timing(galleryHeight, {
        toValue: Math.max(0, screenHeight - headerHeight),
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(previewOpacity, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start(() => {
      setIsGalleryExpanded(true);
    });
  };
  const animateCollapse = () => {
    Animated.parallel([
      Animated.timing(galleryHeight, {
        toValue: screenHeight * 0.5,
        duration: 500,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(previewOpacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start(() => {
      setIsGalleryExpanded(false);
    });
  };

  // Load all media on mount
  useEffect(() => {
    getCurrentLocation();
    loadAllMedia();
  }, []);

  // Debug: Log when media changes
  useEffect(() => {
    console.log('Media updated:', allMedia.length, 'items');
    if (allMedia.length > 0) {
      console.log('First item:', allMedia[0]);
      console.log('First item URI:', allMedia[0].uri);
    }
  }, [allMedia]);


  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const current = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });
    } catch (error) {
      console.log('Error getting current location:', error);
    }
  };

  const loadAllMedia = async () => {
    try {
      setIsLoadingMedia(true);
      console.log('Loading all media...');
      
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) {
        console.log('Media library permission not granted');
        setAllMedia([]);
        setIsLoadingMedia(false);
        return;
      }
      
      // Load all photos
      const photoAssets = await MediaLibrary.getAssetsAsync({ 
        first: 1000, 
        mediaType: MediaLibrary.MediaType.photo, 
        sortBy: MediaLibrary.SortBy.creationTime 
      });
      console.log('Loaded photos:', photoAssets.assets.length);
      
      // Load all videos
      const videoAssets = await MediaLibrary.getAssetsAsync({ 
        first: 200, 
        mediaType: MediaLibrary.MediaType.video, 
        sortBy: MediaLibrary.SortBy.creationTime 
      });
      console.log('Loaded videos:', videoAssets.assets.length);
      
      // Combine and sort by creation time (newest first)
      const combined = [...photoAssets.assets, ...videoAssets.assets];
      combined.sort((a, b) => b.creationTime - a.creationTime);
      
      console.log('Total media items:', combined.length);
      setAllMedia(combined);
      
    } catch (error) {
      console.error('Error loading media:', error);
      setAllMedia([]);
    } finally {
      setIsLoadingMedia(false);
    }
  };

  // Drag gesture handler
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: new Animated.Value(0) } }],
    { useNativeDriver: false }
  );

  const onHandlerStateChange = (event: PanGestureHandlerGestureEvent) => {
    if (event.nativeEvent.state === State.BEGAN) {
      dragY.current = event.nativeEvent.translationY;
    }
    
    if (event.nativeEvent.state === State.END) {
      const { translationY, velocityY } = event.nativeEvent;
      const currentPosition = screenHeight * 0.5 + translationY;
      
      // Determine if should expand to full screen or snap back
      const shouldExpand = translationY < -100 || velocityY < -500;
      
      if (shouldExpand) {
        animateExpand();
      } else {
        animateCollapse();
      }
      
      // Reset translation
      galleryTranslateY.setValue(0);
    }
  };

  const handleImagePress = (uri: string, index: number) => {
    // Reset pan position when changing images
    panX.setValue(0);
    panY.setValue(0);
    
    setSelectedImages((prev) => {
      const exists = prev.includes(uri);
      if (exists) {
        const next = prev.filter((u) => u !== uri);
        // When deselecting, the preview will automatically show the last remaining selected image
        // No need to manually update previewIndex since we're using selectedImages[selectedImages.length - 1]
        return next;
      } else {
        if (prev.length >= 10) return prev;
        // When selecting, the new image becomes the last selected (and thus previewed)
        return [...prev, uri];
      }
    });
  };

  /* removed: toggleSelect */

  const canPost = selectedImages.length > 0 && placeName.trim().length > 0 && caption.trim().length > 0 && !isUploadingPost;
  const canProceed = selectedImages.length > 0;

  const handleNext = async () => {
    if (selectedImages.length > 0) {
      // Navigate to edit-post screen with selected images
      router.push({
        pathname: "/edit-post",
        params: {
          selectedImages: JSON.stringify(selectedImages)
        }
      });
    }
  };

  const handleBack = () => {
    router.back();
  };

  const submitPost = async () => {
    if (!currentLocation || selectedImages.length === 0 || !placeName.trim() || !caption.trim() || isUploadingPost) return;
    
    try {
      setIsUploadingPost(true);

      const resolvedUris = await Promise.all(
        selectedImages.map(async (uri) => {
          if (typeof uri === "string" && uri.startsWith("ph://")) {
            const asset = allMedia.find((a) => a.uri === uri);
            if (asset) {
              try {
                const info = await MediaLibrary.getAssetInfoAsync(asset.id);
                return (info as any)?.localUri || (info as any)?.uri || uri;
              } catch (e) {
                return uri;
              }
            }
          }
          return uri;
        })
      );

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

      const res = await api.post(UrlConstants.uploadTarps, form, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Posted successfully");
      router.back();
    } catch (e: any) {
      toast.error("Failed to post photo");
    } finally {
      setIsUploadingPost(false);
    }
  };

  // Location suggestions logic (keeping existing functionality)
  useEffect(() => {
    if (locationFromCurrent || !showForm) {
      setPostLocSuggestions([]);
      setShowPostLocDropdown(false);
      return;
    }
    
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
  }, [placeName, locationFromCurrent, showForm]);

  const useCurrentLocation = async () => {
    if (!currentLocation) {
      toast.error("Current location not available. Please check location permissions.");
      return;
    }
    
    setExtractingGPS(true);
    try {
      const { latitude, longitude } = currentLocation;
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      
      if (reverseGeocode && reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        let locationString = '';
        if (address.name) locationString += address.name;
        if (address.street) {
          if (locationString) locationString += ', ';
          locationString += address.street;
        }
        if (address.city) {
          if (locationString) locationString += ', ';
          locationString += address.city;
        }
        if (address.region) {
          if (locationString) locationString += ', ';
          locationString += address.region;
        }
        if (address.country) {
          if (locationString) locationString += ', ';
          locationString += address.country;
        }
        
        if (locationString) {
          setPlaceName(locationString);
          setLocationFromCurrent(true);
          toast.success("Location updated to your current location");
        } else {
          toast.error("Could not determine current location");
        }
      } else {
        toast.error("Could not determine current location");
      }
    } catch (error) {
      toast.error("Failed to get current location");
    } finally {
      setExtractingGPS(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#000000" : "#FFFFFF" }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      >
        <Pressable style={styles.headerButton} onPress={handleBack}>
          <Ionicons name={showForm ? "arrow-back" : "close"} size={24} color={isDark ? "#FFFFFF" : "#000000"} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: isDark ? "#FFFFFF" : "#000000" }]}>
          Select photos
        </Text>
        <Pressable 
          style={[styles.headerButton, canProceed ? styles.nextButtonActive : styles.nextButtonInactive]}
          onPress={handleNext}
          disabled={!canProceed}
        >
          <Text style={[styles.nextButtonText, { opacity: canProceed ? 1 : 0.5 }]}>Next</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Main Image Preview - Only show when not in form mode */}
            {!showForm && (
              <Animated.View 
                style={[
                  styles.imagePreview,
                  {
                    opacity: previewOpacity,
                  }
                ]}
              >
                {allMedia.length > 0 ? (
                  <PanGestureHandler
                    onGestureEvent={onPanGestureEvent}
                    onHandlerStateChange={onPanHandlerStateChange}
                    enabled={isZoomed} // Only enable panning when zoomed
                  >
                    <Animated.View style={styles.panContainer}>
                      <Animated.Image 
                        source={{ uri: selectedImages.length > 0 ? selectedImages[selectedImages.length - 1] : (allMedia[0]?.uri || '') }} 
                        style={[
                          styles.previewImage, 
                          { 
                            transform: [
                              { scale: previewScale },
                              { translateX: panX },
                              { translateY: panY }
                            ] 
                          }
                        ]} 
                        resizeMode={isZoomed ? "cover" : "contain"}
                        onError={(error: any) => {
                          console.log('Preview image error:', error.nativeEvent, 'URI:', selectedImages.length > 0 ? selectedImages[selectedImages.length - 1] : (allMedia[0]?.uri || ''));
                        }}
                        onLoad={() => {
                          console.log('Preview image loaded successfully');
                        }}
                      />
                    </Animated.View>
                  </PanGestureHandler>
                ) : (
                  <View style={[styles.placeholderImage, { backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5" }]}>
                    <Ionicons name="image-outline" size={48} color={isDark ? "#666" : "#999"} />
                    <Text style={[styles.placeholderText, { color: isDark ? "#666" : "#999" }]}>
                      Loading media...
                    </Text>
                  </View>
                )}
                
                {/* Image counter */}
                {selectedImages.length > 0 && (
                  <View style={styles.imageCounter}>
                    <Text style={styles.imageCounterText}>{selectedImages.length} selected</Text>
                  </View>
                )}

                {/* Zoom toggle - moved to gallery header */}
              </Animated.View>
            )}

        {/* Draggable Gallery Section */}
        {!showForm && (
          <PanGestureHandler
            onGestureEvent={onGestureEvent}
            onHandlerStateChange={onHandlerStateChange}
          >
            <Animated.View 
              style={[
                styles.draggableGallery,
                {
                  transform: [{ translateY: galleryTranslateY }],
                  height: galleryHeight,
                  backgroundColor: isDark ? "#000000" : "#FFFFFF",
                  borderWidth: 1, // Temporary border to see the component
                  borderColor: isDark ? "#333" : "#DDD",
                }
              ]}
            >
              {/* Drag Handle */}
              <View style={styles.dragHandle}>
                <View style={[styles.dragIndicator, { backgroundColor: isDark ? "#666" : "#CCC" }]} />
              </View>

              {/* Gallery Header */}
              <View style={styles.galleryHeader}>
                <Text style={[styles.galleryTitle, { color: isDark ? "#FFFFFF" : "#000000" }]}>
                  {isLoadingMedia ? "Loading..." : `All Media (${allMedia.length})`}
                </Text>
                <View style={styles.galleryHeaderRight}>

                  {/* Zoom Button */}
                  {allMedia.length > 0 && (
                    <Pressable 
                      style={[styles.zoomButton, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }]} 
                      onPress={toggleZoom}
                    >
                      <Ionicons 
                        name={isZoomed ? "contract-outline" : "expand-outline"} 
                        size={18} 
                        color={isDark ? "#FFFFFF" : "#000000"} 
                      />
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Media Grid */}
              <ScrollView 
                style={styles.mediaGrid}
                contentContainerStyle={styles.gridContentContainer}
                showsVerticalScrollIndicator={false}
                onScrollBeginDrag={(event) => {
                  const y = event.nativeEvent.contentOffset.y;
                  lastScrollY.current = y;
                  if (!isGalleryExpanded && y >= 0) {
                    animateExpand();
                  }
                }}
                onScrollEndDrag={(event) => {
                  if (!isGalleryExpanded) return;
                  const scrollY = event.nativeEvent.contentOffset.y;
                  const viewH = event.nativeEvent.layoutMeasurement.height;
                  const contentH = event.nativeEvent.contentSize.height;
                  const isAtBottom = scrollY + viewH >= contentH - 10;
                  if (isAtBottom) {
                    animateCollapse();
                  }
                }}
                onMomentumScrollEnd={(event) => {
                  if (!isGalleryExpanded) return;
                  const scrollY = event.nativeEvent.contentOffset.y;
                  const viewH = event.nativeEvent.layoutMeasurement.height;
                  const contentH = event.nativeEvent.contentSize.height;
                  const isAtBottom = scrollY + viewH >= contentH - 10;
                  if (isAtBottom) {
                    animateCollapse();
                  }
                }}
                onScroll={(event) => {
                  // Removed automatic preview update on scroll
                  // Preview now only updates when user selects an image
                }}
                scrollEventThrottle={16}
              >
                {isLoadingMedia ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={isDark ? "#FFFFFF" : "#000000"} />
                    <Text style={[styles.loadingText, { color: isDark ? "#666" : "#999" }]}>
                      Loading your photos and videos...
                    </Text>
                  </View>
                ) : allMedia.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="images-outline" size={48} color={isDark ? "#666" : "#999"} />
                    <Text style={[styles.emptyStateText, { color: isDark ? "#666" : "#999" }]}>
                      No photos or videos found
                    </Text>
                    <Text style={[styles.emptyStateSubtext, { color: isDark ? "#888" : "#BBB" }]}>
                      Check console logs for debugging info
                    </Text>
                  </View>
                ) : (
                  <View style={styles.gridContainer}>
                    {allMedia.map((asset, i) => {
                      const uri = asset.uri;
                      const order = selectedImages.indexOf(uri);
                      const active = order !== -1;
                      const isPreview = selectedImages.length > 0 && uri === selectedImages[selectedImages.length - 1]; // Preview is last selected image
                      const isVideo = asset.mediaType === MediaLibrary.MediaType.video;
                      
                      return (
                        <Pressable 
                          key={`${asset.id}-${i}`} 
                          style={[
                            styles.gridItem, 
                            active && styles.gridItemActive,
                            isPreview && !active && styles.gridItemPreview
                          ]} 
                          onPress={() => handleImagePress(uri, i)}
                        >
                          <Image 
                            source={{ uri }} 
                            style={styles.gridImage}
                            resizeMode="cover"
                            onError={(error: any) => {
                              console.log(`Grid image error for ${i}:`, error.nativeEvent, 'URI:', uri);
                            }}
                            onLoad={() => {
                              if (i < 5) console.log(`Grid image ${i} loaded successfully`);
                            }}
                          />
                          
                          {/* Video indicator */}
                          {isVideo && (
                            <View style={styles.videoIndicator}>
                              <Ionicons name="play" size={16} color="#FFFFFF" />
                              {asset.duration && (
                                <Text style={styles.videoDuration}>
                                  {Math.floor(asset.duration / 60)}:{(asset.duration % 60).toFixed(0).padStart(2, '0')}
                                </Text>
                              )}
                            </View>
                          )}
                          
                          {active && (
                            <View style={styles.orderBadge}>
                              <Text style={styles.orderText}>{order + 1}</Text>
                            </View>
                          )}
                          {isPreview && !active && (
                            <View style={styles.previewOverlay}>
                              <View style={styles.previewBorder} />
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </ScrollView>
            </Animated.View>
          </PanGestureHandler>
        )}

        {/* Form section removed - now handled in edit-post screen */}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  nextButtonActive: {
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  nextButtonInactive: {
    backgroundColor: "transparent",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  imagePreview: {
    width: screenWidth,
    height: screenHeight * 0.5,
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  panContainer: {
    width: "100%",
    height: "100%",
    overflow: "hidden", // Prevent image from going outside bounds
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: "500",
  },
  imageCounter: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  draggableGallery: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: "hidden", // Ensure content doesn't overflow
  },
  dragHandle: {
    alignItems: "center",
    paddingVertical: 8,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  galleryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  galleryTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  galleryHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dragHint: {
    fontSize: 12,
    fontStyle: "italic",
  },
  mediaGrid: {
    flex: 1,
    paddingHorizontal: 16,
  },
  gridContentContainer: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 32,
    marginTop: 8,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 2,
  },
  gridItem: {
    width: (screenWidth - 38) / 3,
    height: (screenWidth - 38) / 3,
    borderRadius: 4,
    overflow: "hidden",
    position: "relative",
  },
  gridItemActive: {
    borderWidth: 2,
    borderColor: "#3b82f6",
  },
  gridItemPreview: {
    borderWidth: 2,
    borderColor: "#FFFFFF",
    opacity: 0.8,
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  orderBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#3b82f6",
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  orderText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  previewOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 4,
  },
  previewBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  videoIndicator: {
    position: "absolute",
    bottom: 4,
    left: 4,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  videoDuration: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  formSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  selectedImagesPreview: {
    marginBottom: 16,
  },
  selectedImagesScroll: {
    flexDirection: "row",
  },
  selectedImageItem: {
    marginRight: 8,
    position: "relative",
  },
  selectedImageThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  selectedImageBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#3b82f6",
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedImageNumber: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  zoomButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  inputDark: {
    backgroundColor: "#1A1A1A",
    borderColor: "#333333",
  },
  inputLight: {
    backgroundColor: "#F5F5F5",
    borderColor: "#E0E0E0",
  },
  textInput: {
    flex: 1,
    fontSize: 14,
  },
  inputHint: {
    fontSize: 12,
    marginTop: 4,
  },
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
  textAreaWrapper: {
    borderRadius: 8,
    borderWidth: 1,
    height: 100,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  textArea: {
    flex: 1,
    fontSize: 14,
  },
  dropdownList: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    borderRadius: 8,
    borderWidth: 1,
    zIndex: 1000,
    overflow: "hidden",
    marginTop: 4,
  },
  dropdownDark: {
    backgroundColor: "#1A1A1A",
    borderColor: "#333333",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  dropdownLight: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dropdownItemDark: {
    borderBottomColor: "#333333",
  },
  dropdownItemLight: {
    borderBottomColor: "#F0F0F0",
  },
});
