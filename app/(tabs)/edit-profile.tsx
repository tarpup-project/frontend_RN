import { api } from "@/api/client";
import Header from "@/components/Header";
import { Loader } from "@/components/Loader";
import { Text } from "@/components/Themedtext";
import { UrlConstants } from "@/constants/apiUrls";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuthStore } from "@/state/authStore";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { toast } from "sonner-native";

interface FormData {
  fullName: string;
  bio: string;
  major: string;
  year: string;
  interests: string[];
  prefs: Array<{ category: string; isPref: boolean }>;
}

const EditProfile = () => {
  const { isDark } = useTheme();
  const { user, setUser } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [newInterest, setNewInterest] = useState("");
  const interestInputRef = useRef<TextInput>(null);

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    bio: "",
    major: "",
    year: "Select year",
    interests: [],
    prefs: [],
  });

  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
    },
    text: {
      color: isDark ? "#FFFFFF" : "#000000",
    },
    subtitle: {
      color: isDark ? "#CCCCCC" : "#666666",
    },
    card: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    input: {
      backgroundColor: isDark ? "#0A0A0A" : "#F5F5F5",
      borderColor: isDark ? "#333333" : "#E0E0E0",
      color: isDark ? "#FFFFFF" : "#000000",
    },
    changePhotoButton: {
      backgroundColor: isDark ? "#FFFFFF" : "#000000",
    },
    changePhotoText: {
      color: isDark ? "#000000" : "#FFFFFF",
    },
    addButtonIcon: {
      color: isDark ? "#000000" : "#FFFFFF",
    },
  };

  const yearOptions = ["Freshman", "Sophomore", "Junior", "Senior", "Graduate"];

  const suggestedInterests = [
    "Music",
    "Sports",
    "Reading",
    "Cooking",
    "Travel",
    "Photography",
    "Art",
    "Fitness",
  ];

  const lookingForOptions = [
    "Study Partners",
    "Roommates",
    "Ride Shares",
    "Sports Partners",
    "Event Buddies",
    "Dating",
    "Marketplace Deals",
    "Gaming Friends",
  ];

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fname && user.lname ? `${user.fname} ${user.lname}` : "",
        bio: user.bio || "",
        major: user.major || "",
        year: user.year || "Select year",
        interests: user.interests || [],
        prefs: user.prefs || [],
      });

      if (user.bgUrl) {
        setImageUri(user.bgUrl);
      }
    }
  }, [user]);

  const handleImagePicker = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        toast.error("Permission to access camera roll is required!");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      toast.error("Failed to pick image");
      console.error("Image picker error:", error);
    }
  };

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const removeInterest = (interestToRemove: string) => {
    updateFormData(
      "interests",
      formData.interests.filter((interest) => interest !== interestToRemove)
    );
  };

  const addInterest = (interest: string) => {
    const trimmedInterest = interest.trim();
    if (trimmedInterest && !formData.interests.includes(trimmedInterest)) {
      updateFormData("interests", [...formData.interests, trimmedInterest]);
    }
  };

  const handleAddInterest = () => {
    if (newInterest.trim()) {
      addInterest(newInterest);
      setNewInterest("");
      interestInputRef.current?.clear();
    }
  };

  const toggleLookingFor = (option: string) => {
    const currentPrefs = [...formData.prefs];
    const existingIndex = currentPrefs.findIndex(
      (pref) => pref.category === option
    );

    if (existingIndex >= 0) {
      currentPrefs[existingIndex].isPref = !currentPrefs[existingIndex].isPref;
    } else {
      currentPrefs.push({ category: option, isPref: true });
    }

    updateFormData("prefs", currentPrefs);
  };

  const isLookingForSelected = (option: string) => {
    return formData.prefs.some(
      (pref) => pref.category === option && pref.isPref
    );
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);

      const uploadFormData = new FormData();

      if (formData.fullName) {
        uploadFormData.append("fullName", formData.fullName);
      }
      if (formData.bio) {
        uploadFormData.append("bio", formData.bio);
      }
      if (formData.major) {
        uploadFormData.append("major", formData.major);
      }
      if (formData.year && formData.year !== "Select year") {
        uploadFormData.append("year", formData.year);
      }
      if (formData.interests.length > 0) {
        uploadFormData.append("interests", JSON.stringify(formData.interests));
      }
      if (formData.prefs.length > 0) {
        uploadFormData.append("prefs", JSON.stringify(formData.prefs));
      }

      // Handle image upload if there's a new image
      if (imageUri && imageUri !== user?.bgUrl) {
        const filename = imageUri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename || "");
        const type = match ? `image/${match[1]}` : "image/jpeg";

        uploadFormData.append("image", {
          uri: imageUri,
          name: filename || "profile.jpg",
          type,
        } as any);
      }

      const response = await api.post(
        UrlConstants.editProfile,
        uploadFormData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Update user in auth store
      setUser(response.data.data);

      toast.success("Profile updated successfully!");
      router.back();
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast.error(error?.response?.data?.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      "Discard Changes?",
      "Are you sure you want to discard your changes?",
      [
        { text: "Keep Editing", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: () => router.back() },
      ]
    );
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Header />

      <ScrollView style={styles.content}>
        {/* Back Button */}
        <Pressable
          style={styles.backButton}
          onPress={() => router.push("/profile")}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color={dynamicStyles.text.color}
          />
          <Text style={[styles.backText, dynamicStyles.text]}>
            Back to Profile
          </Text>
        </Pressable>

        {/* Profile Photo Section */}
        <View style={[styles.photoSection, dynamicStyles.card]}>
          <View style={styles.photoRow}>
            <View style={styles.avatar}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>
                  {user?.fname?.[0]?.toUpperCase() || "U"}
                </Text>
              )}
            </View>
            <View style={styles.photoInfo}>
              <Pressable
                style={[
                  styles.changePhotoButton,
                  dynamicStyles.changePhotoButton,
                ]}
                onPress={handleImagePicker}
              >
                <Ionicons
                  name="camera-outline"
                  size={16}
                  color={dynamicStyles.changePhotoText.color}
                />
                <Text
                  style={[
                    styles.changePhotoText,
                    dynamicStyles.changePhotoText,
                  ]}
                >
                  Change Photo
                </Text>
              </Pressable>
              <Text style={[styles.photoHint, dynamicStyles.subtitle]}>
                JPG, PNG or GIF. Max size: 5MB.
              </Text>
            </View>
          </View>
        </View>

        {/* Basic Information */}
        <View style={[styles.groupedSection, dynamicStyles.card]}>
          <Text style={[styles.sectionTitle, dynamicStyles.text]}>
            Basic Information
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, dynamicStyles.text]}>Full Name</Text>
            <TextInput
              style={[styles.input, dynamicStyles.input]}
              value={formData.fullName}
              onChangeText={(value) => updateFormData("fullName", value)}
              placeholder="Enter your full name"
              placeholderTextColor={dynamicStyles.subtitle.color}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, dynamicStyles.text]}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea, dynamicStyles.input]}
              value={formData.bio}
              onChangeText={(value) => updateFormData("bio", value)}
              placeholder="Tell others about yourself..."
              placeholderTextColor={dynamicStyles.subtitle.color}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginBottom: 0 }]}>
              <Text style={[styles.label, dynamicStyles.text]}>Major</Text>
              <TextInput
                style={[styles.input, dynamicStyles.input]}
                value={formData.major}
                onChangeText={(value) => updateFormData("major", value)}
                placeholder="e.g. Computer Science"
                placeholderTextColor={dynamicStyles.subtitle.color}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginBottom: 0 }]}>
              <Text style={[styles.label, dynamicStyles.text]}>Year</Text>
              <View style={{ flex: 1 }}>
                <Pressable
                  style={[
                    styles.input,
                    styles.selectInput,
                    dynamicStyles.input,
                  ]}
                  onPress={() => setShowYearDropdown(!showYearDropdown)}
                >
                  <Text
                    style={[
                      styles.selectText,
                      formData.year === "Select year" && dynamicStyles.subtitle,
                      formData.year !== "Select year" && dynamicStyles.text,
                    ]}
                  >
                    {formData.year}
                  </Text>
                  <Ionicons
                    name={showYearDropdown ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={dynamicStyles.subtitle.color}
                  />
                </Pressable>

                {showYearDropdown && (
                  <View style={[styles.dropdown, dynamicStyles.card]}>
                    {yearOptions.map((option, index) => (
                      <Pressable
                        key={index}
                        style={[
                          styles.dropdownItem,
                          index !== yearOptions.length - 1 &&
                            styles.dropdownItemBorder,
                          { borderBottomColor: dynamicStyles.card.borderColor },
                        ]}
                        onPress={() => {
                          updateFormData("year", option);
                          setShowYearDropdown(false);
                        }}
                      >
                        <Text style={[styles.dropdownText, dynamicStyles.text]}>
                          {option}
                        </Text>
                        {formData.year === option && (
                          <Ionicons
                            name="checkmark"
                            size={16}
                            color="#00D084"
                          />
                        )}
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Interests & Hobbies */}
        <View style={[styles.groupedSection, dynamicStyles.card]}>
          <Text style={[styles.sectionTitle, dynamicStyles.text]}>
            Interests & Hobbies
          </Text>

          {/* Current Interests */}
          <View style={styles.interestsContainer}>
            {formData.interests.map((interest, index) => (
              <View
                key={index}
                style={[styles.interestChip, dynamicStyles.input]}
              >
                <Text style={[styles.interestText, dynamicStyles.text]}>
                  {interest}
                </Text>
                <Pressable onPress={() => removeInterest(interest)}>
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={dynamicStyles.subtitle.color}
                  />
                </Pressable>
              </View>
            ))}
          </View>

          {/* Add Interest Input */}
          <View style={styles.addInterestRow}>
            <TextInput
              ref={interestInputRef}
              style={[
                styles.input,
                styles.addInterestInput,
                dynamicStyles.input,
              ]}
              value={newInterest}
              onChangeText={setNewInterest}
              placeholder="Add an interest..."
              placeholderTextColor={dynamicStyles.subtitle.color}
              onSubmitEditing={handleAddInterest}
            />
            <Pressable style={styles.addButton} onPress={handleAddInterest}>
              <Ionicons
                name="add"
                size={24}
                color={dynamicStyles.addButtonIcon.color}
              />
            </Pressable>
          </View>

          {/* Suggested Interests */}
          <Text style={[styles.suggestedLabel, dynamicStyles.subtitle]}>
            Suggested:
          </Text>
          <View style={styles.suggestedContainer}>
            {suggestedInterests.map((interest, index) => (
              <Pressable
                key={index}
                style={styles.suggestedChip}
                onPress={() => addInterest(interest)}
              >
                <Text style={styles.suggestedText}>+ {interest}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* What are you looking for? */}
        <View style={[styles.groupedSection, dynamicStyles.card]}>
          <Text style={[styles.sectionTitle, dynamicStyles.text]}>
            What are you looking for?
          </Text>

          <View style={styles.checkboxGrid}>
            {lookingForOptions.map((option, index) => (
              <Pressable
                key={index}
                style={styles.checkboxItem}
                onPress={() => toggleLookingFor(option)}
              >
                <View
                  style={[
                    styles.checkbox,
                    isLookingForSelected(option) && styles.checkboxSelected,
                  ]}
                >
                  {isLookingForSelected(option) && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </View>
                <Text style={[styles.checkboxLabel, dynamicStyles.text]}>
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Pressable
            style={[styles.cancelButton, dynamicStyles.card]}
            onPress={handleCancel}
          >
            <Text style={[styles.cancelText, dynamicStyles.text]}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader
                color="#000000"
                text="Saving..."
                textStyle={styles.saveText}
              />
            ) : (
              <Text style={styles.saveText}>Save Changes</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    marginBottom: 24,
  },
  backText: {
    fontSize: 12,
  },
  photoSection: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  photoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#00D084",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 40,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  photoInfo: {
    flex: 1,
    gap: 8,
  },
  photoHint: {
    fontSize: 10,
  },
  groupedSection: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  selectInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectText: {
    fontSize: 14,
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  interestChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  interestText: {
    fontSize: 14,
    fontWeight: "500",
  },
  addInterestRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  addInterestInput: {
    flex: 1,
  },
  addButton: {
    width: 48,
    height: 48,
    backgroundColor: "#666666",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  changePhotoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    alignSelf: "flex-start",
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: "600",
  },
  suggestedLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  suggestedContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  suggestedChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#333333",
  },
  suggestedText: {
    fontSize: 13,
    color: "#CCCCCC",
  },
  checkboxGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  checkboxItem: {
    width: "47%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#333333",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  checkboxLabel: {
    fontSize: 14,
    flex: 1,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 100,
    marginTop: 16,
    justifyContent: "flex-end",
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 13,
    fontWeight: "600",
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    minWidth: 120,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000000",
  },
  dropdown: {
    position: "absolute",
    top: 52,
    left: 0,
    right: 0,
    borderRadius: 8,
    borderWidth: 1,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
  },
  dropdownItemBorder: {
    borderBottomWidth: 1,
  },
  dropdownText: {
    fontSize: 14,
  },
});

export default EditProfile;
