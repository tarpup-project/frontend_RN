import { api } from "@/api/client";
import { useTheme } from "@/contexts/ThemeContext";
import { usePostUploadStore } from "@/state/postUploadStore"; // Import store
import { Ionicons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import * as Location from "expo-location";
import * as MediaLibrary from "expo-media-library";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function EditPostScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  // Parse selected images from params
  const selectedImages = params.selectedImages ? JSON.parse(params.selectedImages as string) : [];

  // State
  const [processedImages, setProcessedImages] = useState<string[]>([]);
  const [imageDimensions, setImageDimensions] = useState<{ [key: string]: { width: number, height: number } }>({});
  const [placeName, setPlaceName] = useState("");
  const [caption, setCaption] = useState("");
  /* removed isUploadingPost */
  const { uploadPost, isUploading } = usePostUploadStore();
  const [postLocSuggestions, setPostLocSuggestions] = useState<string[]>([]);
  const [showPostLocDropdown, setShowPostLocDropdown] = useState(false);
  const [loadingPostSuggest, setLoadingPostSuggest] = useState(false);
  const [extractingGPS, setExtractingGPS] = useState(false);
  const [locationFromCurrent, setLocationFromCurrent] = useState(false);
  const [locationSelected, setLocationSelected] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isProcessingImages, setIsProcessingImages] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Process images on mount
  useEffect(() => {
    getCurrentLocation();
    processSelectedImages();
  }, []);

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

  const processSelectedImages = async () => {
    try {
      setIsProcessingImages(true);
      console.log('Processing selected images:', selectedImages);

      const processed = await Promise.all(
        selectedImages.map(async (uri: string) => {
          try {
            // First, resolve ph:// URIs if needed
            let resolvedUri = uri;
            if (uri.startsWith('ph://')) {
              // Find the asset to get more info
              const assets = await MediaLibrary.getAssetsAsync({
                first: 1000,
                mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
                sortBy: MediaLibrary.SortBy.creationTime
              });
              const asset = assets.assets.find(a => a.uri === uri);
              if (asset) {
                const info = await MediaLibrary.getAssetInfoAsync(asset.id);
                resolvedUri = (info as any)?.localUri || (info as any)?.uri || uri;
              }
            }

            // Convert to JPEG with compression and resize
            const manipulatedImage = await ImageManipulator.manipulateAsync(
              resolvedUri,
              [{ resize: { width: 1350 } }], // Resize to reasonable width for mobile/social
              {
                compress: 0.8, // 80% quality
                format: ImageManipulator.SaveFormat.JPEG,
              }
            );

            console.log('Processed image:', manipulatedImage.uri);
            return manipulatedImage.uri;
          } catch (error) {
            console.error('Error processing image:', uri, error);
            return uri; // Return original URI if processing fails
          }
        })
      );

      setProcessedImages(processed);

      // Get dimensions for each processed image
      const dimensions: { [key: string]: { width: number, height: number } } = {};
      await Promise.all(
        processed.map(async (uri) => {
          return new Promise<void>((resolve) => {
            Image.getSize(
              uri,
              (width, height) => {
                // Calculate container width based on image aspect ratio
                const maxHeight = screenHeight * 0.5; // Match imageSection height
                const aspectRatio = width / height;
                const containerWidth = Math.min(screenWidth * 0.9, maxHeight * aspectRatio);

                dimensions[uri] = { width: containerWidth, height: maxHeight };
                resolve();
              },
              (error) => {
                console.error('Error getting image size:', error);
                // Fallback dimensions
                dimensions[uri] = { width: screenWidth * 0.8, height: screenHeight * 0.5 };
                resolve();
              }
            );
          });
        })
      );

      setImageDimensions(dimensions);
      console.log('All images processed:', processed.length);
    } catch (error) {
      console.error('Error processing images:', error);
      setProcessedImages(selectedImages); // Fallback to original URIs
    } finally {
      setIsProcessingImages(false);
    }
  };

  const canPost = processedImages.length > 0 && placeName.trim().length > 0 && !isUploading;

  const handleBack = () => {
    router.back();
  };

  const submitPost = async () => {
    if (!currentLocation || processedImages.length === 0 || !placeName.trim() || isUploading) return;

    // Fire and forget - background upload
    uploadPost({
      selectedImages: processedImages,
      allMedia: [], // Images are already processed/resolved in this screen
      caption,
      placeName
    });

    // Immediate navigation back to feed
    // dismiss(2) pops EditPost and CreatePost to return to Tarps without reloading
    if (router.canDismiss()) {
      router.dismiss(2);
    } else {
      // Fallback if we can't dismiss (e.g. deep link)
      router.navigate("/(tabs)/tarps");
    }
  };

  // Location suggestions logic
  useEffect(() => {
    if (locationFromCurrent || locationSelected) {
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
  }, [placeName, locationFromCurrent, locationSelected]);

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
          setLocationSelected(true);
          setShowPostLocDropdown(false);
          setPostLocSuggestions([]);
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
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={isDark ? "#FFFFFF" : "#000000"} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: isDark ? "#FFFFFF" : "#000000" }]}>
          New post
        </Text>
        <Pressable
          style={[styles.headerButton, canPost ? styles.shareButtonActive : styles.shareButtonInactive]}
          onPress={submitPost}
          disabled={!canPost}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color={canPost ? "#FFFFFF" : (isDark ? "#FFFFFF" : "#000000")} />
          ) : (
            <Text style={[
              styles.shareButtonText,
              {
                opacity: canPost ? 1 : 0.5,
                color: canPost ? "#FFFFFF" : (isDark ? "#FFFFFF" : "#000000")
              }
            ]}>Share</Text>
          )}
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Image Display Section */}
          <View style={[styles.imageSection, { backgroundColor: isDark ? "#000000" : "#FFFFFF" }]}>
            {isProcessingImages ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color={isDark ? "#FFFFFF" : "#000000"} />
                <Text style={[styles.processingText, { color: isDark ? "#FFFFFF" : "#000000" }]}>
                  Processing images...
                </Text>
              </View>
            ) : processedImages.length === 1 ? (
              // Single image - full screen
              <View style={styles.singleImageContainer}>
                <Image
                  source={{ uri: processedImages[0] }}
                  style={styles.singleImage}
                  resizeMode="contain"
                />
              </View>
            ) : (
              // Multiple images - horizontal scroll with dynamic widths
              <View style={styles.multiImageContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.multiImageContent}
                  onMomentumScrollEnd={(event) => {
                    const scrollX = event.nativeEvent.contentOffset.x;
                    let currentX = 16; // Start with left padding
                    let foundIndex = 0;

                    for (let i = 0; i < processedImages.length; i++) {
                      const uri = processedImages[i];
                      const dimensions = imageDimensions[uri];
                      const imageWidth = dimensions?.width || screenWidth * 0.8;

                      if (scrollX >= currentX && scrollX < currentX + imageWidth + 16) {
                        foundIndex = i;
                        break;
                      }
                      currentX += imageWidth + 16; // Add image width + gap
                    }

                    setCurrentImageIndex(foundIndex);
                  }}
                  style={styles.imageScrollView}
                  decelerationRate="fast"
                  pagingEnabled={false}
                >
                  {processedImages.map((uri, index) => {
                    const dimensions = imageDimensions[uri];
                    const containerWidth = dimensions?.width || screenWidth * 0.8;
                    const containerHeight = dimensions?.height || screenHeight * 0.5;

                    return (
                      <View key={index} style={[styles.imageSlideWithGap, { width: containerWidth }]}>
                        <View style={[
                          styles.imageSlideContainer,
                          {
                            backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5",
                            width: containerWidth,
                            height: containerHeight
                          }
                        ]}>
                          <Image
                            source={{ uri }}
                            style={[styles.slideImage, { width: containerWidth, height: containerHeight }]}
                            resizeMode="contain"
                          />
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Selected Images Count */}
            <View style={styles.imageCountSection}>
              <Text style={[styles.imageCountText, { color: isDark ? "#FFFFFF" : "#000000" }]}>
                {processedImages.length} {processedImages.length === 1 ? 'photo' : 'photos'} selected
              </Text>
            </View>

            {/* Location Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: isDark ? "#FFFFFF" : "#000000" }]}>Location *</Text>
              <View style={{ position: "relative" }}>
                <View style={[styles.inputWrapper, isDark ? styles.inputDark : styles.inputLight]}>
                  <Ionicons name="location-outline" size={16} color={isDark ? "#FFFFFF" : "#000000"} />
                  <TextInput
                    value={placeName}
                    onChangeText={(text) => {
                      setPlaceName(text);
                      if (locationFromCurrent && text !== placeName) {
                        setLocationFromCurrent(false);
                      }
                      if (locationSelected) {
                        setLocationSelected(false);
                      }
                    }}
                    onFocus={() => {
                      setTimeout(() => {
                        scrollViewRef.current?.scrollToEnd({ animated: true });
                      }, 100);
                    }}
                    placeholder="Where was this photo taken?"
                    placeholderTextColor={isDark ? "#888" : "#999"}
                    style={[styles.textInput, { color: isDark ? "#FFFFFF" : "#000000" }]}
                    editable={!extractingGPS}
                  />
                  {extractingGPS && (
                    <ActivityIndicator size="small" color={isDark ? "#FFFFFF" : "#000000"} />
                  )}
                </View>

                {extractingGPS && (
                  <Text style={[styles.inputHint, { color: isDark ? "#9AA0A6" : "#666" }]}>
                    Getting your current location...
                  </Text>
                )}

                {!extractingGPS && locationFromCurrent && placeName && (
                  <Text style={[styles.inputHint, { color: isDark ? "#9AA0A6" : "#666" }]}>
                    Location set to your current location. You can edit this if needed.
                  </Text>
                )}

                {!extractingGPS && (
                  <Pressable
                    style={[styles.currentLocationBtn, isDark ? styles.currentLocationBtnDark : styles.currentLocationBtnLight]}
                    onPress={useCurrentLocation}
                  >
                    <Ionicons name="navigate-outline" size={14} color={isDark ? "#FFFFFF" : "#000000"} />
                    <Text style={[styles.currentLocationBtnText, { color: isDark ? "#FFFFFF" : "#000000" }]}>
                      Use Current Location
                    </Text>
                  </Pressable>
                )}

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
                            setLocationFromCurrent(false);
                            setLocationSelected(true);
                            setShowPostLocDropdown(false);
                            setPostLocSuggestions([]);
                          }}
                        >
                          <Text style={{ color: isDark ? "#FFF" : "#000", fontSize: 13 }}>{option}</Text>
                        </Pressable>
                      ))
                    )}
                  </View>
                )}
              </View>
            </View>

            {/* Caption Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: isDark ? "#FFFFFF" : "#000000" }]}>Caption</Text>
              <View style={[styles.textAreaWrapper, isDark ? styles.inputDark : styles.inputLight]}>
                <TextInput
                  value={caption}
                  onChangeText={setCaption}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 100);
                  }}
                  placeholder="Write a caption..."
                  placeholderTextColor={isDark ? "#888" : "#999"}
                  style={[styles.textArea, { color: isDark ? "#FFFFFF" : "#000000" }]}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>
        </ScrollView>
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
  shareButtonActive: {
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  shareButtonInactive: {
    backgroundColor: "transparent",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  imageSection: {
    minHeight: screenHeight * 0.4, // Minimum height instead of fixed
    maxHeight: screenHeight * 0.5, // Maximum height
    backgroundColor: "transparent", // Use theme-based background instead
  },
  processingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  processingText: {
    fontSize: 16,
    fontWeight: "500",
  },
  singleImageContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  singleImage: {
    width: screenWidth,
    height: "100%",
  },
  multiImageContainer: {
    flex: 1,
    position: "relative",
  },
  imageScrollView: {
    flex: 1,
  },
  multiImageContent: {
    paddingLeft: 16, // Left padding for first image
    paddingRight: 16, // Right padding for last image
  },
  imageSlideWithGap: {
    marginRight: 16, // Gap between images
  },
  imageSlideContainer: {
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  imageSlide: {
    width: screenWidth,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  slideImage: {
    flex: 1,
  },
  formSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  imageCountSection: {
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  imageCountText: {
    fontSize: 14,
    fontWeight: "600",
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