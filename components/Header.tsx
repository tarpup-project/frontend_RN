import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

const Header = () => {
  const theme = useColorScheme() || "light";
  const [manualTheme, setManualTheme] = useState<"light" | "dark" | null>(null);
  const router = useRouter();
  const isDark = theme === "dark";

  const isAuthenticated = false;

  const handleChatPress = () => {
    router.push("/chat");
  };

  const handleThemeToggle = () => {
    setManualTheme(isDark ? "light" : "dark");
  };

  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? "#000000" : "#FFFFFF",
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
    chatIcon: {
      color: isDark ? "#000000" : "#FFFFFF",
    },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Text style={[styles.title, dynamicStyles.title]}>TarpAI Connect</Text>

      <View style={styles.iconsContainer}>
        <Pressable style={styles.iconButton} onPress={handleThemeToggle}>
          <Ionicons
            name={isDark ? "moon" : "sunny"}
            size={20}
            color={dynamicStyles.icon.color}
          />
        </Pressable>

        <Pressable
          style={[styles.chatButton, dynamicStyles.chatButton]}
          onPress={handleChatPress}
        >
          <View style={styles.chatIconsWrapper}>
            <Ionicons
              name="chatbubble-outline"
              size={20}
              color={dynamicStyles.chatIcon.color}
            />
            {!isAuthenticated && (
              <Ionicons
                name="lock-closed"
                size={20}
                color={dynamicStyles.chatIcon.color}
              />
            )}
          </View>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingTop: 50,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
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
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  chatIconsWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});

export default Header;
