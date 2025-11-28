import { Text } from "@/components/Themedtext";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

const PreviewModeBanner = () => {
  const { isDark } = useTheme();
  const router = useRouter();

  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    text: {
      color: isDark ? "#FFFFFF" : "#0a0a0a",
    },
    subtitle: {
      color: isDark ? "#CCCCCC" : "#666666",
    },
    primaryButton: {
      backgroundColor: isDark ? "#FFFFFF" : "#000000",
    },
    primaryButtonText: {
      color: isDark ? "#0a0a0a" : "#FFFFFF",
    },
    secondaryButton: {
      backgroundColor: isDark ? "#FFFFFF" : "#000000",
      borderColor: isDark ? "#FFFFFF" : "#000000",
    },
    secondaryButtonText: {
      color: isDark ? "#0a0a0a" : "#FFFFFF",
    },
  };

  const handleHowItWorksPress = () => {
    router.push("/(auth)/Signup");
  };

  const handleGetStartedPress = () => {
    router.push("/(auth)/signin");
  };

  return (
    <>
      <View style={[styles.container, dynamicStyles.container]}>
        <View style={styles.headerSection}>
          <Ionicons
            name="eye-outline"
            size={24}
            color={dynamicStyles.text.color}
            style={styles.eyeIcon}
          />
          <View style={styles.contentColumn}>
            <View style={styles.titleRow}>
              <Text style={styles.emoji}>👀</Text>
              <Text style={[styles.title, dynamicStyles.text]}>
                Preview Mode
              </Text>
              <Ionicons name="sparkles" size={16} color="#FFD700" />
            </View>
            <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
              You're exploring TarpAI! Sign up to request matches and join
              groups.
            </Text>
          </View>
        </View>

        <Pressable
          style={[
            styles.button,
            styles.secondaryButton,
            dynamicStyles.secondaryButton,
          ]}
          onPress={handleHowItWorksPress}
        >
          <Text style={[styles.buttonText, dynamicStyles.secondaryButtonText]}>
            Create Account
          </Text>
          <Ionicons name="arrow-forward" size={18} color={dynamicStyles.secondaryButtonText.color} />
        </Pressable>

        <Pressable
          style={[
            styles.button,
            styles.primaryButton,
            dynamicStyles.primaryButton,
          ]}
          onPress={handleGetStartedPress}
        >
          <Text style={[styles.buttonText, dynamicStyles.primaryButtonText]}>
            Log in
          </Text>
          <Ionicons name="arrow-forward" size={18} color={dynamicStyles.primaryButtonText.color} />
        </Pressable>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  headerSection: {
    flexDirection: "row",
    gap: 8,
  },
  eyeIcon: {
    marginTop: 2,
  },
  contentColumn: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  emoji: {
    fontSize: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 18,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  secondaryButton: {
    borderWidth: 1,
  },
  primaryButton: {
    borderWidth: 0,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: "400",
  },
});

export default PreviewModeBanner;
