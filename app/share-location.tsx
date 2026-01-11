import { api } from "@/api/client";
import { UrlConstants } from "@/constants/apiUrls";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
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
import uuid from "react-native-uuid";
import { toast } from "sonner-native";

const { width: screenWidth } = Dimensions.get('window');

export default function ShareLocationScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // State
  const [statusLocation, setStatusLocation] = useState("");
  const [statusActivity, setStatusActivity] = useState("");
  const [statusDuration, setStatusDuration] = useState("30 minutes");
  const [withPhoto, setWithPhoto] = useState(false);
  const [shareSelectedPhoto, setShareSelectedPhoto] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [recents, setRecents] = useState<MediaLibrary.Asset[]>([]);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [loadingLocSuggest, setLoadingLocSuggest] = useState(false);
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);
  const [locationJustSelected, setLocationJustSelected] = useState(false);

  const suggestions = ["Studying", "Eating", "Hanging out", "Working", "Exercising", "Shopping"];
  const durationOptions = ["15 minutes", "30 minutes", "1 hour", "2 hours", "4 hours", "Until I turn it off"];

  // Load recents when photo option is enabled
  useEffect(() => {
    if (withPhoto) loadRecents();
  }, [withPhoto]);

  // Location suggestions
  useEffect(() => {
    const q = statusLocation.trim();
    if (q.length === 0) {
      setLocationSuggestions([]);
      setShowLocationDropdown(false);
      return;
    }
    
    // Don't show dropdown if location was just selected
    if (locationJustSelected) {
      // Clear suggestions so they don't pop up on focus
      setLocationSuggestions([]);
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
  }, [statusLocation, locationJustSelected]);

  const loadRecents = async () => {
    try {
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) return;
      
      const assets = await MediaLibrary.getAssetsAsync({ 
        first: 99, 
        mediaType: MediaLibrary.MediaType.photo, 
        sortBy: MediaLibrary.SortBy.creationTime 
      });
      setRecents(assets.assets);
    } catch (error) {
      console.error('Error loading recents:', error);
    }
  };

  const pickLocationPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setShareSelectedPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking photo:', error);
    }
  };

  const handleShareStatus = async () => {
    if (!statusLocation.trim() || isSharing) return;
    
    setIsSharing(true);
    try {
      const form = new FormData();
      form.append("address", statusLocation.trim());
      
      // Send activity as caption (like the original implementation)
      if (statusActivity.trim().length > 0) {
        form.append("caption", statusActivity.trim());
      }
      
      // Add duration field
      form.append("duration", statusDuration);
      
      if (withPhoto && shareSelectedPhoto) {
        let resolvedUri = shareSelectedPhoto;
        
        // Handle ph:// URIs from iOS Photos
        if (shareSelectedPhoto.startsWith('ph://')) {
          try {
            // Find the asset to get more info
            const assets = await MediaLibrary.getAssetsAsync({ 
              first: 1000, 
              mediaType: MediaLibrary.MediaType.photo, 
              sortBy: MediaLibrary.SortBy.creationTime 
            });
            const asset = assets.assets.find(a => a.uri === shareSelectedPhoto);
            if (asset) {
              const info = await MediaLibrary.getAssetInfoAsync(asset.id);
              resolvedUri = (info as any)?.localUri || (info as any)?.uri || shareSelectedPhoto;
              console.log('Resolved ph:// URI:', { original: shareSelectedPhoto, resolved: resolvedUri });
            }
          } catch (error) {
            console.error('Error resolving ph:// URI:', error);
            // Continue with original URI as fallback
          }
        }
        
        const filename = `location_photo_${uuid.v4()}.jpg`;
        form.append("image", {
          uri: resolvedUri,
          name: filename,
          type: "image/jpeg",
        } as any);
        
        console.log('Adding image to form:', { uri: resolvedUri, name: filename });
      }

      console.log("ShareLocation:start", {
        address: statusLocation.trim(),
        caption: statusActivity.trim(),
        duration: statusDuration,
        withPhoto: withPhoto && !!shareSelectedPhoto,
        formData: {
          address: statusLocation.trim(),
          caption: statusActivity.trim() || undefined,
          duration: statusDuration,
          hasImage: withPhoto && !!shareSelectedPhoto
        }
      });

      const res = await api.post(`${UrlConstants.baseUrl}/tarps/upload/location`, form, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("ShareLocation:success", {
        status: res.status,
        data: res.data,
      });

      toast.success("Location shared!");
      
      // Reset form
      setStatusLocation("");
      setStatusActivity("");
      setStatusDuration("30 minutes");
      setWithPhoto(false);
      setShareSelectedPhoto(null);
      
      // Navigate back
      router.back();
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

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#000000" : "#FFFFFF" }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={isDark ? "#FFFFFF" : "#000000"} />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: isDark ? "#FFFFFF" : "#000000" }]}>
            Share Your Location
          </Text>
          <Text style={[styles.headerSubtitle, { color: isDark ? "#9AA0A6" : "#666" }]}>
            Let your friends know where you are on campus
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Location Input */}
          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, { color: isDark ? "#FFFFFF" : "#000000" }]}>
              Where are you?
            </Text>
            <View style={[styles.inputWrapper, isDark ? styles.inputDark : styles.inputLight]}>
              <Ionicons name="location-outline" size={16} color={isDark ? "#FFFFFF" : "#000000"} />
              <TextInput
                value={statusLocation}
                onChangeText={(text) => {
                  setStatusLocation(text);
                  setLocationJustSelected(false); // Reset flag when user types manually
                }}
                placeholder="Type or select a location"
                placeholderTextColor={isDark ? "#888" : "#999"}
                style={[styles.textInput, { color: isDark ? "#FFFFFF" : "#000000" }]}
                onFocus={() => {
                  // Show dropdown if there are suggestions and user focuses input
                  if (locationSuggestions.length > 0 && statusLocation.trim().length > 0) {
                    setShowLocationDropdown(true);
                  }
                }}
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
                        setLocationJustSelected(true);
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
          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, { color: isDark ? "#FFFFFF" : "#000000" }]}>
              What are you doing?
            </Text>
            <View style={[styles.inputWrapper, isDark ? styles.inputDark : styles.inputLight]}>
              <TextInput
                value={statusActivity}
                onChangeText={setStatusActivity}
                placeholder="e.g., studying, eating lunch, hanging out"
                placeholderTextColor={isDark ? "#888" : "#999"}
                style={[styles.textInput, { color: isDark ? "#FFFFFF" : "#000000" }]}
              />
            </View>
            <Text style={[styles.inputHint, { color: isDark ? "#9AA0A6" : "#666" }]}>
              Quick suggestions:
            </Text>
            <View style={styles.chipContainer}>
              {suggestions.map((s) => (
                <Pressable 
                  key={s} 
                  style={[
                    styles.chip, 
                    statusActivity === s && styles.chipActive, 
                    { borderColor: isDark ? "#333" : "#e0e0e0" }
                  ]}
                  onPress={() => setStatusActivity(s)}
                >
                  <Text style={[
                    styles.chipText, 
                    statusActivity === s && { color: "#FFF" }, 
                    { color: isDark ? "#FFF" : "#000" }
                  ]}>
                    {s}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Duration */}
          <View style={styles.inputSection}>
            <View style={styles.labelWithIcon}>
              <Ionicons name="time-outline" size={16} color={isDark ? "#FFFFFF" : "#000000"} />
              <Text style={[styles.inputLabel, { color: isDark ? "#FFFFFF" : "#000000" }]}>
                How long will you be here?
              </Text>
            </View>
            <Pressable 
              style={[styles.inputWrapper, isDark ? styles.inputDark : styles.inputLight, styles.dropdownTrigger]}
              onPress={() => setShowDurationDropdown(!showDurationDropdown)}
            >
              <Text style={{ color: isDark ? "#FFF" : "#000" }}>{statusDuration}</Text>
              <Ionicons 
                name={showDurationDropdown ? "chevron-up" : "chevron-down"} 
                size={16} 
                color={isDark ? "#888" : "#999"} 
              />
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
            
            <Text style={[styles.inputHint, { color: isDark ? "#9AA0A6" : "#666" }]}>
              Your location will automatically stop being shared after this time
            </Text>
          </View>

          {/* Photo Option */}
          <View style={styles.inputSection}>
            <View style={[styles.photoOption, isDark ? styles.inputDark : styles.inputLight]}>
              <View style={styles.photoOptionContent}>
                <View style={[styles.iconBox, { backgroundColor: isDark ? "#222" : "#f0f0f0" }]}>
                  <Ionicons name="camera-outline" size={20} color={isDark ? "#FFF" : "#000"} />
                </View>
                <View style={styles.photoOptionText}>
                  <Text style={[styles.photoOptionTitle, { color: isDark ? "#FFF" : "#000" }]}>
                    Share a photo with your location
                  </Text>
                  <Text style={[styles.photoOptionSubtitle, { color: isDark ? "#888" : "#666" }]}>
                    Let friends see where you are
                  </Text>
                </View>
              </View>
              <Pressable onPress={() => setWithPhoto(!withPhoto)}>
                <Ionicons 
                  name={withPhoto ? "checkbox" : "square-outline"} 
                  size={24} 
                  color={isDark ? "#FFF" : "#000"} 
                />
              </Pressable>
            </View>

            {withPhoto && (
              <View style={styles.photoSection}>
                {!shareSelectedPhoto ? (
                  <>
                    <View style={styles.recentsHeader}>
                      <Text style={[styles.recentsTitle, { color: isDark ? "#FFF" : "#000" }]}>
                        Recents
                      </Text>
                      <Pressable onPress={pickLocationPhoto}>
                        <Text style={[styles.seeAllText, { color: isDark ? "#FFF" : "#000" }]}>
                          See All
                        </Text>
                      </Pressable>
                    </View>
                    <ScrollView 
                      style={styles.galleryScrollView}
                      showsVerticalScrollIndicator={false}
                      nestedScrollEnabled={true}
                    >
                      <View style={styles.miniGalleryGrid}>
                        {recents.map((asset, i) => (
                          <Pressable 
                            key={asset.id ?? i} 
                            style={styles.miniGalleryItem} 
                            onPress={() => setShareSelectedPhoto(asset.uri)}
                          >
                            <ExpoImage 
                              source={{ uri: asset.uri }} 
                              style={styles.gridImage} 
                              contentFit="cover" 
                            />
                          </Pressable>
                        ))}
                      </View>
                    </ScrollView>
                  </>
                ) : (
                  <View style={styles.selectedPhotoContainer}>
                    <ExpoImage 
                      source={{ uri: shareSelectedPhoto }} 
                      style={styles.selectedPhoto} 
                      contentFit="cover" 
                    />
                    <Pressable 
                      style={styles.removePhotoBtn} 
                      onPress={() => setShareSelectedPhoto(null)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#FFF" />
                    </Pressable>
                    <Text style={styles.photoOverlayText}>
                      Photo will be shared with your location
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Privacy Card */}
          <View style={[styles.privacyCard, { 
            backgroundColor: isDark ? "#111" : "#f9f9f9", 
            borderColor: isDark ? "#333" : "#e0e0e0" 
          }]}>
            <View style={styles.privacyCardContent}>
              <Ionicons name="shield-checkmark-outline" size={24} color={isDark ? "#888" : "#666"} />
              <View style={styles.privacyCardText}>
                <Text style={[styles.privacyCardTitle, { color: isDark ? "#FFF" : "#000" }]}>
                  Share with
                </Text>
                <Text style={[styles.privacyCardSubtitle, { color: isDark ? "#888" : "#666" }]}>
                  All friends can see your location by default
                </Text>
              </View>
            </View>
            <Pressable 
              style={[styles.privacyBtn, { borderColor: isDark ? "#444" : "#ddd" }]}
              onPress={() => router.push('/location-privacy')}
            >
              <Ionicons name="eye-outline" size={14} color={isDark ? "#FFF" : "#000"} />
              <Text style={[styles.privacyBtnText, { color: isDark ? "#FFF" : "#000" }]}>
                Manage
              </Text>
            </Pressable>
          </View>

          <Text style={[styles.footerNote, { color: isDark ? "#888" : "#666" }]}>
            Location will be shared based on your privacy settings
          </Text>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: isDark ? "#333" : "#E0E0E0" }]}>
          <Pressable style={styles.cancelBtn} onPress={handleBack}>
            <Text style={[styles.cancelText, { color: isDark ? "#FFFFFF" : "#000000" }]}>
              Cancel
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.shareBtn,
              { backgroundColor: isDark ? "#E0E0E0" : "#0a0a0a" },
              (isSharing || !statusLocation.trim()) && styles.shareBtnDisabled
            ]}
            disabled={isSharing || !statusLocation.trim()}
            onPress={handleShareStatus}
          >
            {isSharing ? (
              <ActivityIndicator size="small" color={isDark ? "#000" : "#FFF"} />
            ) : (
              <>
                <Ionicons 
                  name="location-outline" 
                  size={16} 
                  color={isDark ? "#000" : "#FFF"} 
                />
                <Text style={[styles.shareText, { color: isDark ? "#000" : "#FFF" }]}>
                  Share Location
                </Text>
              </>
            )}
          </Pressable>
        </View>
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
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 24,
  },
  inputSection: {
    gap: 8,
    position: "relative",
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  labelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
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
    fontSize: 16,
  },
  dropdownTrigger: {
    justifyContent: "space-between",
  },
  inputHint: {
    fontSize: 12,
    marginTop: 4,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  chipText: {
    fontSize: 12,
    fontWeight: "500",
  },
  photoOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  photoOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  photoOptionText: {
    flex: 1,
  },
  photoOptionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  photoOptionSubtitle: {
    fontSize: 12,
  },
  photoSection: {
    marginTop: 12,
    gap: 12,
  },
  recentsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recentsTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: "500",
  },
  galleryScrollView: {
    maxHeight: 300,
  },
  miniGalleryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  miniGalleryItem: {
    width: (screenWidth - 48) / 3 - 4,
    height: (screenWidth - 48) / 3 - 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  selectedPhotoContainer: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
  },
  selectedPhoto: {
    width: "100%",
    height: 200,
  },
  removePhotoBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 16,
    padding: 8,
  },
  photoOverlayText: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  privacyCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  privacyCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  privacyCardText: {
    flex: 1,
  },
  privacyCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  privacyCardSubtitle: {
    fontSize: 12,
  },
  privacyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  privacyBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  footerNote: {
    fontSize: 12,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "600",
  },
  shareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  shareBtnDisabled: {
    opacity: 0.6,
  },
  shareText: {
    fontSize: 14,
    fontWeight: "600",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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