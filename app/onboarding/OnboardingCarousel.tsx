import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Dimensions,
} from "react-native";
import Carousel from "react-native-reanimated-carousel";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const OnboardingCarousel = () => {
  const theme = useColorScheme() || "light";
  const router = useRouter();
  const isDark = theme === "dark";
  const [activeIndex, setActiveIndex] = useState(0);

  const slides = [
    {
      id: 1,
      image: isDark
        ? require("@/assets/images/logo-dark.png")
        : require("@/assets/images/logo-white.png"),
      title: "How It Works",
      subtitle: "Connect with your campus community\nin 3 simple steps",
      bgColor: "#333333",
      hasChips: false,
    },
    {
      id: 2,
      image: isDark
        ? require("@/assets/images/logo-dark.png")
        : require("@/assets/images/logo-white.png"),
      title: "Just state your need",
      subtitle: "Simply type what you're looking for in natural\nlanguage.",
      bgColor: "#87CEEB",
      hasChips: true,
      chips: [
        ['"Sell a couch"', '"Find a study partner"'],
        ['"Plan events"', '"Catch a ride"'],
      ],
    },
    {
      id: 3,
      image: isDark
        ? require("@/assets/images/logo-dark.png")
        : require("@/assets/images/logo-white.png"),
      title: "Get Matched Instantly",
      subtitle:
        "Let our AI find and connect you with students\nwho share your interests and needs in real time\nacross your campus.",
      bgColor: "#FFB6D9",
      hasChips: false,
    },
    {
      id: 4,
      image: isDark
        ? require("@/assets/images/people-dark.png")
        : require("@/assets/images/people-light.png"),
      title: "Connect and Coordinate",
      subtitle:
        "Chat directly with your matches to coordinate\ndetails. Share contact info, plan meetups, and\nbuild lasting connections with your campus\ncommunity.",
      bgColor: "#FF4500",
      hasChips: false,
    },
  ];

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
    chip: {
      backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    chipText: {
      color: isDark ? "#FFFFFF" : "#000000",
    },
  };

  const handleNext = () => {
    if (activeIndex === slides.length - 1) {
      router.push("/(tabs)");
    } else {
      setActiveIndex(activeIndex + 1);
    }
  };

  const handleSkip = () => {
    router.push("/(tabs)");
  };

  const renderSlide = ({ item }: { item: typeof slides[0] }) => (
    <View style={styles.slideContent}>
      <View style={[styles.logoContainer, { backgroundColor: item.bgColor }]}>
        <Image source={item.image} style={styles.logo} resizeMode="contain" />
      </View>

      <Text style={[styles.title, dynamicStyles.title]}>{item.title}</Text>

      <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
        {item.subtitle}
      </Text>

      {item.hasChips && item.chips && (
        <View style={styles.chipsContainer}>
          {item.chips.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.chipRow}>
              {row.map((chipText, chipIndex) => (
                <Pressable
                  key={chipIndex}
                  style={[styles.chip, dynamicStyles.chip]}
                >
                  <Text style={[styles.chipText, dynamicStyles.chipText]}>
                    {chipText}
                  </Text>
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      {/* Fixed Skip Button */}
      <Pressable style={styles.skipButton} onPress={handleSkip}>
        <Text style={[styles.skipText, dynamicStyles.skipText]}>Skip</Text>
      </Pressable>

      {/* Carousel */}
      <Carousel
        loop={false}
        width={SCREEN_WIDTH}
        height={SCREEN_WIDTH * 1.5}
        data={slides}
        renderItem={renderSlide}
        onSnapToItem={(index) => setActiveIndex(index)}
      />

      {/* Fixed Progress Dots */}
      <View style={styles.dotsContainer}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={
              index === activeIndex ? styles.dotActive : styles.dotInactive
            }
          />
        ))}
      </View>

      {/* Fixed Bottom Button */}
      <View style={styles.buttonContainer}>
        <Pressable style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {activeIndex === slides.length - 1
              ? "Get Started"
              : activeIndex === 0
              ? "Let's go"
              : "Continue"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  skipButton: {
    alignSelf: "flex-end",
    paddingVertical: 8,
    paddingHorizontal: 40,
    zIndex: 10,
  },
  skipText: {
    fontSize: 16,
  },
  slideContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 25,
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
  chipsContainer: {
    width: "100%",
    marginTop: 30,
  },
  chipRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 12,
  },
  chip: {
    width: 160,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
  },
  chipText: {
    fontSize: 11,
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
    paddingHorizontal: 24,
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

export default OnboardingCarousel;