import Header from "@/components/Header";
import PreviewModeBanner from "@/components/PreviewModeBanner";
import { useTheme } from "@/app/contexts/ThemeContext";
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
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

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
      borderColor: "#FF4444",
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
      borderColor: "#FF4444",
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
      borderColor: "#4A90E2",
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
      borderColor: "#9C27B0",
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
      borderColor: "#00D084",
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
      borderColor: "#4A90E2",
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
      borderColor: "#FF4444",
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
      borderColor: "#FF69B4",
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
      borderColor: "#4A90E2",
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
      borderColor: "#4A90E2",
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
                  selectedCategory === category.name &&
                    styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(category.name)}
              >
                <category.icon
                  size={16}
                  color={
                    selectedCategory === category.name ? "#000000" : "#FFFFFF"
                  }
                  strokeWidth={2}
                />
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category.name &&
                      styles.categoryTextActive,
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
                  {
                    backgroundColor: prompt.bgColor,
                    borderColor: prompt.borderColor,
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
                    <Pressable style={styles.requestButton}>
                      <Text style={styles.requestButtonText}>Request</Text>
                    </Pressable>
                  </View>
                </View>

                <Text style={styles.promptTitle}>{prompt.title}</Text>
                <Text style={styles.authorText}>{prompt.author}</Text>
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
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#333333",
  },
  categoryChipActive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FFFFFF",
  },
  categoryText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  categoryTextActive: {
    color: "#000000",
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
    color: "#FFFFFF",
    marginBottom: 8,
    lineHeight: 20,
  },
  authorText: {
    fontSize: 12,
    color: "#999999",
    marginBottom: 12,
  },
  requestButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  requestButtonText: {
    color: "#000000",
    fontSize: 13,
    fontWeight: "600",
  },
});

export default Prompts;
