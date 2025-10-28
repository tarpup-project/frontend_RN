import { useTheme } from "@/app/contexts/ThemeContext";
import Header from "@/components/Header";
import PreviewModeBanner from "@/components/PreviewModeBanner";
import { Text } from "@/components/Themedtext";
import { Ionicons } from "@expo/vector-icons";
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
      backgroundColor: isDark ? "#0A0A0A" : "#F9F9F9",
    },
    categoryChip: {
      backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
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
    promptCard: {
      backgroundColor: isDark ? "#0A0A0A" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    promptTitle: {
      color: isDark ? "#FFFFFF" : "#000000",
    },
    requestButton: {
      backgroundColor: isDark ? "#FFFFFF" : "#000000",
    },
    requestButtonText: {
      color: isDark ? "#000000" : "#FFFFFF",
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

  const categoryConfig: Record<
    string,
    {
      icon: any;
      bgColor: string;
      iconColor: string;
    }
  > = {
    Rides: {
      icon: Car,
      bgColor: "#eff6ff",
      iconColor: "#3b82f6",
    },
    Events: {
      icon: Calendar,
      bgColor: "#eef2fe",
      iconColor: "#f3917c",
    },
    Roommate: {
      icon: Home,
      bgColor: "#D5F5E3",
      iconColor: "#10b981",
    },
    Party: {
      icon: Music,
      bgColor: "#ebfcf5",
      iconColor: "#55ab9f",
    },
    Marketplace: {
      icon: ShoppingBag,
      bgColor: "#faf5ff",
      iconColor: "#a275fa",
    },
    Study: {
      icon: BookOpen,
      bgColor: "#eef2fe",
      iconColor: "#f3917c",
    },
    Sports: {
      icon: Dumbbell,
      bgColor: "#fff7ed",
      iconColor: "#f3917c",
    },
    Dating: {
      icon: Heart,
      bgColor: "#fcf2f8",
      iconColor: "#f3917c",
    },
    Giveaways: {
      icon: Gift,
      bgColor: "#f0fdfa",
      iconColor: "#55ab9f",
    },
  };

  const prompts = [
    {
      id: 1,
      category: "Rides",
      badge: "Rides",
      status: "Urgent",
      statusColor: "#FF4444",
      time: "Just now",
      title: "Flight leaves in 3 hours! pay $25 for ride to TPA",
      author: "by Sarah M.",
      bgColor: "#1F0707",
      lightBgColor: "#F8FAFF", 
      borderColor: "#FF4444",
      lightBorderColor: "#F0F4FF", 
    },
    {
      id: 2,
      category: "Events",
      badge: "Events",
      status: "Urgent",
      statusColor: "#FF4444",
      time: "Just now",
      title:
        "Starting Avengers marathon in 30 mins! Bring snacks and join us in dorm common room",
      author: "by Mike R.",
      bgColor: "#1F0707",
      lightBgColor: "#FCFAFF", 
      borderColor: "#FF4444",
      lightBorderColor: "#F8F0FF", 
    },
    {
      id: 3,
      category: "Roommate",
      badge: "Roommate",
      status: "New",
      statusColor: "#00D084",
      time: "1 minute ago",
      title:
        "Moving out! Grey sectional couch + matching coffee table. Great for dorms/apartments",
      author: "by Dan P.",
      bgColor: "#0A1A2A",
      lightBgColor: "#FFFEف8",
      borderColor: "#4A90E2",
      lightBorderColor: "#FFFBF0", 
    },
    {
      id: 4,
      category: "Party",
      badge: "Party",
      status: "New",
      statusColor: "#00D084",
      time: "2 minutes ago",
      title: "House party tonight at 9pm! BYOB. DJ spinning all night",
      author: "by Alex K.",
      bgColor: "#1A0A2A",
      lightBgColor: "#F8FFFD", 
      borderColor: "#9C27B0",
      lightBorderColor: "#F0FFFA", 
    },
    {
      id: 5,
      category: "Marketplace",
      badge: "Marketplace",
      status: "Active",
      statusColor: "#4A90E2",
      time: "5 minutes ago",
      title: "Selling textbooks for Biology 101 - great condition, half price",
      author: "by Emma L.",
      bgColor: "#0A2A0A",
      lightBgColor: "#FFF8FC", 
      borderColor: "#00D084",
      lightBorderColor: "#FFF0F8", 
    },
    {
      id: 6,
      category: "Study",
      badge: "Study",
      status: "Active",
      statusColor: "#4A90E2",
      time: "10 minutes ago",
      title: "Study group for Calculus exam next week. Meet at library 3pm",
      author: "by James T.",
      bgColor: "#0A1A2A",
      lightBgColor: "#FFFCF8", 
      borderColor: "#4A90E2",
      lightBorderColor: "#FFF8F0", 
    },
    {
      id: 7,
      category: "Sports",
      badge: "Sports",
      status: "Urgent",
      statusColor: "#FF4444",
      time: "15 minutes ago",
      title: "Need one more player for basketball game starting in 30 mins!",
      author: "by Chris P.",
      bgColor: "#1F0707",
      lightBgColor: "#FFFAF8", 
      borderColor: "#FF4444",
      lightBorderColor: "#FFF4F0", 
    },
    {
      id: 8,
      category: "Dating",
      badge: "Dating",
      status: "New",
      statusColor: "#00D084",
      time: "20 minutes ago",
      title: "Coffee date? Looking for someone to explore campus cafes with",
      author: "by Taylor S.",
      bgColor: "#2A0A1A",
      lightBgColor: "#FFF8FA", 
      borderColor: "#FF69B4",
      lightBorderColor: "#FFF0F4", 
    },
    {
      id: 9,
      category: "Rides",
      badge: "Rides",
      status: "Active",
      statusColor: "#4A90E2",
      time: "25 minutes ago",
      title: "Daily carpool to downtown campus. Split gas $5/day",
      author: "by Jordan M.",
      bgColor: "#0A1A2A",
      lightBgColor: "#F8FAFF", 
      borderColor: "#4A90E2",
      lightBorderColor: "#F0F4FF", 
    },
    {
      id: 10,
      category: "Events",
      badge: "Events",
      status: "Active",
      statusColor: "#4A90E2",
      time: "30 minutes ago",
      title: "Free pizza at student center! Come join the club fair",
      author: "by Student Council",
      bgColor: "#0A1A2A",
      lightBgColor: "#FCFAFF", 
      borderColor: "#4A90E2",
      lightBorderColor: "#F8F0FF", 
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

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons
                name="location-outline"
                size={16}
                color={dynamicStyles.text.color}
              />
              <Text style={[styles.statText, dynamicStyles.subtitle]}>
                Showing 23 live prompts from University of South Florida
              </Text>
            </View>
          </View>

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
                style={[
                  styles.promptCard,
                  isDark
                    ? {
                        backgroundColor: prompt.bgColor,
                        borderColor: prompt.borderColor,
                      }
                    : {
                        backgroundColor: prompt.lightBgColor,
                        borderColor: prompt.lightBorderColor,
                      },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.badges}>
                    <View
                      style={[
                        styles.categoryBadge,
                        {
                          backgroundColor:
                            categoryConfig[prompt.badge]?.bgColor ||
                            prompt.borderColor,
                        },
                      ]}
                    >
                      {categoryConfig[prompt.badge]?.icon &&
                        React.createElement(categoryConfig[prompt.badge].icon, {
                          size: 12,
                          color: categoryConfig[prompt.badge].iconColor,
                          strokeWidth: 2,
                        })}
                      <Text
                        style={[
                          styles.badgeText,
                          {
                            color:
                              categoryConfig[prompt.badge]?.iconColor ||
                              "#FFFFFF",
                          },
                        ]}
                      >
                        {prompt.badge}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: prompt.statusColor },
                      ]}
                    >
                      <Text style={styles.badgeText}>{prompt.status}</Text>
                    </View>
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
  statsRow: {
    gap: 8,
    marginBottom: 4,
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
    padding: 10,
    borderRadius: 12,
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  badges: {
    flexDirection: "row",
    gap: 6,
    flex: 1,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
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
  newBadge: {
    backgroundColor: "#00D084",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  newBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  timeText: {
    fontSize: 10,
    color: "#999999",
  },
  promptTitle: {
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 20,
  },
  authorText: {
    fontSize: 12,
    marginBottom: 12,
  },
});

export default Prompts;
