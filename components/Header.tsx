import { useTheme } from "@/app/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text } from "@/components/Themedtext";
import { StatusBar } from "expo-status-bar";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Header = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();

  const handleChatPress = () => {
    router.push("/chat");
  };

  const handleThemeToggle = () => {
    toggleTheme();
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
        <Text style={[styles.title, dynamicStyles.title]}>TarpAI Connect</Text>

        <View style={styles.iconsContainer}>
          <Pressable style={styles.iconButton} onPress={handleThemeToggle}>
            <Ionicons
              name={isDark ? "moon-outline" : "sunny-outline"}
              size={20}
              color={dynamicStyles.icon.color}
            />
          </Pressable>

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
        </View>
      </View>
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
  title: {
    fontSize: 14,
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