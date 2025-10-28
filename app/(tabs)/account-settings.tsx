import Header from "@/components/Header";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text } from "@/components/Themedtext";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  useColorScheme,
  View,
} from "react-native";

const AccountSettings = () => {
  const theme = useColorScheme() || "light";
  const isDark = theme === "dark";
  const router = useRouter();

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
      backgroundColor: isDark ? "#000000" : "#FFFFFF",
    },
    text: {
      color: isDark ? "#FFFFFF" : "#000000",
    },
    subtitle: {
      color: isDark ? "#CCCCCC" : "#666666",
    },
    card: {
      backgroundColor: isDark ? "#000000" : "#F5F5F5",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    input: {
      backgroundColor: isDark ? "#000000" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
      color: isDark ? "#FFFFFF" : "#000000",
    },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Header />

      <ScrollView style={styles.content}>
        {/* Back Button */}
        <Pressable style={styles.backButton} onPress={() => router.push("/profile")}>
          <Ionicons
            name="arrow-back"
            size={20}
            color={dynamicStyles.text.color}
          />
          <Text style={[styles.backText, dynamicStyles.text]}>
            Back to Profile
          </Text>
        </Pressable>

        <View style={[styles.section, dynamicStyles.card]}>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, dynamicStyles.text]}>
              Email Address
            </Text>
            <View
              style={[styles.input, styles.disabledInput, dynamicStyles.card]}
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
              style={[styles.input, styles.disabledInput, dynamicStyles.card]}
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
          <Text style={[styles.sectionTitle, dynamicStyles.text]}>
            Password & Security
          </Text>

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

          <Pressable style={styles.updateButton}>
            <Text style={styles.updateButtonText}>Update Password</Text>
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
            <Switch
              value={twoFactorEnabled}
              onValueChange={setTwoFactorEnabled}
              trackColor={{ false: "#333333", true: "#00D084" }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Privacy Settings */}
        <View style={[styles.section, dynamicStyles.card]}>
          <Text style={[styles.sectionTitle, dynamicStyles.text]}>
            Privacy Settings
          </Text>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, dynamicStyles.text]}>
                Email Visibility
              </Text>
              <Text style={[styles.toggleDescription, dynamicStyles.subtitle]}>
                Show email to other students
              </Text>
            </View>
            <Switch
              value={emailVisible}
              onValueChange={setEmailVisible}
              trackColor={{ false: "#333333", true: "#00D084" }}
              thumbColor="#FFFFFF"
            />
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
            <Switch
              value={profileVisible}
              onValueChange={setProfileVisible}
              trackColor={{ false: "#333333", true: "#00D084" }}
              thumbColor="#FFFFFF"
            />
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
            <Switch
              value={autoJoinGroups}
              onValueChange={setAutoJoinGroups}
              trackColor={{ false: "#333333", true: "#00D084" }}
              thumbColor="#FFFFFF"
            />
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
            <Switch
              value={dataSharing}
              onValueChange={setDataSharing}
              trackColor={{ false: "#333333", true: "#00D084" }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Data & Account Management */}
        <View style={[styles.section, dynamicStyles.card]}>
          <Text style={[styles.sectionTitle, dynamicStyles.text]}>
            Data & Account Management
          </Text>

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
          <Pressable style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save Settings</Text>
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
  section: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
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
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  updateButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
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
    color: "#000000",
  },
});

export default AccountSettings;
