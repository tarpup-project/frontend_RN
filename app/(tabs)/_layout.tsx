import AuthModal from "@/components/AuthModal";
import ProtectedTabIcon from "@/components/ProtectedTabIcon";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotifications } from "@/hooks/useNotification";
import { useAuthStore } from "@/state/authStore";
import { Tabs } from "expo-router";
import { Activity, Home, UserRound, UsersRound } from "lucide-react-native";
import { useState } from "react";

export default function TabLayout() {
  const { isDark } = useTheme();
  const { isAuthenticated } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { groupNotifications, personalNotifications } = useNotifications();

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

            height: 80,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "500",
          },
          tabBarItemStyle: {
            borderRadius: 12,
            marginHorizontal: 4,
            overflow: "hidden",
            paddingVertical: 10, 
            paddingHorizontal: 10, 
            minHeight: 50, 
            minWidth: 50,
          },
          tabBarInactiveBackgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Spot",
            tabBarIcon: ({ color, focused }) => (
              <Home size={20} color={color} strokeWidth={focused ? 2.5 : 2} />
            ),
          }}
        />
        <Tabs.Screen
          name="prompts"
          options={{
            title: "Prompts",
            tabBarIcon: ({ color, focused }) => (
              <Activity
                size={20}
                color={color}
                strokeWidth={focused ? 2.5 : 2}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="groups"
          options={{
            title: "Groups",
            tabBarIcon: ({ color, focused }) => (
              <ProtectedTabIcon
                IconComponent={UsersRound}
                size={20}
                color={isAuthenticated ? color : isDark ? "#666666" : "#999999"}
                strokeWidth={2}
                focused={focused}
                isProtected={!isAuthenticated}
                notificationCount={isAuthenticated ? groupNotifications : 0}
              />
            ),
          }}
          listeners={{
            tabPress: (e) => {
              if (!isAuthenticated) {
                e.preventDefault();
                setShowAuthModal(true);
              }
            },
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, focused }) => (
              <ProtectedTabIcon
                IconComponent={UserRound}
                size={20}
                color={isAuthenticated ? color : isDark ? "#666666" : "#999999"}
                strokeWidth={2}
                focused={focused}
                isProtected={!isAuthenticated}
                notificationCount={isAuthenticated ? personalNotifications : 0}
              />
            ),
          }}
          listeners={{
            tabPress: (e) => {
              if (!isAuthenticated) {
                e.preventDefault();
                setShowAuthModal(true);
              }
            },
          }}
        />

        <Tabs.Screen
          name="edit-profile"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="account-settings"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="privacy"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="how-it-works"
          options={{
            href: null,
          }}
        />
      </Tabs>

      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}
