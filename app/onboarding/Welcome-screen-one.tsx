import { Text } from "@/components/Themedtext";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "expo-router";
import { Image, Platform, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const WelcomeScreenOne = () => {
  const { isDark } = useTheme();
  const router = useRouter();

  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
    },
    skipText: {
      color: isDark ? "#FFFFFF" : "#0a0a0a",
    },
    title: {
      color: isDark ? "#FFFFFF" : "#0a0a0a",
    },
    subtitle: {
      color: isDark ? "#CCCCCC" : "#666666",
    },
    button: {
      backgroundColor: isDark ? "#FFFFFF" : "#000000",
    },
    buttonText: {
      color: isDark ? "#0a0a0a" : "#FFFFFF",
    },
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      <Pressable
        style={styles.skipButton}
        onPress={() => router.push("/(tabs)")}
      >
        <Text style={[styles.skipText, dynamicStyles.skipText]}>Skip</Text>
      </Pressable>

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={
              isDark
                ? require("@/assets/images/tarpup-dark.png")
                : require("@/assets/images/tarpup-light.png")
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
          style={[styles.button, dynamicStyles.button]}
          onPress={() => (router.push("/onboarding/carousel"))}
        >
          <View style={styles.buttonContent}>
            <Text style={[styles.buttonText, dynamicStyles.buttonText]}>
              Let's go{" "}
            </Text>
            <Text style={[styles.arrowIcon, dynamicStyles.buttonText]}>›</Text>
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  skipButton: {
    alignSelf: "flex-end",
    paddingVertical: Platform.OS === "ios" ? -7 : 8,
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
    alignItems: "center",
    marginBottom: 50,
  },
  logo: {
    width: 70,
    height: 70,
  },
  title: {
    fontSize: 28,
    fontFamily: "Geist-Bold",
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
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
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
  },
});

export default WelcomeScreenOne;
