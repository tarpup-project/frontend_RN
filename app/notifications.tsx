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
          <View style={styles.placeholder} />
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
                <Text style={[styles.summaryCount, { color: "#EF4444" }]}>{groupNotifications + personalNotifications}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Placeholder for future notification list */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, dynamicStyles.text]}>Recent Notifications</Text>
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No notifications to display</Text>
            <Text style={styles.emptySubtext}>You'll see your notifications here when you receive them</Text>
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
  placeholder: {
    width: 40,
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
});

export default NotificationsScreen;