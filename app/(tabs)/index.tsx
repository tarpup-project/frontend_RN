import Header from "@/components/Header";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

const Index = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedUni, setSelectedUni] = useState("University of South Florida");

  const universities = [
    "University of South Florida",
    "Harvard University",
    "Stanford University",
    "MIT",
    "Yale University",
  ];
  const theme = useColorScheme() || "light";
  const isDark = theme === "dark";

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
      backgroundColor: isDark ? "#000000" : "#F5F5F5",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    card: {
      backgroundColor: isDark ? "#000000" : "#F5F5F5",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
  };

  const matchCategories = [
    {
      id: 1,
      name: "Rides",
      subtitle: "Share rides & carpools",
      matches: 91,
      bgColor: "#E6D5FF",
      icon: "car",
    },
    {
      id: 2,
      name: "Roommates",
      subtitle: "Find housing & roommates",
      matches: 72,
      bgColor: "#D5F5E3",
      icon: "home",
    },
    {
      id: 3,
      name: "Marketplace",
      subtitle: "Buy & sell items",
      matches: 86,
      bgColor: "#FFE6F0",
      icon: "bag",
    },
    {
      id: 4,
      name: "Sports & Games",
      subtitle: "Find game partners",
      matches: 52,
      bgColor: "#FFE6D5",
      icon: "basketball",
    },
    {
      id: 5,
      name: "Dating",
      subtitle: "Meet new people",
      matches: 40,
      bgColor: "#FFD5E6",
      icon: "heart",
    },
    {
      id: 6,
      name: "Study Groups",
      subtitle: "Events and Social gatherings",
      matches: 856,
      bgColor: "#D5E6FF",
      icon: "book",
    },
    {
      id: 7,
      name: "Giveaways",
      subtitle: "Free items and donations",
      matches: 763,
      bgColor: "#5CE1E6",
      icon: "gift",
    },
    {
      id: 8,
      name: "Party",
      subtitle: "Events and Social gatherings",
      matches: 856,
      bgColor: "#00D084",
      icon: "balloon",
    },
  ];

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Header />

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
              name="filter-outline"
              size={16}
              color={dynamicStyles.text.color}
            />
            <Text style={[styles.filterTitle, dynamicStyles.text]}>
              Filter Campus
            </Text>
            <Text style={[styles.liveText, dynamicStyles.subtitle]}>Live</Text>
          </View>
          
          <View style={{ position: 'relative' }}>
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
              name="filter-outline"
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
                  console.log(`Navigate to ${category.name}`);
                }}
              >
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: category.bgColor },
                  ]}
                >
                  <Ionicons
                    name={category.icon as any}
                    size={24}
                    color="#000000"
                  />
                </View>
                <Text style={[styles.cardTitle, dynamicStyles.text]}>
                  {category.name}
                </Text>
                <Text style={[styles.cardSubtitle, dynamicStyles.subtitle]}>
                  {category.subtitle}
                </Text>
                <Text style={[styles.matchesText, dynamicStyles.subtitle]}>
                  {category.matches} matches
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text style={[styles.sectionTitle, dynamicStyles.text]}>
                Recent Matches
              </Text>
              <Pressable onPress={() => console.log("View All")}>
                <Text style={[styles.viewAllText, dynamicStyles.subtitle]}>
                  View All
                </Text>
              </Pressable>
            </View>

            {[
              {
                id: 1,
                title: "63 new in Rides",
                users: 3,
                match: "96%",
                icon: "car",
                color: "#E6D5FF",
                time: "Just now",
              },
              {
                id: 2,
                title: "51 new in Giveaways",
                users: 3,
                match: "89%",
                icon: "gift",
                color: "#D5F5E3",
                time: "Just now",
              },
              {
                id: 3,
                title: "71 new in Party",
                users: 3,
                match: "93%",
                icon: "musical-notes",
                color: "#FFD5E6",
                time: "Just now",
              },
              {
                id: 4,
                title: "67 new in Study Groups",
                users: 3,
                match: "95%",
                icon: "book",
                color: "#D5E6FF",
                time: "Just now",
              },
            ].map((match) => (
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
                  <Ionicons
                    name={match.icon as any}
                    size={20}
                    color="#000000"
                  />
                </View>
                <View style={styles.recentContent}>
                  <Text style={[styles.recentTitle, dynamicStyles.text]}>
                    {match.title}
                  </Text>
                  <View style={styles.recentUsers}>
                    {[...Array(match.users)].map((_, i) => (
                      <View key={i} style={styles.userAvatar} />
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
                  <Text style={[styles.matchPercent, dynamicStyles.text]}>
                    {match.match}
                  </Text>
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
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  liveText: {
    fontSize: 12,
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
    borderRadius: 3,
    backgroundColor: "#4CAF50",
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
    fontSize: 14,
  },
  matchesSection: {
    marginBottom: 80,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    width: "48%",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    textAlign: "center",
  },
  cardSubtitle: {
    fontSize: 11,
    textAlign: "center",
    marginBottom: 8,
  },
  matchesText: {
    fontSize: 12,
    fontWeight: "500",
  },
  recentSection: {
    marginTop: 24,
    marginBottom: 24,
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
  dropdown: {
    position: 'absolute',
    top: 95,
    left: 0,
    right: 0,
    zIndex: 1000,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  dropdownItem: {
    padding: 10,
  },
  dropdownText: {
    fontSize: 14,
  },
});

export default Index;
