import { useTheme } from "@/app/contexts/ThemeContext";
import Header from "@/components/Header";
import PreviewModeBanner from "@/components/PreviewModeBanner";
import { Text } from "@/components/Themedtext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  BookOpen,
  Calendar,
  Car,
  Dumbbell,
  Filter,
  Gift,
  Heart,
  Home,
  Music,
  ShoppingBag,
} from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

const Prompts = () => {
  const { isDark } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState("All");

  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? "#000000" : "#FFFFFF",
    },
    text: {
      color: isDark ? "#FFFFFF" : "#000000",
    },
    subtitle: {
      color: isDark ? "#CCCCCC" : "#666666",
    },
    sectionBg: {
      backgroundColor: isDark ? "#000000" : "#F9F9F9",
    },
    categoryChip: {
      backgroundColor: isDark ? "#000000" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    categoryChipActive: {
      backgroundColor: isDark ? "#FFFFFF" : "#000000",
      borderColor: isDark ? "#FFFFFF" : "#000000",
    },
    categoryChipText: {
      color: isDark ? "#FFFFFF" : "#000000",
    },
    categoryChipTextActive: {
      color: isDark ? "#000000" : "#FFFFFF",
    },
    promptTitle: {
      color: isDark ? "#FFFFFF" : "#000000",
    },
    promptCard: {
      backgroundColor: isDark ? "#000000" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    requestButton: {
      backgroundColor: isDark ? "#FFFFFF" : "#000000",
    },
    requestButtonText: {
      color: isDark ? "#000000" : "#FFFFFF",
    },
    promptCategoryBadge: {
      backgroundColor: isDark ? "#ffefd5" : "#ffefd5",
    },
    promptCategoryBadgeText: {
      color: isDark ? "#f58c2d" : "#f58c2d",
    },
  };

  const categories = [
    { name: "All", icon: Filter },
    { name: "Rides", icon: Car },
    { name: "Events", icon: Calendar },
    { name: "Party", icon: Music },
    { name: "Marketplace", icon: ShoppingBag },
    { name: "Study", icon: BookOpen },
    { name: "Sports", icon: Dumbbell },
    { name: "Roommate", icon: Home },
    { name: "Dating", icon: Heart },
  ];

  const categoryConfig: Record<string, { icon: any }> = {
    Rides: { icon: Car },
    Events: { icon: Calendar },
    Roommate: { icon: Home },
    Party: { icon: Music },
    Marketplace: { icon: ShoppingBag },
    Study: { icon: BookOpen },
    Sports: { icon: Dumbbell },
    Dating: { icon: Heart },
    Giveaways: { icon: Gift },
  };

  const prompts = [
    {
      id: 1,
      category: "Sports",
      badge: "Sports",
      time: "2 days ago",
      title:
        "Looking for beginner tennis partner to learn with at Louisiana Tech University.",
      author: "by Kalyb",
    },
    {
      id: 2,
      category: "Giveaways",
      badge: "Giveaways",
      time: "6 days ago",
      title: "Giving away a thermo cup at Louisiana Tech University.",
      author: "by Charles (unverified)",
    },
    {
      id: 3,
      category: "Rides",
      badge: "Rides",
      time: "8 days ago",
      title: "Looking for a ride to Dallas tomorrow.",
      author: "by Dipson",
    },
    {
      id: 4,
      category: "Giveaways",
      badge: "Giveaways",
      time: "8 days ago",
      title: "Giving away a 3-hole punch at Louisiana Tech University.",
      author: "by Charles (unverified)",
    },
    {
      id: 5,
      category: "Giveaways",
      badge: "Giveaways",
      time: "8 days ago",
      title: "Giving away a 3-ring binder at Louisiana Tech University.",
      author: "by Charles (unverified)",
    },
    {
      id: 6,
      category: "Events",
      badge: "Events",
      time: "Just now",
      title:
        "Starting Avengers marathon in 30 mins! Bring snacks and join us in dorm common room",
      author: "by Mike R.",
    },
    {
      id: 7,
      category: "Roommate",
      badge: "Roommate",
      time: "1 minute ago",
      title:
        "Moving out! Grey sectional couch + matching coffee table. Great for dorms/apartments",
      author: "by Dan P.",
    },
    {
      id: 8,
      category: "Party",
      badge: "Party",
      time: "2 minutes ago",
      title: "House party tonight at 9pm! BYOB. DJ spinning all night",
      author: "by Alex K.",
    },
    {
      id: 9,
      category: "Marketplace",
      badge: "Marketplace",
      time: "5 minutes ago",
      title: "Selling textbooks for Biology 101 - great condition, half price",
      author: "by Emma L.",
    },
    {
      id: 10,
      category: "Study",
      badge: "Study",
      time: "10 minutes ago",
      title: "Study group for Calculus exam next week. Meet at library 3pm",
      author: "by James T.",
    },
  ];

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <View style={{ gap: 12 }}>
        <Header />
        <PreviewModeBanner />
      </View>

      <ScrollView style={styles.content}>
        {/* Live Prompts Feed Section */}
        <View style={[styles.feedHeader, dynamicStyles.sectionBg]}>
          <View style={styles.feedTitleRow}>
            <Text style={[styles.feedTitle, dynamicStyles.text]}>
              Live Prompts Feed
            </Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
          <Text style={[styles.feedSubtitle, dynamicStyles.subtitle]}>
            Real-time campus needs and connections
          </Text>

          <View style={styles.statItem}>
            <Ionicons
              name="time-outline"
              size={14}
              color={dynamicStyles.subtitle.color}
            />
            <Text style={[styles.statText, dynamicStyles.subtitle]}>
              Updated just now
            </Text>
          </View>
        </View>

        {/* Filter By Category */}
        <View style={styles.filterSection}>
          <View style={styles.filterHeader}>
            <Ionicons
              name="funnel-outline"
              size={16}
              color={dynamicStyles.text.color}
            />
            <Text style={[styles.filterTitle, dynamicStyles.text]}>
              Filter by Category
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {categories.map((category) => (
              <Pressable
                key={category.name}
                style={[
                  styles.categoryChip,
                  dynamicStyles.categoryChip,
                  selectedCategory === category.name && [
                    dynamicStyles.categoryChipActive,
                  ],
                ]}
                onPress={() => setSelectedCategory(category.name)}
              >
                <category.icon
                  size={16}
                  color={
                    selectedCategory === category.name
                      ? dynamicStyles.categoryChipTextActive.color
                      : dynamicStyles.categoryChipText.color
                  }
                  strokeWidth={2}
                />
                <Text
                  style={[
                    styles.categoryText,
                    dynamicStyles.categoryChipText,
                    selectedCategory === category.name && [
                      dynamicStyles.categoryChipTextActive,
                    ],
                  ]}
                >
                  {category.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Prompts List */}
        <View style={styles.promptsList}>
          {prompts
            .filter(
              (prompt) =>
                selectedCategory === "All" ||
                prompt.category === selectedCategory
            )
            .map((prompt) => (
              <View
                key={prompt.id}
                style={[styles.promptCard, dynamicStyles.promptCard]}
              >
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.categoryBadge,
                      dynamicStyles.promptCategoryBadge,
                    ]}
                  >
                    {categoryConfig[prompt.badge]?.icon &&
                      React.createElement(categoryConfig[prompt.badge].icon, {
                        size: 12,
                        color: "#f58c2d",
                        strokeWidth: 2,
                      })}
                    <Text
                      style={[
                        styles.badgeText,
                        dynamicStyles.promptCategoryBadgeText,
                      ]}
                    >
                      {prompt.badge}
                    </Text>
                  </View>
                  <View style={styles.headerRight}>
                    <View style={styles.timeRow}>
                      <Ionicons name="time-outline" size={14} color="#999999" />
                      <Text style={styles.timeText}>{prompt.time}</Text>
                    </View>
                    <Pressable
                      style={[
                        styles.requestButton,
                        dynamicStyles.requestButton,
                      ]}
                      onPress={() =>
                        router.push({
                          pathname: "/request-chat",
                          params: { title: prompt.title },
                        })
                      }
                    >
                      <Text
                        style={[
                          styles.requestButtonText,
                          dynamicStyles.requestButtonText,
                        ]}
                      >
                        Request
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <Text style={[styles.promptTitle, dynamicStyles.promptTitle]}>
                  {prompt.title}
                </Text>
                <Text style={[styles.authorText, dynamicStyles.subtitle]}>
                  {prompt.author}
                </Text>
              </View>
            ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  feedHeader: {
    padding: 16,
    marginBottom: 8,
  },
  feedTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "500",
  },
  requestButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  requestButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  feedTitle: {
    fontSize: 14,
    fontWeight: "bold",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#00FF00",
  },
  liveText: {
    color: "#00FF00",
    fontSize: 10,
    fontWeight: "bold",
  },
  feedSubtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 12,
  },
  filterSection: {
    paddingVertical: 16,
  },
  headerRight: {
    display: "flex",
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  filterHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  promptsList: {
    padding: 16,
    gap: 16,
  },
  promptCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  timeText: {
    fontSize: 10,
    color: "#999999",
  },
  promptTitle: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
    fontWeight: "500",
  },
  authorText: {
    fontSize: 12,
  },
});

export default Prompts;
