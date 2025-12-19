import AuthModal from "@/components/AuthModal";
import ProtectedTabIcon from "@/components/ProtectedTabIcon";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotifications } from "@/hooks/useNotification";
import { useAuthStore } from "@/state/authStore";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useState } from "react";
import { Platform } from "react-native";

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
              <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
            )
          }}
        />

        <Tabs.Screen
          name="prompts"
          options={{
            title: "Prompts",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "pulse" : "pulse-outline"} size={24} color={color} />
            )
          }}
        />
      
        <Tabs.Screen
        name="tarps"
        options={{
          title: "Tarps",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "location" : "location-outline"}
              size={28}
              color={color}
            />
          )
        }}
      />

<Tabs.Screen
  name="groups"
  options={{
    title: "Groups",
    tabBarIcon: ({ color, focused }) => (
      <ProtectedTabIcon
        name={focused ? "people" : "people-outline"}
        size={24}
        color={isAuthenticated ? color : "#999999"}
        focused={focused}
        isProtected={!isAuthenticated}
        notificationCount={isAuthenticated ? groupNotifications : 0}
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
        notificationCount={isAuthenticated ? personalNotifications : 0}
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