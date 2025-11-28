import Header from "@/components/Header";
import { Text } from "@/components/Themedtext";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

const AccountSettings = () => {
  const router = useRouter();
  const { isDark } = useTheme();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [emailVisible, setEmailVisible] = useState(true);
  const [profileVisible, setProfileVisible] = useState(true);
  const [autoJoinGroups, setAutoJoinGroups] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);

  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
    },
    text: {
      color: isDark ? "#FFFFFF" : "#0a0a0a",
    },
    subtitle: {
      color: isDark ? "#CCCCCC" : "#666666",
    },
    card: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    input: {
      backgroundColor: isDark ? "#0a0a0a" : "#F5F5F5",
      borderColor: isDark ? "#333333" : "#E0E0E0",
      color: isDark ? "#FFFFFF" : "#0a0a0a",
    },
    updateButton: {
      backgroundColor: isDark ? "#FFFFFF" : "#000000",
    },
    updateButtonText: {
      color: isDark ? "#0a0a0a" : "#FFFFFF",
    },
    customToggle: {
      backgroundColor: isDark ? "#333333" : "#E0E0E0",
    },
    customToggleActive: {
      backgroundColor: isDark ? "#FFFFFF" : "#000000",
    },
    customToggleDot: {
      backgroundColor: isDark ? "#FFFFFF" : "#999999",
    },
    customToggleDotActive: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
    },
    saveButton: {
      backgroundColor: isDark ? "#FFFFFF" : "#000000",
    },
    saveButtonText: {
      color: isDark ? "#0a0a0a" : "#FFFFFF",
    },
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

        {/* Account Information Section */}
        <View style={[styles.section, dynamicStyles.card]}>
          {/* Section Title with Icon */}
          <View style={styles.sectionTitleRow}>
          <Ionicons name="person-outline" size={20} color={dynamicStyles.text.color} />
            <Text style={[styles.sectionTitle, dynamicStyles.text]}>
              Account Information
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, dynamicStyles.text]}>
              Email Address
            </Text>
            <View
              style={[styles.input, styles.disabledInput, dynamicStyles.input]}
            >
              <Text style={[styles.disabledText, dynamicStyles.subtitle]}>
                john.doe@usf.edu
              </Text>
            </View>
            <Text style={[styles.hint, dynamicStyles.subtitle]}>
              Email cannot be changed. Contact support if needed.
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, dynamicStyles.text]}>University</Text>
            <View
              style={[styles.input, styles.disabledInput, dynamicStyles.input]}
            >
              <Text style={[styles.disabledText, dynamicStyles.subtitle]}>
                University of South Florida
              </Text>
            </View>
            <Text style={[styles.hint, dynamicStyles.subtitle]}>
              University cannot be changed after verification.
            </Text>
          </View>
        </View>

        {/* Password & Security */}
        <View style={[styles.section, dynamicStyles.card]}>
          <View style={styles.sectionTitleRow}>
          <Ionicons name="lock-closed-outline" size={20} color={dynamicStyles.text.color} />
            <Text style={[styles.sectionTitle, dynamicStyles.text]}>
              Password & Security
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, dynamicStyles.text]}>
              Current Password
            </Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  dynamicStyles.input,
                ]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor={dynamicStyles.subtitle.color}
                secureTextEntry={!showCurrentPassword}
              />
              <Pressable
                style={styles.eyeIcon}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                <Ionicons
                  name={showCurrentPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color={dynamicStyles.subtitle.color}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, dynamicStyles.text]}>New Password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  dynamicStyles.input,
                ]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor={dynamicStyles.subtitle.color}
                secureTextEntry={!showNewPassword}
              />
              <Pressable
                style={styles.eyeIcon}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <Ionicons
                  name={showNewPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color={dynamicStyles.subtitle.color}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, dynamicStyles.text]}>
              Confirm New Password
            </Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  dynamicStyles.input,
                ]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor={dynamicStyles.subtitle.color}
                secureTextEntry={!showConfirmPassword}
              />
              <Pressable
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color={dynamicStyles.subtitle.color}
                />
              </Pressable>
            </View>
          </View>

          <Pressable style={[styles.updateButton, dynamicStyles.updateButton]}>
            <Text
              style={[styles.updateButtonText, dynamicStyles.updateButtonText]}
            >
              Update Password
            </Text>
          </Pressable>

          {/* Two-Factor Authentication */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, dynamicStyles.text]}>
                Two-Factor Authentication
              </Text>
              <Text style={[styles.toggleDescription, dynamicStyles.subtitle]}>
                Add an extra layer of security
              </Text>
            </View>
            <Pressable onPress={() => setTwoFactorEnabled(!twoFactorEnabled)}>
              <View
                style={[
                  styles.customToggle,
                  {
                    backgroundColor: dynamicStyles.customToggle.backgroundColor,
                  },
                  twoFactorEnabled && {
                    backgroundColor:
                      dynamicStyles.customToggleActive.backgroundColor,
                  },
                  twoFactorEnabled && styles.customToggleActive,
                ]}
              >
                <View
                  style={[
                    styles.customToggleDot,
                    {
                      backgroundColor:
                        dynamicStyles.customToggleDot.backgroundColor,
                    },
                    twoFactorEnabled && {
                      backgroundColor:
                        dynamicStyles.customToggleDotActive.backgroundColor,
                    },
                  ]}
                />
              </View>
            </Pressable>
          </View>
        </View>

        {/* Privacy Settings */}
        <View style={[styles.section, dynamicStyles.card]}>
          <View style={styles.sectionTitleRow}>
          <Ionicons name="shield-outline" size={20} color={dynamicStyles.text.color} />
            <Text style={[styles.sectionTitle, dynamicStyles.text]}>
              Privacy Settings
            </Text>
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, dynamicStyles.text]}>
                Email Visibility
              </Text>
              <Text style={[styles.toggleDescription, dynamicStyles.subtitle]}>
                Show email to other students
              </Text>
            </View>
            <Pressable onPress={() => setEmailVisible(!emailVisible)}>
              <View
                style={[
                  styles.customToggle,
                  {
                    backgroundColor: dynamicStyles.customToggle.backgroundColor,
                  },
                  emailVisible && {
                    backgroundColor:
                      dynamicStyles.customToggleActive.backgroundColor,
                  },
                  emailVisible && styles.customToggleActive,
                ]}
              >
                <View
                  style={[
                    styles.customToggleDot,
                    {
                      backgroundColor:
                        dynamicStyles.customToggleDot.backgroundColor,
                    },
                    emailVisible && {
                      backgroundColor:
                        dynamicStyles.customToggleDotActive.backgroundColor,
                    },
                  ]}
                />
              </View>
            </Pressable>
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, dynamicStyles.text]}>
                Profile Visibility
              </Text>
              <Text style={[styles.toggleDescription, dynamicStyles.subtitle]}>
                Make profile visible to others
              </Text>
            </View>
            <Pressable onPress={() => setProfileVisible(!profileVisible)}>
              <View
                style={[
                  styles.customToggle,
                  {
                    backgroundColor: dynamicStyles.customToggle.backgroundColor,
                  },
                  profileVisible && {
                    backgroundColor:
                      dynamicStyles.customToggleActive.backgroundColor,
                  },
                  profileVisible && styles.customToggleActive,
                ]}
              >
                <View
                  style={[
                    styles.customToggleDot,
                    {
                      backgroundColor:
                        dynamicStyles.customToggleDot.backgroundColor,
                    },
                    profileVisible && {
                      backgroundColor:
                        dynamicStyles.customToggleDotActive.backgroundColor,
                    },
                  ]}
                />
              </View>
            </Pressable>
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, dynamicStyles.text]}>
                Auto-Join Groups
              </Text>
              <Text style={[styles.toggleDescription, dynamicStyles.subtitle]}>
                Automatically join suggested groups
              </Text>
            </View>
            <Pressable onPress={() => setAutoJoinGroups(!autoJoinGroups)}>
              <View
                style={[
                  styles.customToggle,
                  {
                    backgroundColor: dynamicStyles.customToggle.backgroundColor,
                  },
                  autoJoinGroups && {
                    backgroundColor:
                      dynamicStyles.customToggleActive.backgroundColor,
                  },
                  autoJoinGroups && styles.customToggleActive,
                ]}
              >
                <View
                  style={[
                    styles.customToggleDot,
                    {
                      backgroundColor:
                        dynamicStyles.customToggleDot.backgroundColor,
                    },
                    autoJoinGroups && {
                      backgroundColor:
                        dynamicStyles.customToggleDotActive.backgroundColor,
                    },
                  ]}
                />
              </View>
            </Pressable>
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, dynamicStyles.text]}>
                Data Sharing
              </Text>
              <Text style={[styles.toggleDescription, dynamicStyles.subtitle]}>
                Share data for improved matching
              </Text>
            </View>
            <Pressable onPress={() => setDataSharing(!dataSharing)}>
              <View
                style={[
                  styles.customToggle,
                  {
                    backgroundColor: dynamicStyles.customToggle.backgroundColor,
                  },
                  dataSharing && {
                    backgroundColor:
                      dynamicStyles.customToggleActive.backgroundColor,
                  },
                  dataSharing && styles.customToggleActive,
                ]}
              >
                <View
                  style={[
                    styles.customToggleDot,
                    {
                      backgroundColor:
                        dynamicStyles.customToggleDot.backgroundColor,
                    },
                    dataSharing && {
                      backgroundColor:
                        dynamicStyles.customToggleDotActive.backgroundColor,
                    },
                  ]}
                />
              </View>
            </Pressable>
          </View>
        </View>

        {/* Data & Account Management */}
        <View style={[styles.section, dynamicStyles.card]}>
          <View style={styles.sectionTitleRow}>
          <Ionicons name="warning-outline" size={20} color={dynamicStyles.text.color} />
            <Text style={[styles.sectionTitle, dynamicStyles.text]}>
              Data & Account Management
            </Text>
          </View>

          <Pressable style={[styles.actionButton, dynamicStyles.card]}>
            <Ionicons
              name="swap-horizontal-outline"
              size={20}
              color={dynamicStyles.text.color}
            />
            <Text style={[styles.actionButtonText, dynamicStyles.text]}>
              Transfer to Different University
            </Text>
          </Pressable>

          {/* Danger Zone */}
          <View style={styles.dangerZone}>
            <View style={styles.dangerHeader}>
              <Ionicons name="trash-outline" size={12} color="#FF4444" />
              <Text style={styles.dangerTitle}>Danger Zone</Text>
            </View>

            <Pressable style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>Delete Account</Text>
            </Pressable>

            <Text style={[styles.dangerDescription, dynamicStyles.subtitle]}>
              This action cannot be undone. All your data will be permanently
              deleted.
            </Text>
          </View>
        </View>

        {/* Save Settings Button */}
        <View style={styles.saveButtonContainer}>
          <Pressable style={[styles.saveButton, dynamicStyles.saveButton]}>
            <Text style={[styles.saveButtonText, dynamicStyles.saveButtonText]}>
              Save Settings
            </Text>
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
  section: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
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
  disabledInput: {
    justifyContent: "center",
  },
  disabledText: {
    fontSize: 14,
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
  },
  passwordInputContainer: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    top: 12,
  },
  updateButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  updateButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 12,
  },
  customToggle: {
    width: 40,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    paddingHorizontal: 2,
    alignItems: "flex-start",
  },
  customToggleActive: {
    alignItems: "flex-end",
  },
  customToggleDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  dangerZone: {
    marginTop: 8,
  },
  dangerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  dangerTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FF4444",
  },
  deleteButton: {
    backgroundColor: "#8B0000",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  dangerDescription: {
    fontSize: 12,
    textAlign: "left",
  },
  saveButtonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 80,
    marginTop: 16,
  },
  saveButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0a0a0a",
  },
});

export default AccountSettings;
