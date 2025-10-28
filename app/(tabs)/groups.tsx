import { useTheme } from "@/app/contexts/ThemeContext";
import Header from "@/components/Header";
import { Text } from "@/components/Themedtext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

const Groups = () => {
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
    card: {
      backgroundColor: isDark ? "#0A0A0A" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    avatarBorder: {
      borderColor: isDark ? "#000000" : "#FFFFFF",
    },
    openButton: {
      backgroundColor: isDark ? "#FFFFFF" : "#000000",
    },
    openButtonText: {
      color: isDark ? "#000000" : "#FFFFFF",
    },
    ratingText: {
      color: isDark ? "#000000" : "#4A7BC8",
    },
  };

  const groups = [
    {
      id: 1,
      name: "Downtown Ride Group",
      description: "Regular rides to downtown Tampa for weekend activities",
      category: "Rides",
      categoryColor: "#E6D5FF",
      members: 4,
      unreadCount: 3,
      rating: "92%",
      activeTime: "Active 2 hours ago",
      avatarColors: ["#FF6B9D", "#4A90E2", "#9C27B0"],
    },
    {
      id: 2,
      name: "Organic Chemistry Study Circle",
      description: "Weekly study sessions for Organic Chemistry",
      category: "Study",
      categoryColor: "#D5E6FF",
      members: 2,
      unreadCount: 7,
      rating: "88%",
      activeTime: "Active 30 minutes ago",
      avatarColors: ["#FF6B9D", "#4A90E2"],
    },
    {
      id: 3,
      name: "Spring Housing Group",
      description: "Found compatible roommates for spring semester",
      category: "Roommate",
      categoryColor: "#D5F5E3",
      categoryColor2: "#FFE6D5",
      members: 4,
      unreadCount: null,
      rating: "95%",
      activeTime: "Active 1 day ago",
      avatarColors: ["#FF6B9D", "#4A90E2", "#9C27B0"],
      badges: ["Roommate", "Completed"],
    },
    {
      id: 4,
      name: "Friday Night Basketball",
      description: "Weekly basketball games every Friday evening",
      category: "Sports",
      categoryColor: "#FFE6D5",
      members: 8,
      unreadCount: 2,
      rating: "95%",
      activeTime: "Active 3 hours ago",
      avatarColors: ["#FF6B9D", "#4A90E2", "#9C27B0", "#00D084"],
    },
    {
      id: 5,
      name: "Campus Events Squad",
      description: "Attend campus events and concerts together",
      category: "Events",
      categoryColor: "#FFD5E6",
      members: 6,
      unreadCount: 5,
      rating: "91%",
      activeTime: "Active 1 hour ago",
      avatarColors: ["#FF6B9D", "#4A90E2", "#9C27B0"],
    },
  ];

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Header />

      <ScrollView style={styles.content}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={[styles.title, dynamicStyles.text]}>Your Groups</Text>
          <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
            AI-matched groups you've joined
          </Text>
        </View>

        {/* Groups List */}
        <View style={styles.groupsList}>
          {groups.map((group) => (
            <View key={group.id} style={[styles.groupCard, dynamicStyles.card]}>
              {/* Category Badges */}
              <View style={styles.badgesRow}>
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: group.categoryColor },
                  ]}
                >
                  <Ionicons name="pricetag" size={12} color="#000000" />
                  <Text style={styles.categoryText}>{group.category}</Text>
                </View>
                {group.badges && group.badges[1] && (
                  <View
                    style={[
                      styles.categoryBadge,
                      { backgroundColor: group.categoryColor2 },
                    ]}
                  >
                    <Text style={styles.categoryText}>{group.badges[1]}</Text>
                  </View>
                )}
                {/* Star Rating - moved to top right */}
                <View style={styles.ratingBadge}>
                  <Ionicons name="star-outline" size={12} color="#4A7BC8" />
                  <Text style={[styles.ratingText, dynamicStyles.ratingText]}>
                    {group.rating}
                  </Text>
                </View>
              </View>

              {/* Group Info */}
              <Text style={[styles.groupName, dynamicStyles.text]}>
                {group.name}
              </Text>
              <Text style={[styles.groupDescription, dynamicStyles.subtitle]}>
                {group.description}
              </Text>

              {/* Members Row */}
              <View style={styles.membersRow}>
                <View style={styles.avatarsContainer}>
                  {group.avatarColors.slice(0, 3).map((color, index) => (
                    <View
                      key={index}
                      style={[
                        styles.avatar,
                        { backgroundColor: color },
                        dynamicStyles.avatarBorder,
                        index > 0 && { marginLeft: -8 },
                      ]}
                    >
                      <Text style={styles.avatarText}>
                        {String.fromCharCode(65 + index)}
                      </Text>
                    </View>
                  ))}
                  <Text style={[styles.membersText, dynamicStyles.subtitle]}>
                    {group.members} members
                  </Text>
                </View>
                {/* Unread Count - moved here */}
                {group.unreadCount && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{group.unreadCount}</Text>
                  </View>
                )}
              </View>

              {/* Footer Row */}
              <View style={styles.footerRow}>
                <View style={styles.activeRow}>
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={dynamicStyles.subtitle.color}
                  />
                  <Text style={[styles.activeText, dynamicStyles.subtitle]}>
                    {group.activeTime}
                  </Text>
                </View>

                <Pressable
                  style={[styles.openButton, dynamicStyles.openButton]}
                  onPress={() => router.push(`/group-chat/${group.id}`)}
                >
                  <Ionicons
                    name="chatbubble-outline"
                    size={16}
                    color={dynamicStyles.openButtonText.color}
                  />
                  <Text
                    style={[
                      styles.openButtonText,
                      dynamicStyles.openButtonText,
                    ]}
                  >
                    Open
                  </Text>
                </Pressable>
              </View>
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
    paddingHorizontal: 16,
  },
  headerSection: {
    marginTop: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  groupsList: {
    gap: 16,
    marginBottom: 50,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  openButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  openButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "600",
  },
  groupCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#000000",
  },
  unreadBadge: {
    backgroundColor: "#FF4444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: "auto",
  },
  unreadText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  groupName: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 6,
  },
  groupDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  membersRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EBF3FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: "auto",
  },
  avatarsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  membersText: {
    fontSize: 12,
    marginLeft: 8,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  activeText: {
    fontSize: 12,
  }
});

export default Groups;
