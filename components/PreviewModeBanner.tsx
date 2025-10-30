import { useTheme } from "@/app/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { Sparkle } from "lucide-react-native";
import { useRouter } from "expo-router";
import { Text } from "@/components/Themedtext";
import { Pressable, StyleSheet, View } from "react-native";

const PreviewModeBanner = () => {
  const { isDark } = useTheme();
  const router = useRouter();

  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? "#000000" : "#F5F5F5",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    text: {
      color: isDark ? "#FFFFFF" : "#000000",
    },
    subtitle: {
      color: isDark ? "#CCCCCC" : "#666666",
    },
    primaryButton: {
      backgroundColor: isDark ? "#FFFFFF" : "#000000",
    },
    primaryButtonText: {
      color: isDark ? "#000000" : "#FFFFFF",
    },
    secondaryButton: {
      backgroundColor: isDark ? "#FFFFFF" : "#000000",
      borderColor: isDark ? "#FFFFFF" : "#000000",
    },
    secondaryButtonText: {
      color: isDark ? "#000000" : "#FFFFFF",
    },
  };

  const handleHowItWorksPress = () => {
    router.push("/how-it-works");
  };

  const handleGetStartedPress = () => {
    router.push("/(auth)/Signup");
  };

  return (
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
            <Text style={[styles.title, dynamicStyles.text]}>Preview Mode</Text>
            <Sparkle size={16} color="#FFD700" />
          </View>
          <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
            You're exploring Tarpail! Sign up to request matches and join groups.
          </Text>
        </View>
      </View>

      <Pressable
        style={[styles.button, styles.secondaryButton, dynamicStyles.secondaryButton]}
        onPress={handleHowItWorksPress}
      >
        <Text style={[styles.buttonText, dynamicStyles.secondaryButtonText]}>
          How it works
        </Text>
        <Ionicons
          name="help-circle-outline"
          size={18}
          color={dynamicStyles.secondaryButtonText.color}
        />
      </Pressable>

      <Pressable
        style={[styles.button, styles.primaryButton, dynamicStyles.primaryButton]}
        onPress={handleGetStartedPress}
      >
        <Text style={[styles.buttonText, dynamicStyles.primaryButtonText]}>
          Get Started
        </Text>
        <Ionicons
          name="arrow-forward"
          size={18}
          color={dynamicStyles.primaryButtonText.color}
        />
      </Pressable>
    </View>
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
    fontSize: 15,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
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
    fontWeight: "600",
  },
});

export default PreviewModeBanner;