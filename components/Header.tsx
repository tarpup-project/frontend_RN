import { useTheme } from "@/app/contexts/ThemeContext";
import AuthModal from "@/components/AuthModal";
import { Text } from "@/components/Themedtext";
import { useAuthStore } from "@/state/authStore";
import { Moon, Sun } from "lucide-react-native"
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
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
            {isDark? (
                <Moon size={20} color={dynamicStyles.icon.color} />
            ):(
              <Sun size={20} color={dynamicStyles.icon.color} />
            )}
          </Pressable>

          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Pressable
              style={[styles.chatButton, dynamicStyles.chatButton]}
              onPress={handleChatPress}
            >
              <View style={styles.chatContent}>
                <Ionicons
                  name="chatbubble-outline"
                  size={18}
                  color={dynamicStyles.chatText.color}
                />
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
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: -8,
  },
  logo: {
    width: 35,
    height: 35,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
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