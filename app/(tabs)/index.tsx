import { useTheme } from "@/app/contexts/ThemeContext";
import Header from "@/components/Header";
import PreviewModeBanner from "@/components/PreviewModeBanner";
import { Text } from "@/components/Themedtext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  BookOpen,
  Car,
  Gamepad2,
  Gift,
  Heart,
  Home,
  PartyPopper,
  ShoppingBag,
} from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

const Index = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [selectedUni, setSelectedUni] = useState("University of South Florida");

  const universities = [
    "University of South Florida",
    "Harvard University",
    "Stanford University",
    "MIT",
    "Yale University",
  ];
  const { isDark } = useTheme();

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
    filterContainer: {
      backgroundColor: isDark ? "#000000" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    card: {
      backgroundColor: isDark ? "#000000" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    matchesBadge: {
      backgroundColor: isDark ? "#0A0A0A" : "#E0E0E0",
    },
    percentageBadge: {
      backgroundColor: isDark ? "#0A0A0A" : "#E5E5E5",
    },
    percentageText: {
      color: isDark ? "#FFFFFF" : "#000000",
    },
    avatarBorder: {
      borderColor: isDark ? "#000000" : "#FFFFFF",
    }
  };

  const matchCategories = [
    {
      id: 1,
      name: "Rides",
      subtitle: "Share rides & carpools",
      matches: 91,
      bgColor: "#eff6ff",
      iconColor: "#3b82f6",
      icon: Car,
    },
    {
      id: 2,
      name: "Roommates",
      subtitle: "Find housing & roommates",
      matches: 72,
      bgColor: "#D5F5E3",
      iconColor: "#10b981",
      icon: Home,
    },
    {
      id: 3,
      name: "Marketplace",
      subtitle: "Buy & sell items",
      matches: 86,
      bgColor: "#faf5ff",
      iconColor: "#a275fa",
      icon: ShoppingBag,
    },
    {
      id: 4,
      name: "Sports and Games",
      subtitle: "Find game partners",
      matches: 52,
      bgColor: "#fff7ed",
      iconColor: "#f3917c",
      icon: Gamepad2,
    },
    {
      id: 5,
      name: "Dating",
      subtitle: "Meet new people",
      matches: 40,
      bgColor: "#fcf2f8",
      iconColor: "#f3917c",
      icon: Heart,
    },
    {
      id: 6,
      name: "Study Groups",
      subtitle: "Events and Social gatherings",
      matches: 856,
      bgColor: "#eef2fe",
      iconColor: "#f3917c",
      icon: BookOpen,
    },
    {
      id: 7,
      name: "Giveaways",
      subtitle: "Free items and donations",
      matches: 763,
      bgColor: "#f0fdfa",
      iconColor: "#55ab9f",
      icon: Gift,
    },
    {
      id: 8,
      name: "Party",
      subtitle: "Events and Social gatherings",
      matches: 856,
      bgColor: "#ebfcf5",
      iconColor: "#55ab9f",
      icon: PartyPopper,
    },
  ];

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <View style={{ gap: 12 }}>
        <Header />
        <PreviewModeBanner />
      </View>

      <ScrollView style={styles.content}>
        {/* Filter Campus Section */}
        <View
          style={[
            styles.filterSection,
            styles.dashed,
            dynamicStyles.filterContainer,
          ]}
        >
          <View style={styles.filterHeader}>
            <Ionicons
              name="funnel-outline"
              size={16}
              color={dynamicStyles.text.color}
            />
            <Text style={[styles.filterTitle, dynamicStyles.text]}>
              Filter Campus
            </Text>

            <Text style={[styles.liveText, dynamicStyles.subtitle]}>Live</Text>
          </View>

          <View style={{ position: "relative" }}>
            <Pressable
              style={[styles.campusSelector, dynamicStyles.filterContainer]}
              onPress={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <View style={styles.campusRow}>
                <Ionicons
                  name="location-outline"
                  size={16}
                  color={dynamicStyles.text.color}
                />
                <View style={styles.dotIndicator} />
                <Text style={[styles.campusText, dynamicStyles.text]}>
                  {selectedUni}
                </Text>
                <Ionicons
                  name={isDropdownOpen ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={dynamicStyles.text.color}
                />
              </View>
            </Pressable>
          </View>

          {isDropdownOpen && (
            <View style={[styles.dropdown, dynamicStyles.filterContainer]}>
              {universities.map((uni, index) => (
                <Pressable
                  key={index}
                  style={[
                    styles.dropdownItem,
                    index !== universities.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor:
                        dynamicStyles.filterContainer.borderColor,
                    },
                  ]}
                  onPress={() => {
                    setSelectedUni(uni);
                    setIsDropdownOpen(false);
                  }}
                >
                  <Text style={[styles.dropdownText, dynamicStyles.text]}>
                    {uni}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          <Pressable style={styles.resetButton}>
            <Ionicons
              name="funnel-outline"
              size={16}
              color={dynamicStyles.text.color}
            />
            <Text style={[styles.resetText, dynamicStyles.text]}>
              Resets to My University
            </Text>
          </Pressable>
        </View>

        {/* Smart Matches Section */}
        <View style={styles.matchesSection}>
          <Text style={[styles.sectionTitle, dynamicStyles.text]}>
            Smart Matches
          </Text>
          <Text style={[styles.sectionSubtitle, dynamicStyles.subtitle]}>
            AI-powered connections with students
          </Text>

          <View style={styles.cardsGrid}>
            {matchCategories.map((category) => (
              <Pressable
                key={category.id}
                style={[styles.card, dynamicStyles.card]}
                onPress={() => {
                  router.push(`/matches/${category.id}`);
                }}
              >
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: category.bgColor },
                  ]}
                >
                  <category.icon
                    size={24}
                    color={category.iconColor}
                    strokeWidth={2}
                  />
                </View>
                <Text style={[styles.cardTitle, dynamicStyles.text]}>
                  {category.name}
                </Text>
                <Text style={[styles.cardSubtitle, dynamicStyles.subtitle]}>
                  {category.subtitle}
                </Text>
                <View style={[styles.matchesBadge, dynamicStyles.matchesBadge]}>
                  <Text style={[styles.matchesText, dynamicStyles.subtitle]}>
                    {category.matches} matches
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>

          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text style={[styles.sectionTitle, dynamicStyles.text]}>
                Recent Matches
              </Text>
              <Pressable onPress={() => setShowAllRecent(!showAllRecent)}>
                <Text style={[styles.viewAllText, dynamicStyles.subtitle]}>
                  {showAllRecent ? "Show Less" : "View All"}
                </Text>
              </Pressable>
            </View>

            {[
              {
                id: 1,
                title: "63 new in Rides",
                users: 3,
                match: "96%",
                icon: Car,
                color: "#E6D5FF",
                time: "Just now",
              },
              {
                id: 2,
                title: "51 new in Giveaways",
                users: 3,
                match: "89%",
                icon: Gift,
                color: "#D5F5E3",
                time: "Just now",
              },
              {
                id: 3,
                title: "71 new in Party",
                users: 3,
                match: "93%",
                icon: PartyPopper,
                color: "#FFD5E6",
                time: "Just now",
              },
              {
                id: 4,
                title: "67 new in Study Groups",
                users: 3,
                match: "95%",
                icon: BookOpen,
                color: "#FFF9D5",
                time: "Just now",
              },
            ]
              .slice(0, showAllRecent ? 4 : 3)
              .map((match) => (
                <Pressable
                  key={match.id}
                  style={[styles.recentCard, dynamicStyles.card]}
                  onPress={() => console.log(`Navigate to ${match.title}`)}
                >
                  <View
                    style={[
                      styles.recentIconCircle,
                      { backgroundColor: match.color },
                    ]}
                  >
                    <match.icon size={20} color="#000000" strokeWidth={2} />
                  </View>
                  <View style={styles.recentContent}>
                    <Text style={[styles.recentTitle, dynamicStyles.text]}>
                      {match.title}
                    </Text>
                    <View style={styles.recentUsers}>
                      {[...Array(match.users)].map((_, i) => (
                        <View
                          key={i}
                          style={[
                            styles.userAvatar,
                            dynamicStyles.avatarBorder,
                            i > 0 && { marginLeft: -8 },
                          ]}
                        >
                          <Text style={styles.avatarText}>
                            {String.fromCharCode(65 + i)}
                          </Text>
                        </View>
                      ))}
                      <Text style={[styles.usersText, dynamicStyles.subtitle]}>
                        +{match.users}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.recentRight}>
                    <Text style={[styles.timeText, dynamicStyles.subtitle]}>
                      {match.time}
                    </Text>
                    <View
                      style={[
                        styles.percentageBadge,
                        dynamicStyles.percentageBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.matchPercent,
                          dynamicStyles.percentageText,
                        ]}
                      >
                        {match.match}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}

            {/* Compatibility Card */}
            <Pressable
              style={[styles.compatibilityCard, dynamicStyles.filterContainer]}
            >
              <Ionicons
                name="heart-outline"
                size={24}
                color={dynamicStyles.text.color}
              />
              <View style={styles.compatibilityContent}>
                <Text style={[styles.compatibilityTitle, dynamicStyles.text]}>
                  🎉 87% avg compatibility!
                </Text>
                <Text
                  style={[styles.compatibilitySubtitle, dynamicStyles.subtitle]}
                >
                  Higher than 92% of users
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    fontFamily: "Geist-Regular",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  filterSection: {
    marginTop: 16,
    marginBottom: 24,
  },
  filterHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  liveText: {
    fontSize: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333333",
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  campusSelector: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  campusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
  },
  campusText: {
    flex: 1,
    fontSize: 14,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#333333",
    borderRadius: 8,
  },
  dashed: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 8,
    padding: 12,
  },
  resetText: {
    fontSize: 10,
  },
  matchesSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginBottom: 16,
  },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    width: "48%",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    textAlign: "center",
  },
  cardSubtitle: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 8,
  },
  matchesText: {
    fontSize: 10,
    fontWeight: "500",
  },
  recentSection: {
    marginTop: 24,
    marginBottom: 0,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
  },
  recentCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  recentIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  recentContent: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  recentUsers: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  userAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#9C27B0",
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "600",
  },
  usersText: {
    fontSize: 12,
    marginLeft: 4,
  },
  recentRight: {
    alignItems: "flex-end",
  },
  timeText: {
    fontSize: 12,
    marginBottom: 4,
  },
  matchPercent: {
    fontSize: 14,
    fontWeight: "600",
  },
  compatibilityCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    marginTop: 8,
  },
  compatibilityContent: {
    flex: 1,
  },
  compatibilityTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  compatibilitySubtitle: {
    fontSize: 12,
  },
  percentageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dropdown: {
    position: "absolute",
    top: 86,
    left: 11,
    right: 11,
    zIndex: 1000,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  dropdownItem: {
    padding: 10,
  },
  matchesBadge: {
    paddingHorizontal: 40,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "center",
  },
  dropdownText: {
    fontSize: 14,
  },
});

export default Index;
