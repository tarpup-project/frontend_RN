import AuthModal from "@/components/AuthModal";
import ProtectedTabIcon from "@/components/ProtectedTabIcon";
import { useTheme } from "@/contexts/ThemeContext";
import { fetchGroups, groupsKeys } from "@/hooks/useGroups";
import { useNotifications } from "@/hooks/useNotification";
import { useUnifiedGroups } from "@/hooks/useUnifiedGroups";
import { useAuthStore } from "@/state/authStore";
import { useCampusStore } from "@/state/campusStore";
import { useNotificationStore } from "@/state/notificationStore";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

import { useUnseenTarps } from "@/hooks/useUnseenTarps";
import { useTarpsStore } from "@/state/tarpsStore";

export default function TabLayout() {
  const { isDark } = useTheme();
  const { isAuthenticated, user } = useAuthStore();
  const { selectedUniversity } = useCampusStore();
  const queryClient = useQueryClient();
  const { setNotifications } = useNotificationStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const {
    groupNotifications,
    personalNotifications,
    refetchNotifications
  } = useNotifications();

  // Use global unseen check
  useUnseenTarps();
  const { unseenCount: unseenTarpsCount } = useTarpsStore();

  const { uiGroups } = useUnifiedGroups();
  const unreadTotal = useMemo(() => {
    return (uiGroups || []).reduce((sum: number, g: any) => sum + (Number(g.unreadCount || 0)), 0);
  }, [uiGroups]);

  // Initial fetch of groups to speed up unread count display
  useEffect(() => {
    if (isAuthenticated) {
      // Use selected university or fallback to user's home university
      const campusId = selectedUniversity?.id || user?.universityID;

      console.log('🚀 Initial fetch of groups/DMs to update unread counts for campus:', campusId || 'all');

      fetchGroups(campusId)
        .then((groups) => {
          // Update the cache immediately for the specific campus ID we used
          queryClient.setQueryData(groupsKeys.list(campusId), groups);

          // Calculate and update global unread count
          const totalUnread = groups.reduce((sum, group) => sum + (group.unread || 0), 0);
          console.log('📊 Initial unread count from fetch:', totalUnread);

          if (totalUnread > 0) {
            setNotifications({ groupNotifications: totalUnread });
          }
        })
        .catch(err => console.error('❌ Initial fetch failed:', err));
    }
  }, [isAuthenticated, selectedUniversity?.id, user?.universityID]);

  // Refresh notifications when tab layout mounts or when switching tabs
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔄 Tab layout active, refreshing notifications');
      refetchNotifications();
    }
  }, [isAuthenticated, refetchNotifications]);

  // Listen for socket events to update notifications in real-time
  useEffect(() => {
    // This hook is now redundant as SocketProvider handles it, 
    // but we'll keep it for now or remove if causing issues.
    // The key is that ProtectedTabIcon uses the reactive values from useNotifications hook
  }, []);

  return (
    <>
      <Tabs
        key={isDark ? "dark" : "light"}
        screenOptions={{
          headerShown: false,
          freezeOnBlur: false,
          tabBarActiveTintColor: isDark ? "#FFFFFF" : "#0a0a0a",
          tabBarInactiveTintColor: isDark ? "#666666" : "#999999",
          tabBarStyle: {
            backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
            borderTopColor: isDark ? "#333333" : "#E0E0E0",
            borderTopWidth: 1,
            height: Platform.select({ ios: 80, android: 70 }),
            overflow: "visible"
          },
          tabBarItemStyle: {
            paddingVertical: 2,
            paddingHorizontal: 2
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "500"
          }
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Spot",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name="home" size={24} color={color} />
            )
          }}
        />

        <Tabs.Screen
          name="prompts"
          options={{
            title: "Prompts",
            tabBarIcon: ({ color, focused }) => (
              <ProtectedTabIcon
                name={focused ? "pulse" : "pulse-outline"}
                size={24}
                color={color}
                focused={focused}
                isProtected={false}
                notificationCount={0}
              />
            )
          }}
        />
        <Tabs.Screen
          name="groups"
          options={{
            title: "Chats",
            tabBarIcon: ({ color, focused }) => (
              <ProtectedTabIcon
                name={focused ? "chatbubble" : "chatbubble-outline"}
                size={24}
                color={isAuthenticated ? color : "#999999"}
                focused={focused}
                isProtected={!isAuthenticated}
                notificationCount={isAuthenticated ? unreadTotal : 0}
              />
            )
          }}
          listeners={{
            tabPress: (e) => {
              if (!isAuthenticated) {
                e.preventDefault();
                setShowAuthModal(true);
              }
            }
          }}
        />
        <Tabs.Screen
          name="tarps"
          options={{
            title: "Tarps",
            tabBarIcon: ({ color, focused }) => (
              <ProtectedTabIcon
                name={focused ? "location" : "location-outline"}
                size={28}
                color={color}
                focused={focused}
                isProtected={false}
                notificationCount={unseenTarpsCount > 0 ? 1 : 0}
                badgeType="dot"
              />
            )
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, focused }) => (
              <ProtectedTabIcon
                name={focused ? "person" : "person-outline"}
                size={24}
                color={isAuthenticated ? color : "#999999"}
                focused={focused}
                isProtected={!isAuthenticated}
                notificationCount={0}
              />
            )
          }}
          listeners={{
            tabPress: (e) => {
              if (!isAuthenticated) {
                e.preventDefault();
                setShowAuthModal(true);
              }
            }
          }}
        />

        <Tabs.Screen name="edit-profile" options={{ href: null }} />
        <Tabs.Screen name="account-settings" options={{ href: null }} />
        <Tabs.Screen name="notifications" options={{ href: null }} />
        <Tabs.Screen name="privacy" options={{ href: null }} />
        <Tabs.Screen name="how-it-works" options={{ href: null }} />
      </Tabs>

      <AuthModal visible={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}