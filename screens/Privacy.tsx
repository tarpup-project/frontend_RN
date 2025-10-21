import Header from "@/components/Header";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
  Switch,
} from "react-native";

const Privacy = () => {
  const theme = useColorScheme() || "light";
  const isDark = theme === "dark";

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Privacy Settings
  const [emailVisibility, setEmailVisibility] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [autoJoinGroups, setAutoJoinGroups] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);

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
      backgroundColor: isDark ? "#0A0A0A" : "#F5F5F5",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    input: {
      backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
      color: isDark ? "#FFFFFF" : "#000000",
    },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Header />

      <ScrollView style={styles.content}>
        {/* Back Button */}
        <Pressable style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={dynamicStyles.text.color} />
          <Text style={[styles.backText, dynamicStyles.text]}>
            Back to Profile
          </Text>
        </Pressable>

        {/* Email Address Section */}
        <View style={[styles.section, dynamicStyles.card]}>
          <Text style={[styles.sectionLabel, dynamicStyles.text]}>
            Email Address
          </Text>
          <Text style={[styles.emailText, dynamicStyles.text]}>
            john.doe@usf.edu
          </Text>
          <Text style={[styles.hint, dynamicStyles.subtitle]}>
            Email cannot be changed. Contact Support if needed.
          </Text>
        </View>

        {/* University Section */}
        <View style={[styles.section, dynamicStyles.card]}>
          <Text style={[styles.sectionLabel, dynamicStyles.text]}>
            University
          </Text>
          <Text style={[styles.universityText, dynamicStyles.text]}>
            University of South Florida
          </Text>
          <Text style={[styles.hint, dynamicStyles.subtitle]}>
            University cannot be changed after verification.
          </Text>
        </View>

        {/* Password & Security Section */}
        <View style={[styles.passwordSection, dynamicStyles.card]}>
          <View style={styles.passwordHeader}>
            <Ionicons name="lock-closed" size={20} color={dynamicStyles.text.color} />
            <Text style={[styles.passwordTitle, dynamicStyles.text]}>
              Password & Security
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, dynamicStyles.text]}>
              Current Password
            </Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={[styles.input, dynamicStyles.input, styles.passwordInput]}
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
                style={[styles.input, dynamicStyles.input, styles.passwordInput]}
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
                style={[styles.input, dynamicStyles.input, styles.passwordInput]}
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

          <Pressable style={styles.updatePasswordButton}>
            <Text style={styles.updatePasswordText}>Update Password</Text>
          </Pressable>
        </View>

        {/* Privacy Settings Section */}
        <View style={[styles.privacySection, dynamicStyles.card]}>
          <View style={styles.privacyHeader}>
            <Ionicons name="shield-checkmark" size={20} color={dynamicStyles.text.color} />
            <Text style={[styles.privacyTitle, dynamicStyles.text]}>
              Privacy Settings
            </Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, dynamicStyles.text]}>
                Email Visibility
              </Text>
              <Text style={[styles.settingDescription, dynamicStyles.subtitle]}>
                Show your email to matched users
              </Text>
            </View>
            <Switch
              value={emailVisibility}
              onValueChange={setEmailVisibility}
              trackColor={{ false: "#333333", true: "#00D084" }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, dynamicStyles.text]}>
                Profile Visibility
              </Text>
              <Text style={[styles.settingDescription, dynamicStyles.subtitle]}>
                Make your profile visible in search
              </Text>
            </View>
            <Switch
              value={profileVisibility}
              onValueChange={setProfileVisibility}
              trackColor={{ false: "#333333", true: "#00D084" }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, dynamicStyles.text]}>
                Auto-Join Compatible Groups
              </Text>
              <Text style={[styles.settingDescription, dynamicStyles.subtitle]}>
                Automatically join high-compatibility groups
              </Text>
            </View>
            <Switch
              value={autoJoinGroups}
              onValueChange={setAutoJoinGroups}
              trackColor={{ false: "#333333", true: "#00D084" }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, dynamicStyles.text]}>
                Data Sharing for Research
              </Text>
              <Text style={[styles.settingDescription, dynamicStyles.subtitle]}>
                Share anonymized data to improve matching algorithms
              </Text>
            </View>
            <Switch
              value={dataSharing}
              onValueChange={setDataSharing}
              trackColor={{ false: "#333333", true: "#00D084" }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Data & Account Management */}
        <View style={[styles.dangerSection, dynamicStyles.card]}>
          <View style={styles.dangerHeader}>
            <Ionicons name="warning" size={20} color="#FF9800" />
            <Text style={[styles.dangerTitle, dynamicStyles.text]}>
              Data & Account Management
            </Text>
          </View>

          <Pressable style={[styles.transferButton, dynamicStyles.card]}>
            <Ionicons name="swap-horizontal" size={20} color={dynamicStyles.text.color} />
            <Text style={[styles.transferButtonText, dynamicStyles.text]}>
              Transfer to Different University
            </Text>
          </Pressable>

          <View style={styles.deleteSection}>
            <Ionicons name="trash" size={18} color="#FF4444" />
            <Text style={styles.dangerZoneText}>Danger Zone</Text>
          </View>

          <Pressable style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>Delete Account</Text>
          </Pressable>

          <Text style={[styles.deleteWarning, dynamicStyles.subtitle]}>
            This action cannot be undone. All your data will be permanently
            deleted.
          </Text>
        </View>

        {/* Save Settings Button */}
        <Pressable style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save Settings</Text>
        </Pressable>
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
  section: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  emailText: {
    fontSize: 16,
    marginBottom: 8,
  },
  universityText: {
    fontSize: 16,
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
  },
  passwordSection: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  passwordHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  passwordTitle: {
    fontSize: 16,
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
  passwordInputContainer: {
    position: "relative",
  },
  input: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    top: 12,
  },
  updatePasswordButton: {
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  updatePasswordText: {
    color: "#000000",
    fontSize: 15,
    fontWeight: "600",
  },
  privacySection: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  privacyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  dangerSection: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  dangerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  transferButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  transferButtonText: {
    fontSize: 15,
    fontWeight: "500",
  },
  deleteSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  dangerZoneText: {
    fontSize: 15,
    fontWeight: "600",
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
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  deleteWarning: {
    fontSize: 11,
    textAlign: "center",
  },
  saveButton: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 80,
    marginTop: 8,
  },
  saveButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default Privacy;