import Header from "@/components/Header";
import { Loader } from "@/components/Loader";
import { Text } from "@/components/Themedtext";
import { useAuthStore } from "@/state/authStore";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/app/contexts/ThemeContext";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { User, Lock, Shield, AlertTriangle } from "lucide-react-native";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { toast } from "sonner-native";
import { api } from "@/api/client";
import { UrlConstants } from "@/constants/apiUrls";

interface NotificationSettings {
  emailVisibile?: boolean;
  profileVisibile?: boolean;
  dataSharing?: boolean;
}

const AccountSettings = () => {
  const { isDark } = useTheme();
  const { user, logout } = useAuthStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  
  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Settings
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [emailVisible, setEmailVisible] = useState(true);
  const [profileVisible, setProfileVisible] = useState(true);
  const [autoJoinGroups, setAutoJoinGroups] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailVisibile: true,
    profileVisibile: true,
    dataSharing: false,
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
      backgroundColor: isDark ? "#0a0a0a" : "#F5F5F5",
      borderColor: isDark ? "#333333" : "#E0E0E0",
      color: isDark ? "#FFFFFF" : "#000000",
    },
    updateButton: {
      backgroundColor: isDark ? "#FFFFFF" : "#000000",
    },
    updateButtonText: {
      color: isDark ? "#000000" : "#FFFFFF",
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
      color: isDark ? "#000000" : "#FFFFFF",
    },
  };

  // Load notification settings on mount
  useEffect(() => {
    const loadNotificationSettings = async () => {
      try {
        const response = await api.get(UrlConstants.notificationSettings);
        const data = response.data.data;
        setNotificationSettings(data);
        setEmailVisible(data.emailVisibile ?? true);
        setProfileVisible(data.profileVisibile ?? true);
        setDataSharing(data.dataSharing ?? false);
      } catch (error) {
        console.error("Failed to load notification settings:", error);
      }
    };

    loadNotificationSettings();
  }, []);

  const handlePasswordUpdate = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    try {
      setIsPasswordLoading(true);
      
      await api.post("/user/change-password", {
        currentPassword,
        newPassword,
      });

      toast.success("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update password");
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to DELETE your account? This action cannot be undone. All your data will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(UrlConstants.deleteAccount);
              await logout();
              router.push("/onboarding/Welcome-screen-one");
              toast.success("Account deleted successfully");
            } catch (error) {
              toast.error("Failed to delete account");
            }
          },
        },
      ]
    );
  };

  const handleTransferUniversity = () => {
    toast.info("Feature will be released soon...");
  };

  const handleSaveSettings = async () => {
    try {
      setIsLoading(true);
      
      await api.post(UrlConstants.notificationSettings, {
        emailVisibile: emailVisible,
        profileVisibile: profileVisible,
        dataSharing: dataSharing,
      });

      toast.success("Settings saved successfully!");
      
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save settings");
    } finally {
      setIsLoading(false);
    }
  };

  const ToggleSwitch = ({ 
    value, 
    onValueChange, 
    label, 
    description 
  }: { 
    value: boolean; 
    onValueChange: (value: boolean) => void;
    label: string;
    description: string;
  }) => (
    <View style={styles.toggleRow}>
      <View style={styles.toggleInfo}>
        <Text style={[styles.toggleLabel, dynamicStyles.text]}>
          {label}
        </Text>
        <Text style={[styles.toggleDescription, dynamicStyles.subtitle]}>
          {description}
        </Text>
      </View>
      <Pressable onPress={() => onValueChange(!value)}>
        <View
          style={[
            styles.customToggle,
            { backgroundColor: dynamicStyles.customToggle.backgroundColor },
            value && { backgroundColor: dynamicStyles.customToggleActive.backgroundColor },
            value && styles.customToggleActive,
          ]}
        >
          <View
            style={[
              styles.customToggleDot,
              { backgroundColor: dynamicStyles.customToggleDot.backgroundColor },
              value && { backgroundColor: dynamicStyles.customToggleDotActive.backgroundColor },
            ]}
          />
        </View>
      </Pressable>
    </View>
  );

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
          <View style={styles.sectionTitleRow}>
            <User size={20} color={dynamicStyles.text.color} strokeWidth={2} />
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
                {user?.email}
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
            <Lock size={20} color={dynamicStyles.text.color} strokeWidth={2} />
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

          <Pressable
            style={[
              styles.updateButton, 
              dynamicStyles.updateButton,
              isPasswordLoading && styles.updateButtonDisabled
            ]}
            onPress={handlePasswordUpdate}
            disabled={isPasswordLoading}
          >
            {isPasswordLoading ? (
              <Loader 
                color={dynamicStyles.updateButtonText.color}
                text="Updating..."
                textStyle={dynamicStyles.updateButtonText}
              />
            ) : (
              <Text style={[styles.updateButtonText, dynamicStyles.updateButtonText]}>
                Update Password
              </Text>
            )}
          </Pressable>

          {/* Two-Factor Authentication */}
          <ToggleSwitch
            value={twoFactorEnabled}
            onValueChange={setTwoFactorEnabled}
            label="Two-Factor Authentication"
            description="Add an extra layer of security"
          />
        </View>

        {/* Privacy Settings */}
        <View style={[styles.section, dynamicStyles.card]}>
          <View style={styles.sectionTitleRow}>
            <Shield size={20} color={dynamicStyles.text.color} strokeWidth={2} />
            <Text style={[styles.sectionTitle, dynamicStyles.text]}>
              Privacy Settings
            </Text>
          </View>

          <ToggleSwitch
            value={emailVisible}
            onValueChange={setEmailVisible}
            label="Email Visibility"
            description="Show email to other students"
          />

          <ToggleSwitch
            value={profileVisible}
            onValueChange={setProfileVisible}
            label="Profile Visibility"
            description="Make profile visible to others"
          />

          <ToggleSwitch
            value={autoJoinGroups}
            onValueChange={setAutoJoinGroups}
            label="Auto-Join Groups"
            description="Automatically join suggested groups"
          />

          <ToggleSwitch
            value={dataSharing}
            onValueChange={setDataSharing}
            label="Data Sharing"
            description="Share data for improved matching"
          />
        </View>

        {/* Data & Account Management */}
        <View style={[styles.section, dynamicStyles.card]}>
          <View style={styles.sectionTitleRow}>
            <AlertTriangle size={20} color={dynamicStyles.text.color} strokeWidth={2} />
            <Text style={[styles.sectionTitle, dynamicStyles.text]}>
              Data & Account Management
            </Text>
          </View>

          <Pressable 
            style={[styles.actionButton, dynamicStyles.card]}
            onPress={handleTransferUniversity}
          >
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

            <Pressable 
              style={styles.deleteButton}
              onPress={handleDeleteAccount}
            >
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
          <Pressable 
            style={[
              styles.saveButton, 
              dynamicStyles.saveButton,
              isLoading && styles.saveButtonDisabled
            ]}
            onPress={handleSaveSettings}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader 
                color={dynamicStyles.saveButtonText.color}
                text="Saving..."
                textStyle={dynamicStyles.saveButtonText}
              />
            ) : (
              <Text style={[styles.saveButtonText, dynamicStyles.saveButtonText]}>
                Save Settings
              </Text>
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
    fontSize: 13,
    fontWeight: "700",
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
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 12,
  },
  disabledInput: {
    justifyContent: "center",
  },
  disabledText: {
    fontSize: 12,
  },
  hint: {
    fontSize: 10,
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
    minHeight: 48,
  },
  updateButtonDisabled: {
    opacity: 0.6,
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
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 10,
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
    padding: 10,
    borderRadius: 10,
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
    fontWeight: "700",
    color: "#FFFFFF",
  },
  dangerDescription: {
    fontSize: 10,
    textAlign: "left",
    fontWeight: "700",
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
    alignItems: "center",
    minWidth: 120,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

export default AccountSettings;