import { useRouter } from "expo-router";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

const WelcomeScreenFour = () => {
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
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      {/* Skip Button */}
      <Pressable
        style={styles.skipButton}
        onPress={() => router.push("/(tabs)")}
      >
        <Text style={[styles.skipText, dynamicStyles.skipText]}>Skip</Text>
      </Pressable>

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={
              isDark
                ? require("@/assets/images/people-dark.png")
                : require("@/assets/images/people-light.png")
            }
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={[styles.title, dynamicStyles.title]}>
          Connect and Coordinate
        </Text>

        <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
          Chat directly with your matches to coordinate{"\n"}details. Share
          contact info, plan meetups, and{"\n"}build lasting connections with
          your campus{"\n"}community.
        </Text>
      </View>

      {/* Progress Dots */}
      <View style={styles.dotsContainer}>
        <View style={styles.dotInactive} />
        <View style={styles.dotInactive} />
        <View style={styles.dotActive} />
      </View>

      {/* Bottom Button */}
      <View style={styles.buttonContainer}>
        <Pressable style={styles.button} onPress={() => router.push("/(tabs)")}>
          <Text style={styles.buttonText}>Get Started </Text>
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
    paddingBottom: 120,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 25,
    backgroundColor: "#FF4500", // Orange-red
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: 50,
    height: 50,
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
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
  },
  dotActive: {
    width: 32,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  dotInactive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#666666",
  },
  buttonContainer: {
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default WelcomeScreenFour;
