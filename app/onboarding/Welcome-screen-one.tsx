import { useRouter } from "expo-router";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

const WelcomeScreenOne = () => {
  const theme = useColorScheme() || "light";
  const router = useRouter();
  const isDark = theme === "dark";

  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? "#000000" : "#FFFFFF",
    },
    skipText: {
      color: isDark ? "#FFFFFF" : "#000000",
    },
    title: {
      color: isDark ? "#FFFFFF" : "#000000",
    },
    subtitle: {
      color: isDark ? "#CCCCCC" : "#666666",
    },
    button: {
      backgroundColor: isDark ? "#000000" : "#FFFFFF",
    },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Pressable
        style={styles.skipButton}
        onPress={() => router.push("/onboarding/carousel")}
      >
        <Text style={[styles.skipText, dynamicStyles.skipText]}>Skip</Text>
      </Pressable>

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={
              isDark
                ? require("@/assets/images/logo-dark.png")
                : require("@/assets/images/logo-white.png")
            }
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={[styles.title, dynamicStyles.title]}>How It Works</Text>

        <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
          Connect with your campus community{"\n"}in 3 simple steps
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable
          style={styles.button}
          onPress={() => router.push("/onboarding/carousel")}
        >
          <View style={styles.buttonContent}>
            <Text style={styles.buttonText}>Let's go </Text>
            <Text style={styles.arrowIcon}>›</Text>
          </View>

        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  skipButton: {
    alignSelf: "flex-end",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100,
  },
  logoContainer: {
    backgroundColor: "#333333",
    alignItems: "center",
    marginBottom: 50,
  },
  logo: {
    width: 70,
    height: 70,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 240,
    left: 60,
    right: 60,
  },
  button: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
  arrowIcon: {
    fontSize: 16,
  },
  buttonContent: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  }
});

export default WelcomeScreenOne;