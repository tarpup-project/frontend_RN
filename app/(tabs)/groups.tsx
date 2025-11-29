import Header from "@/components/Header";
import { Skeleton } from "@/components/Skeleton";
import { Text } from "@/components/Themedtext";
import { useTheme } from "@/contexts/ThemeContext";
import { useCampus } from "@/hooks/useCampus";
import { transformGroupForUI, useGroups } from "@/hooks/useGroups";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

const iconMap: Record<string, string> = {
  "briefcase-business": "briefcase-outline",
  "users-round": "people-outline",
  "gamepad-2": "game-controller-outline",
  gift: "gift-outline",
  "shopping-bag": "bag-outline",
  "party-popper": "balloon-outline",
  car: "car-outline",
  "bed-double": "bed-outline",
  volleyball: "football-outline",
  "book-open-text": "book-outline",
};

const GroupSkeletonCard = ({ isDark }: { isDark: boolean }) => {
  return (
    <View
      style={[
        styles.groupCard,
        {
          backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
          borderColor: isDark ? "#333333" : "#E0E0E0",
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Skeleton width={60} height={24} borderRadius={6} />
          <Skeleton width={60} height={24} borderRadius={6} />
        </View>
        <Skeleton width={70} height={24} borderRadius={12} />
      </View>

      <Skeleton
        width="100%"
        height={16}
        borderRadius={4}
        style={{ marginBottom: 8 }}
      />
      <Skeleton
        width="80%"
        height={12}
        borderRadius={4}
        style={{ marginBottom: 12 }}
      />

      <View style={styles.membersRow}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Skeleton width={28} height={28} borderRadius={14} />
          <Skeleton
            width={28}
            height={28}
            borderRadius={14}
            style={{ marginLeft: -8 }}
          />
          <Skeleton
            width={28}
            height={28}
            borderRadius={14}
            style={{ marginLeft: -8 }}
          />
          <Skeleton
            width={80}
            height={12}
            borderRadius={4}
            style={{ marginLeft: 8 }}
          />
        </View>
      </View>

      <View style={styles.footerRow}>
        <Skeleton width={100} height={12} borderRadius={4} />
        <Skeleton width={90} height={20} borderRadius={10} />
      </View>

      <Skeleton
        width="100%"
        height={36}
        borderRadius={18}
        style={{ marginTop: 8 }}
      />
    </View>
  );
};

const getGroupIconByCategory = (categoryName: string) => {
  console.log("Input category name:", categoryName);
  const categoryIconMap: Record<string, string> = {
    giveaway: "gift-outline",
    sports: "football-outline",
    games: "game-controller-outline",
    friends: "people-outline",
    market: "storefront-outline",
    party: "wine-outline",
    rides: "car-outline",
    roommates: "home-outline",
    dating: "heart-outline",
    "study group": "book-outline",
  };

  const normalized = categoryName.toLowerCase().trim();

  const result = categoryIconMap[normalized] || "pricetag-outline";
  return result;
};

const getIconComponent = (iconName: string) => {
  const normalizedName = iconName.toLowerCase();
  return iconMap[normalizedName] || "pricetag-outline";
};

const Groups = () => {
  const { isDark } = useTheme();
  const {
    data: groups,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useGroups();
  const [dropdownVisible, setDropdownVisible] = useState<string | null>(null);
  const { selectedUniversity } = useCampus();

  const toggleDropdown = (groupId: string) => {
    setDropdownVisible(dropdownVisible === groupId ? null : groupId);
  };

  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
    },
    text: {
      color: isDark ? "#FFFFFF" : "#0a0a0a",
    },
    subtitle: {
      color: isDark ? "#CCCCCC" : "#666666",
    },
    card: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    avatarBorder: {
      borderColor: isDark ? "#0a0a0a" : "#FFFFFF",
    },
    openButton: {
      backgroundColor: isDark ? "#FFFFFF" : "#000000",
    },
    openButtonText: {
      color: isDark ? "#0a0a0a" : "#FFFFFF",
    },
    categoryBadge: {
      backgroundColor: isDark ? "#FFFFFF" : "#000000",
    },
    categoryBadgeText: {
      color: isDark ? "#0a0a0a" : "#FFFFFF",
    },
    matchBadge: {
      backgroundColor: isDark ? "#234a29" : "#c3f3d5",
    },
    matchText: {
      color: isDark ? "#FFFFFF" : "#0a0a0a",
    },
    unreadBadge: {
      backgroundColor: isDark ? "#532325" : "#f7cacf",
    },
    unreadText: {
      color: isDark ? "#FFFFFF" : "#0a0a0a",
    },
    retryButton: {
      backgroundColor: isDark ? "#FFFFFF" : "#000000",
    },
    retryButtonText: {
      color: isDark ? "#0a0a0a" : "#FFFFFF",
    },
    dropdown: {
      backgroundColor: isDark ? "#1a1a1a" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    dropdownItem: {
      backgroundColor: isDark ? "#1a1a1a" : "#FFFFFF",
    },
    dropdownText: {
      color: isDark ? "#FFFFFF" : "#0a0a0a",
    },
    dropdownDanger: {
      color: isDark ? "#FF6B6B" : "#E74C3C",
    },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Header />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        <View style={styles.headerSection}>
          <Text style={[styles.pageTitle, dynamicStyles.text]}>
            Your Groups
          </Text>
          <Text style={[styles.pageSubtitle, dynamicStyles.subtitle]}>
            AI-matched groups you've joined
            {selectedUniversity && ` • ${selectedUniversity.name}`}
          </Text>
        </View>

        <View style={styles.groupsList}>
          {/* Loading State */}
          {isLoading && (
            <>
              <GroupSkeletonCard isDark={isDark} />
              <GroupSkeletonCard isDark={isDark} />
              <GroupSkeletonCard isDark={isDark} />
              <GroupSkeletonCard isDark={isDark} />
            </>
          )}

          {/* Error State */}
          {!isLoading && isError && (
            <View style={styles.centerContainer}>
              <Ionicons
                name="alert-circle-outline"
                size={48}
                color={isDark ? "#FF6B6B" : "#E74C3C"}
              />
              <Text style={[styles.errorText, dynamicStyles.text]}>
                Failed to load groups
              </Text>
              <Text style={[styles.errorSubtext, dynamicStyles.subtitle]}>
                Check your connection and try again
              </Text>
              <Pressable
                style={[styles.retryButton, dynamicStyles.retryButton]}
                onPress={() => refetch()}
              >
                <Text
                  style={[
                    styles.retryButtonText,
                    dynamicStyles.retryButtonText,
                  ]}
                >
                  Try Again
                </Text>
              </Pressable>
            </View>
          )}

          {/* Empty State */}
          {!isLoading && !isError && (!groups || groups.length === 0) && (
            <View style={styles.centerContainer}>
              <Ionicons
                name="people-outline"
                size={48}
                color={dynamicStyles.subtitle.color}
              />
              <Text style={[styles.emptyText, dynamicStyles.text]}>
                No groups yet
              </Text>
              <Text style={[styles.emptySubtext, dynamicStyles.subtitle]}>
                Join or create a group to get started
              </Text>
            </View>
          )}

          {/* Groups List */}
          {!isLoading &&
            !isError &&
            groups &&
            groups.length > 0 &&
            groups
    .slice() 
    .sort((a, b) => {
      if (a.unread > 0 && b.unread === 0) return -1;
      if (a.unread === 0 && b.unread > 0) return 1;      

      if (a.unread > 0 && b.unread > 0) {
        return b.unread - a.unread;
      }
      
      const dateA = new Date(a.lastMessageAt || a.createdAt).getTime();
      const dateB = new Date(b.lastMessageAt || b.createdAt).getTime();
      return dateB - dateA;
    })
            .map(transformGroupForUI).map((group) => {
              return (
                <View
                  key={group.id}
                  style={[styles.groupCard, dynamicStyles.card]}
                >
                  <View style={styles.topRow}>
                    <View
                      style={[
                        styles.categoryBadge,
                        dynamicStyles.categoryBadge,
                      ]}
                    >
                      <Ionicons
  name={getIconComponent(group.rawGroup.category[0].icon) as any}
  size={12}
  color={group.rawGroup.category[0].colorHex}
/>
                      <Text
                        style={[
                          styles.categoryText,
                          dynamicStyles.categoryBadgeText,
                        ]}
                      >
                        {group.category}
                      </Text>
                    </View>

                    <View style={[styles.matchBadge, dynamicStyles.matchBadge]}>
                      <Ionicons
                        name="star-outline"
                        size={12}
                        color={dynamicStyles.matchText.color}
                      />
                      <Text style={[styles.matchText, dynamicStyles.matchText]}>
                        {group.matchPercentage} match
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.groupTitle, dynamicStyles.text]}>
                    {group.title}
                  </Text>
                  <Text
                    style={[styles.groupDescription, dynamicStyles.subtitle]}
                  >
                    {group.description}
                  </Text>

                  <View style={styles.membersRow}>
                    <View style={styles.avatarsContainer}>
                      {group.rawGroup.members
                        .slice(0, 3)
                        .map((member, index) => (
                          <View
                            key={member.id}
                            style={[
                              styles.avatar,
                              {
                                backgroundColor: member.bgUrl
                                  ? "transparent"
                                  : group.avatarColors[index],
                              },
                              dynamicStyles.avatarBorder,
                              index > 0 && { marginLeft: -8 },
                            ]}
                          >
                            {member.bgUrl ? (
                              <Image
                                source={{ uri: member.bgUrl }}
                                style={styles.avatarImage}
                              />
                            ) : (
                              <Text style={styles.avatarText}>
                                {member.fname[0].toUpperCase()}
                              </Text>
                            )}
                          </View>
                        ))}
                      <Text
                        style={[styles.membersText, dynamicStyles.subtitle]}
                      >
                        {group.members}{" "}
                        {group.members === 1 ? "member" : "members"}
                      </Text>
                    </View>
                  </View>

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

                    <View
                      style={[styles.unreadBadge, dynamicStyles.unreadBadge]}
                    >
                      <Text
                        style={[styles.unreadText, dynamicStyles.unreadText]}
                      >
                        {group.unreadCount} new messages
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    style={[styles.openButton, dynamicStyles.openButton]}
                    onPress={() => {
                      router.push({
                        pathname: `/group-chat/${group.id}` as any,
                        params: { 
                          groupData: JSON.stringify(group.rawGroup) 
                        }
                      });
                    }}
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
                      Open Chat
                    </Text>
                  </Pressable>
                </View>
              );
            })}
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  headerSection: {
    marginTop: 16,
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 12,
  },
  groupsList: {
    gap: 16,
    marginBottom: 50,
  },
  groupCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 8,
    fontWeight: "600",
  },
  matchBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 12,
  },
  matchText: {
    fontSize: 10,
    fontWeight: "600",
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  groupDescription: {
    fontSize: 12,
    lineHeight: 18,
  },
  membersRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  membersText: {
    fontSize: 11,
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
    fontSize: 10,
  },
  unreadBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unreadText: {
    fontSize: 10,
    fontWeight: "600",
  },
  openButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 4,
  },
  openButtonText: {
    fontSize: 11,
    fontWeight: "700",
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
  },
});

export default Groups;
