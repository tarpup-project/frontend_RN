import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import CustomPagination from "./CustomPagination";
import OnboardingScreen from "./OnboardingScreen";

const { width } = Dimensions.get("window");

interface CarouselItem {
  id: number;
  icon: any;
  iconDark: any;
  iconBgColor: string | string[]; 
  title: string;
  subtitle: string;
  buttonText: string;
  hasChips: boolean;
  isLucideIcon?: boolean; 
}

const carouselData: CarouselItem[] = [
  {
    id: 1,
    icon: "MessageSquare",
    iconDark: "MessageSquare",
    iconBgColor:["#87CEEB", "#4A90E2"],
    title: "Just state your need",
    subtitle: "Simply type what you're looking for in natural\nlanguage.",
    buttonText: "Continue",
    hasChips: true,
    isLucideIcon: true
  },
  {
    id: 2,
    icon: require("@/assets/images/logo-dark.png"),
    iconDark: require("@/assets/images/logo-dark.png"),
    iconBgColor: ["#FF00FF", "#CC00CC"],
    title: "Get Matched Instantly",
    subtitle:
      "Let our AI find and connect you with students\nwho share your interests and needs in real time\nacross your campus.",
    buttonText: "Continue",
    hasChips: false,
  },

  {
    id: 3,
    icon: "UsersRound",
    iconDark: "UsersRound",
    iconBgColor: "#FF4500",
    title: "Connect and Coordinate",
    subtitle:
      "Chat directly with your matches to coordinate\ndetails. Share contact info, plan meetups, and\nbuild lasting connections with your campus\ncommunity.",
    buttonText: "Get Started",
    hasChips: false,
  },
];

const OnboardingCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  const theme = useColorScheme() || "light";
  const isDark = theme === "dark";

  const handleContinue = () => {
    if (currentIndex < carouselData.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    } else {
      router.push("/(tabs)");
    }
  };

  const handleSkip = () => {
    router.push("/(tabs)");
  };

  const renderItem = ({ item }: { item: CarouselItem }) => (
    <View style={styles.screenContainer}>
      <OnboardingScreen
        icon={item.icon}
        iconDark={item.iconDark}
        iconBgColor={item.iconBgColor}
        title={item.title}
        subtitle={item.subtitle}
        buttonText={item.buttonText}
        onContinue={handleContinue}
        onSkip={handleSkip}
        hasChips={item.hasChips}
        isLucideIcon={item.isLucideIcon}
      />
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#000000" : "#FFFFFF" },
      ]}
    >
      <FlatList
        ref={flatListRef}
        data={carouselData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        bounces={false}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />
      <View style={styles.paginationContainer}>
        <CustomPagination currentIndex={currentIndex} totalDots={3} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContainer: {
    width: width,
  },
  paginationContainer: {
    position: "absolute",
    bottom: 90,
    left: 0,
    right: 0,
  },
});

export default OnboardingCarousel;
