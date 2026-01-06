import { Text } from "@/components/Themedtext";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotifications } from "@/hooks/useNotification";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const NotificationsScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isDark } = useTheme();
  const { groupNotifications, personalNotifications } = useNotifications();

  // Helper function to format time ago
  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
    },
    header: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
      borderBottomColor: isDark ? "#333333" : "#E0E0E0",
    },
    text: {
      color: isDark ? "#FFFFFF" : "#0a0a0a",
    },
    icon: {
      color: isDark ? "#FFFFFF" : "#0a0a0a",
    },
    card: {
      backgroundColor: isDark ? "#1A1A1A" : "#F8F9FA",
    },
    subtitle: {
      color: isDark ? "#9AA0A6" : "#666666",
    },
  };

  const handleMarkAllRead = () => {
    // No notifications to mark as read
    console.log('No notifications to mark as read');
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      {/* Header */}
      <View style={[styles.header, dynamicStyles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerContent}>
          <Pressable 
            style={styles.backButton} 
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={dynamicStyles.icon.color} />
          </Pressable>
          <Text style={[styles.headerTitle, dynamicStyles.text]}>Notifications</Text>
          <Pressable onPress={handleMarkAllRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, dynamicStyles.text]}>Notification Summary</Text>
          
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Ionicons name="people-outline" size={24} color="#3B82F6" />
              <View style={styles.summaryText}>
                <Text style={[styles.summaryLabel, dynamicStyles.text]}>Group Notifications</Text>
                <Text style={[styles.summaryCount, { color: "#3B82F6" }]}>{groupNotifications}</Text>
              </View>
            </View>
            
            <View style={styles.summaryItem}>
              <Ionicons name="person-outline" size={24} color="#10B981" />
              <View style={styles.summaryText}>
                <Text style={[styles.summaryLabel, dynamicStyles.text]}>Personal Notifications</Text>
                <Text style={[styles.summaryCount, { color: "#10B981" }]}>{personalNotifications}</Text>
              </View>
            </View>
            
            <View style={styles.summaryItem}>
              <Ionicons name="notifications-outline" size={24} color="#EF4444" />
              <View style={styles.summaryText}>
                <Text style={[styles.summaryLabel, dynamicStyles.text]}>Total Notifications</Text>
                <Text style={[styles.summaryCount, { color: "#EF4444" }]}>
                  {groupNotifications + personalNotifications}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Notifications List */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, dynamicStyles.text]}>Recent Notifications</Text>
          
          {/* Group Notifications */}
          {groupNotifications > 0 && (
            <View style={[styles.notificationItem, dynamicStyles.card]}>
              <View style={styles.notificationIcon}>
                <Ionicons name="people" size={24} color="#3B82F6" />
              </View>
              <View style={styles.notificationContent}>
                <Text style={[styles.notificationTitle, dynamicStyles.text]}>Group Activity</Text>
                <Text style={[styles.notificationMessage, dynamicStyles.subtitle]}>
                  You have {groupNotifications} group notification{groupNotifications > 1 ? 's' : ''}
                </Text>
                <Text style={[styles.notificationTime, dynamicStyles.subtitle]}>Recent</Text>
              </View>
            </View>
          )}
          
          {personalNotifications > 0 && (
            <View style={[styles.notificationItem, dynamicStyles.card]}>
              <View style={styles.notificationIcon}>
                <Ionicons name="person" size={24} color="#10B981" />
              </View>
              <View style={styles.notificationContent}>
                <Text style={[styles.notificationTitle, dynamicStyles.text]}>Personal Activity</Text>
                <Text style={[styles.notificationMessage, dynamicStyles.subtitle]}>
                  You have {personalNotifications} personal notification{personalNotifications > 1 ? 's' : ''}
                </Text>
                <Text style={[styles.notificationTime, dynamicStyles.subtitle]}>Recent</Text>
              </View>
            </View>
          )}

          {/* Empty state when no notifications */}
          {groupNotifications === 0 && personalNotifications === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No notifications to display</Text>
              <Text style={styles.emptySubtext}>You'll see your notifications here when you receive them</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllText: {
    color: "#3B82F6",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#F59E0B",
  },
  viewAllText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  summaryCard: {
    gap: 16,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    position: "relative",
  },
  summaryText: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  summaryCount: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 2,
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#9CA3AF",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    position: "relative",
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
  },
  unreadDot: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3B82F6",
  },
});

export default NotificationsScreen;