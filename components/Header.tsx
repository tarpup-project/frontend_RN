import AuthModal from "@/components/AuthModal";
import { Text } from "@/components/Themedtext";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotifications } from "@/hooks/useNotification";
import { useAuthStore } from "@/state/authStore";
import { useNotificationStore } from "@/state/notificationStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Header = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const { isAuthenticated } = useAuthStore();
  const {
    personalNotifications,
    clearNotifications,
    initialized,
    markInitialized,
  } = useNotificationStore();
  const { groupNotifications, personalNotifications: apiPersonalNotifications } = useNotifications();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;

  // No notifications to show - all API calls removed
  const totalNotifications = 0;

  // Simplified effects - no notification loading
  useEffect(() => {
    if (isAuthenticated && !initialized) {
      markInitialized();
    }
  }, [isAuthenticated, initialized, markInitialized]);

  useEffect(() => { 
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handleNotificationPress = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
    } else {
      setShowNotificationPanel(true);
      // Slide in animation
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleCloseNotificationPanel = () => {
    // Slide out animation
    Animated.timing(slideAnim, {
      toValue: Dimensions.get('window').width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowNotificationPanel(false);
    });
  };

  const handleChatPress = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
    } else {
      clearNotifications('personal');
      router.push("/chat");
    }
  };

  const handleThemeToggle = () => {
    toggleTheme();
  };

  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
      borderBottomColor: isDark ? "#333333" : "#E0E0E0",
    },
    title: {
      color: isDark ? "#FFFFFF" : "#0a0a0a",
    },
    icon: {
      color: isDark ? "#FFFFFF" : "#0a0a0a",
    },
    chatButton: {
      backgroundColor: isDark ? "#FFFFFF" : "#0a0a0a",
    },
    chatText: {
      color: isDark ? "#0a0a0a" : "#FFFFFF",
    },
  };

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View
        style={[
          styles.container,
          dynamicStyles.container,
          { paddingTop: insets.top + 12 },
        ]}
      >
        {/* Left side - Notification Bell and Theme Toggle */}
        <View style={styles.leftContainer}>
          <Pressable 
            style={styles.notificationButton} 
            onPress={handleNotificationPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons 
              name="notifications-outline" 
              size={24} 
              color={isAuthenticated ? dynamicStyles.icon.color : "#999999"} 
            />
            {/* No badge - notifications are disabled */}
          </Pressable>
          
          <Pressable style={styles.iconButton} onPress={handleThemeToggle} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            {isDark ? (
              <Ionicons name="moon" size={20} color={dynamicStyles.icon.color} />
            ) : (
              <Ionicons name="sunny" size={20} color={dynamicStyles.icon.color} />
            )}
          </Pressable>
        </View>

        {/* Center - Empty space */}
        <View style={styles.titleContainer}>
        </View>

        {/* Right side - Chat Button Only */}
        <View style={styles.iconsContainer}>
          <Pressable
              style={[styles.chatButton, dynamicStyles.chatButton]}
              onPress={handleChatPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}              
            >
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <View style={styles.chatContent}>
                <Ionicons
                  name="chatbubble-outline"
                  size={18}
                  color={dynamicStyles.chatText.color}
                />
                <Text style={[styles.chatText, dynamicStyles.chatText]}>
                  AI Chat
                </Text>
              </View>
              {personalNotifications > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {personalNotifications > 99 ? '99+' : personalNotifications}
                  </Text>
                </View>
              )}
              </Animated.View>
              </Pressable>
        </View>
      </View>
      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* Simplified Notification Panel - Empty State */}
      <Modal
        visible={showNotificationPanel}
        transparent={true}
        animationType="none"
        onRequestClose={handleCloseNotificationPanel}
      >
        <View style={styles.modalOverlay}>
          <Pressable 
            style={styles.modalBackdrop} 
            onPress={handleCloseNotificationPanel}
          />
          <Animated.View 
            style={[
              styles.notificationPanel,
              { 
                backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
                transform: [{ translateX: slideAnim }]
              }
            ]}
          >
            {/* Panel Header */}
            <View style={[styles.panelHeader, { paddingTop: insets.top + 12 }]}>
              <View style={styles.panelHeaderContent}>
                <View style={styles.panelTitleRow}>
                  <View style={[styles.bellIconContainer, { backgroundColor: isDark ? "#333333" : "#F3F4F6" }]}>
                    <Ionicons name="notifications" size={20} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
                  </View>
                  <View>
                    <Text style={[styles.panelTitle, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>
                      Notifications
                    </Text>
                    <Text style={[styles.panelSubtitle, { color: isDark ? "#CCCCCC" : "#666666" }]}>
                      No notifications
                    </Text>
                  </View>
                </View>
                <Pressable 
                  style={styles.closeButton} 
                  onPress={handleCloseNotificationPanel}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={24} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
                </Pressable>
              </View>
            </View>

            {/* Empty State */}
            <ScrollView style={styles.notificationsList} showsVerticalScrollIndicator={false}>
              <View style={styles.emptyState}>
                <Ionicons name="notifications-off-outline" size={48} color="#9CA3AF" />
                <Text style={[styles.emptyText, { color: isDark ? "#CCCCCC" : "#666666" }]}>
                  No notifications
                </Text>
                <Text style={[styles.emptySubtext, { color: isDark ? "#999999" : "#999999" }]}>
                  All notification fetching has been disabled
                </Text>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
  },
  iconsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  notificationButton: {
    position: "relative",
    padding: 8,
  },
  notificationBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  iconButton: {
    padding: 8,
  },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    position: "relative",
  },
  chatContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chatText: {
    fontSize: 14,
    fontWeight: "600",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalBackdrop: {
    flex: 1,
  },
  notificationPanel: {
    position: "absolute",
    top: 0,
    right: 0,
    width: Dimensions.get('window').width * 0.85,
    height: "100%",
    shadowColor: "#000",
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  panelHeader: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  panelHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  panelTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bellIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  panelSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  notificationsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default Header;