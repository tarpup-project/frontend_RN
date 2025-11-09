import { useTheme } from "@/app/contexts/ThemeContext";
import { Text } from "@/components/Themedtext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  View,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ visible, onClose }) => {
  const { isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Animation effects
  useEffect(() => {
    if (visible) {
      // Fade in animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations when modal closes
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
    }
  }, [visible, fadeAnim, scaleAnim]);

  const dynamicStyles = {
    overlay: {
      backgroundColor: isDark ? "rgba(0,0,0,0.85)" : "rgba(0,0,0,0.6)",
    },
    modal: {
      backgroundColor: isDark ? "#1a1a1a" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    text: {
      color: isDark ? "#FFFFFF" : "#000000",
    },
    subText: {
      color: isDark ? "#B0B0B0" : "#666666",
    },
    iconContainer: {
      backgroundColor: isDark ? "#333333" : "#F0F0F0",
    },
    primaryButton: {
      backgroundColor: isDark ? "#FFFFFF" : "#000000",
    },
    primaryButtonText: {
      color: isDark ? "#000000" : "#FFFFFF",
    },
    secondaryButton: {
      backgroundColor: "transparent",
      borderColor: isDark ? "#444444" : "#CCCCCC",
    },
    secondaryButtonText: {
      color: isDark ? "#FFFFFF" : "#000000",
    },
  };

  const handleSignIn = () => {
    onClose();
    router.push("/(auth)/signin");
  };

  const handleCreateAccount = () => {
    onClose();
    router.push("/(auth)/Signup");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View 
        style={[
          styles.overlay, 
          dynamicStyles.overlay,
          { opacity: fadeAnim }
        ]}
      >
        <Pressable style={styles.overlayPressable} onPress={onClose}>
          <View style={styles.container}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <Animated.View
                style={[
                  styles.modal,
                  dynamicStyles.modal,
                  { 
                    marginBottom: insets.bottom + 20,
                    transform: [{ scale: scaleAnim }],
                    opacity: fadeAnim,
                  },
                ]}
              >
            {/* Icon and Lock */}
            <View style={styles.iconSection}>
              <View style={[styles.iconContainer, dynamicStyles.iconContainer]}>
                <Ionicons
                  name="sparkles"
                  size={24}
                  color={isDark ? "#FFFFFF" : "#000000"}
                />
              </View>
              <Ionicons
                name="lock-closed"
                size={20}
                color={isDark ? "#FFFFFF" : "#000000"}
                style={styles.lockIcon}
              />
            </View>

            {/* Title */}
            <Text style={[styles.title, dynamicStyles.text]}>
              Sign in to Continue
            </Text>

            {/* Subtitle */}
            <Text style={[styles.subtitle, dynamicStyles.subText]}>
              Join TarpAI Connect to find your perfect campus matches
            </Text>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <Pressable
                style={[styles.primaryButton, dynamicStyles.primaryButton]}
                onPress={handleSignIn}
              >
                <Text style={[styles.primaryButtonText, dynamicStyles.primaryButtonText]}>
                  Sign in
                </Text>
              </Pressable>

              <Pressable
                style={[styles.secondaryButton, dynamicStyles.secondaryButton]}
                onPress={handleCreateAccount}
              >
                <Text style={[styles.secondaryButtonText, dynamicStyles.secondaryButtonText]}>
                  Create Account
                </Text>
              </Pressable>
            </View>

            {/* Footer text */}
            <Text style={[styles.footerText, dynamicStyles.subText]}>
              Connect with students at your university.
            </Text>
              </Animated.View>
            </Pressable>
          </View>
        </Pressable>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  overlayPressable: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 20,
  },
  modal: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  iconSection: {
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  lockIcon: {
    position: "absolute",
    bottom: -8,
    right: -8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
    marginBottom: 20,
  },
  primaryButton: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  footerText: {
    fontSize: 12,
    textAlign: "center",
  },
});

export default AuthModal;