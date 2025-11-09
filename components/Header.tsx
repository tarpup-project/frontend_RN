import { useTheme } from "@/app/contexts/ThemeContext";
import AuthModal from "@/components/AuthModal";
import { Text } from "@/components/Themedtext";
import { useAuthStore } from "@/state/authStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Lock } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Animated, Image, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Header = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const { isAuthenticated } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handleChatPress = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
    } else {
      router.push("/chat");
    }
  };

  const handleThemeToggle = () => {
    toggleTheme();
  };

  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
      borderBottomColor: isDark ? "#333333" : "#E0E0E0",
    },
    title: {
      color: isDark ? "#FFFFFF" : "#000000",
    },
    icon: {
      color: isDark ? "#FFFFFF" : "#000000",
    },
    chatButton: {
      backgroundColor: isDark ? "#FFFFFF" : "#000000",
    },
    chatText: {
      color: isDark ? "#000000" : "#FFFFFF",
    },
    lockContainer: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    lockIcon: {
      color: isDark ? "#FF6B6B" : "#FF4444",
    },
  };

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View
        style={[
          styles.container,
          dynamicStyles.container,
          { paddingTop: insets.top + 12 },
        ]}
      >
        <View style={styles.titleContainer}>
          <Image
            source={
              isDark
                ? require("@/assets/images/tarpup-plain-dark.png")
                : require("@/assets/images/tarpup-plain.png")
            }
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.title, dynamicStyles.title]}>
            TarpAI Connect
          </Text>
        </View>

        <View style={styles.iconsContainer}>
          <Pressable style={styles.iconButton} onPress={handleThemeToggle}>
            <Ionicons
              name={isDark ? "moon-outline" : "sunny-outline"}
              size={20}
              color={dynamicStyles.icon.color}
            />
          </Pressable>

          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Pressable
              style={[styles.chatButton, dynamicStyles.chatButton]}
              onPress={handleChatPress}
            >
              <View style={styles.chatContent}>
                <View style={styles.chatIconContainer}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={18}
                    color={dynamicStyles.chatText.color}
                  />
                  {!isAuthenticated && (
                    <View
                      style={[
                        styles.lockContainer,
                        dynamicStyles.lockContainer,
                      ]}
                    >
                      <Lock
                        size={10}
                        color={dynamicStyles.lockIcon.color}
                        strokeWidth={2.5}
                      />
                    </View>
                  )}
                </View>
                <Text style={[styles.chatText, dynamicStyles.chatText]}>
                  Chat
                </Text>
              </View>
            </Pressable>
          </Animated.View>
        </View>
      </View>
      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chatIconContainer: {
    position: "relative",
  },
  lockContainer: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  logo: {
    width: 35,
    height: 35,
  },
  title: {
    fontSize: 13,
    fontWeight: "bold",
  },
  iconsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  chatButton: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chatContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chatText: {
    fontSize: 13,
    fontWeight: "600",
  },
});

export default Header;
