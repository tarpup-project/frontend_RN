import { useTheme } from "@/app/contexts/ThemeContext";
import Header from "@/components/Header";
import { Text } from "@/components/Themedtext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

const EditProfile = () => {
  const { isDark } = useTheme();

  const [fullName, setFullName] = useState("John Doe");
  const [bio, setBio] = useState("");
  const [major, setMajor] = useState("");
  const [year, setYear] = useState("Select year");
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [interests, setInterests] = useState([
    "Computer Science",
    "Gaming",
    "Movies",
    "Study Groups",
    "Downtown",
  ]);
  const [newInterest, setNewInterest] = useState("");
  const [selectedLookingFor, setSelectedLookingFor] = useState<string[]>([]);

  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? "#000000" : "#FFFFFF",
    },
    text: {
      color: isDark ? "#FFFFFF" : "#000000",
    },
    subtitle: {
      color: isDark ? "#CCCCCC" : "#666666",
    },
    card: {
      backgroundColor: isDark ? "#000000" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    input: {
      backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5",
      borderColor: isDark ? "#333333" : "#E0E0E0",
      color: isDark ? "#FFFFFF" : "#000000",
    },
    changePhotoButton: {
      backgroundColor: isDark ? "#FFFFFF" : "#000000",
    },
    changePhotoText: {
      color: isDark ? "#000000" : "#FFFFFF",
    },
  };

  const yearOptions = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

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

  const removeInterest = (interestToRemove: string) => {
    setInterests(interests.filter((interest) => interest !== interestToRemove));
  };

  const addInterest = (interest: string) => {
    if (!interests.includes(interest)) {
      setInterests([...interests, interest]);
    }
  };

  const toggleLookingFor = (option: string) => {
    if (selectedLookingFor.includes(option)) {
      setSelectedLookingFor(
        selectedLookingFor.filter((item) => item !== option)
      );
    } else {
      setSelectedLookingFor([...selectedLookingFor, option]);
    }
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
              <Text style={styles.avatarText}>J</Text>
            </View>
            <View style={styles.photoInfo}>
              <Pressable
                style={[
                  styles.changePhotoButton,
                  dynamicStyles.changePhotoButton,
                ]}
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

        {/* Basic Information - GROUPED */}
        <View style={[styles.groupedSection, dynamicStyles.card]}>
          <Text style={[styles.sectionTitle, dynamicStyles.text]}>
            Basic Information
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, dynamicStyles.text]}>Full Name</Text>
            <TextInput
              style={[styles.input, dynamicStyles.input]}
              value={fullName}
              onChangeText={setFullName}
              placeholder="John Doe"
              placeholderTextColor={dynamicStyles.subtitle.color}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, dynamicStyles.text]}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea, dynamicStyles.input]}
              value={bio}
              onChangeText={setBio}
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
                value={major}
                onChangeText={setMajor}
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
                      year === "Select year" && dynamicStyles.subtitle,
                      year !== "Select year" && dynamicStyles.text,
                    ]}
                  >
                    {year}
                  </Text>
                  <Ionicons
                    name={showYearDropdown ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={dynamicStyles.subtitle.color}
                  />
                </Pressable>

                {/* Dropdown Menu */}
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
                          setYear(option);
                          setShowYearDropdown(false);
                        }}
                      >
                        <Text style={[styles.dropdownText, dynamicStyles.text]}>
                          {option}
                        </Text>
                        {year === option && (
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

        {/* Interests & Hobbies - GROUPED */}
        <View style={[styles.groupedSection, dynamicStyles.card]}>
          <Text style={[styles.sectionTitle, dynamicStyles.text]}>
            Interests & Hobbies
          </Text>

          {/* Current Interests */}
          <View style={styles.interestsContainer}>
            {interests.map((interest, index) => (
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
              style={[
                styles.input,
                styles.addInterestInput,
                dynamicStyles.input,
              ]}
              value={newInterest}
              onChangeText={setNewInterest}
              placeholder="Add an interest..."
              placeholderTextColor={dynamicStyles.subtitle.color}
            />
            <Pressable
              style={styles.addButton}
              onPress={() => {
                if (newInterest.trim()) {
                  addInterest(newInterest.trim());
                  setNewInterest("");
                }
              }}
            >
              <Ionicons name="add" size={24} color="#000000" />
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

        {/* What are you looking for? - GROUPED */}
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
                    selectedLookingFor.includes(option) &&
                      styles.checkboxSelected,
                  ]}
                >
                  {selectedLookingFor.includes(option) && (
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
          <Pressable style={[styles.cancelButton, dynamicStyles.card]}>
            <Text
              style={[styles.cancelText, dynamicStyles.text]}
              onPress={() => router.push("/profile")}
            >
              Cancel
            </Text>
          </Pressable>
          <Pressable style={styles.saveButton}>
            <Text style={styles.saveText}>Save Changes</Text>
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
    fontSize: 16,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    padding: 12,
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
    borderRadius: 6,
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
