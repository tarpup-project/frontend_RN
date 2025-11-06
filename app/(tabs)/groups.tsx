import { useTheme } from "@/app/contexts/ThemeContext";
import Header from "@/components/Header";
import {toast} from "sonner-native"
import { Text } from "@/components/Themedtext";
import { Skeleton } from "@/components/Skeleton";
import { useAuthStore } from "@/state/authStore";
import { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View, RefreshControl, Image } from "react-native";
import { useGroups, transformGroupForUI } from "@/hooks/useGroups";
import { useCampus } from "@/hooks/useCampus";

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
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Skeleton width={60} height={24} borderRadius={6} />
          <Skeleton width={60} height={24} borderRadius={6} />
        </View>
        <Skeleton width={70} height={24} borderRadius={12} />
      </View>
      
      <Skeleton width="100%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
      <Skeleton width="80%" height={12} borderRadius={4} style={{ marginBottom: 12 }} />
      
      <View style={styles.membersRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Skeleton width={28} height={28} borderRadius={14} />
          <Skeleton width={28} height={28} borderRadius={14} style={{ marginLeft: -8 }} />
          <Skeleton width={28} height={28} borderRadius={14} style={{ marginLeft: -8 }} />
          <Skeleton width={80} height={12} borderRadius={4} style={{ marginLeft: 8 }} />
        </View>
      </View>
      
      <View style={styles.footerRow}>
        <Skeleton width={100} height={12} borderRadius={4} />
        <Skeleton width={90} height={20} borderRadius={10} />
      </View>
      
      <Skeleton width="100%" height={36} borderRadius={18} style={{ marginTop: 8 }} />
    </View>
  );
};

const Groups = () => {
  const { isDark } = useTheme();
  const { data: groups, isLoading, isError, refetch, isRefetching } = useGroups();
  const { isAuthenticated } = useAuthStore();
  const { selectedUniversity } = useCampus();

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Please sign in to access groups");
      router.push("/(auth)/signin");
    }
  }, [isAuthenticated]);

  // if (!isAuthenticated) {
  //   toast.error("Please sign in to access groups");
  //   // router.push("/(auth)/signin");
  //   return null;
  // }

  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
    },
    text: {
      color: isDark ? "#FFFFFF" : "#000000",
    },
    subtitle: {
      color: isDark ? "#CCCCCC" : "#666666",
    },
    card: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
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
    categoryBadge: {
      backgroundColor: isDark ? "#FFFFFF" : "#000000",
    },
    categoryBadgeText: {
      color: isDark ? "#000000" : "#FFFFFF",
    },
    matchBadge: {
      backgroundColor: isDark? "#0A4D2E" : "#c3f3d5",
    },
    matchText: {
      color: isDark ? "#FFFFFF" : "#000000",
    },
    unreadBadge: {
      backgroundColor: isDark? "#532325" : "#f7cacf",
    },
    unreadText: {
      color: isDark? "#FFFFFF" : "#000000"
    },
    retryButton: {
      backgroundColor: isDark ? "#FFFFFF" : "#000000",
    },
    retryButtonText: {
      color: isDark ? "#000000" : "#FFFFFF",
    }
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
          <Text style={[styles.pageTitle, dynamicStyles.text]}>Your Groups</Text>
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
              <Text style={[styles.errorText, dynamicStyles.text]}>Failed to load groups</Text>
              <Text style={[styles.errorSubtext, dynamicStyles.subtitle]}>
                Check your connection and try again
              </Text>
              <Pressable 
                style={[styles.retryButton, dynamicStyles.retryButton]}
                onPress={() => refetch()}
              >
                <Text style={[styles.retryButtonText, dynamicStyles.retryButtonText]}>
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
              <Text style={[styles.emptyText, dynamicStyles.text]}>No groups yet</Text>
              <Text style={[styles.emptySubtext, dynamicStyles.subtitle]}>
                Join or create a group to get started
              </Text>
            </View>
          )}

          {/* Groups List */}
          {!isLoading && !isError && groups && groups.length > 0 && 
            groups.map(transformGroupForUI).map((group) => (
              <View key={group.id} style={[styles.groupCard, dynamicStyles.card]}>
                <View style={styles.topRow}>
                  <View style={[styles.categoryBadge, dynamicStyles.categoryBadge]}>
                    <Ionicons 
                      name={group.categoryIcon as any}
                      size={12} 
                      color="#d26925"
                    />
                    <Text style={[styles.categoryText, dynamicStyles.categoryBadgeText]}>
                      {group.category}
                    </Text>
                  </View>

                  <View style={[styles.matchBadge, dynamicStyles.matchBadge]}>
                    <Ionicons name="star-outline" size={12} color={dynamicStyles.matchText.color} />
                    <Text style={[styles.matchText, dynamicStyles.matchText]}>
                      {group.matchPercentage} match
                    </Text>
                  </View>
                </View>

                <Text style={[styles.groupTitle, dynamicStyles.text]}>
                  {group.title}
                </Text>
                <Text style={[styles.groupDescription, dynamicStyles.subtitle]}>
                  {group.description}
                </Text>

                <View style={styles.membersRow}>
                  <View style={styles.avatarsContainer}>
                    {group.rawGroup.members.slice(0, 3).map((member, index) => (
                      <View
                        key={member.id}
                        style={[
                          styles.avatar,
                          { backgroundColor: member.bgUrl ? 'transparent' : group.avatarColors[index] },
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
                    <Text style={[styles.membersText, dynamicStyles.subtitle]}>
                      {group.members} {group.members === 1 ? 'member' : 'members'}
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

                  <View style={[styles.unreadBadge, dynamicStyles.unreadBadge]}>
                    <Text style={[styles.unreadText, dynamicStyles.unreadText]}>
                      {group.unreadCount} new messages
                    </Text>
                  </View>
                </View>

                <Pressable
                  style={[styles.openButton, dynamicStyles.openButton]}
                  onPress={() => {
                    console.log('Navigating to group:', group.id);
                    router.push(`/group-chat/${group.id}`);
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
            ))
          }
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
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 14,
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
    fontSize: 11,
    fontWeight: "600",
  },
  matchBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  matchText: {
    fontSize: 11,
    fontWeight: "600",
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  groupDescription: {
    fontSize: 12,
    lineHeight: 20,
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
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  membersText: {
    fontSize: 13,
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
    fontSize: 11,
    fontWeight: "600",
  },
  openButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 4,
  },
  openButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  // Error and empty states
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: 'center',
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
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
});

export default Groups;