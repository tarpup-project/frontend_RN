import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAuthStore } from "@/state/authStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Toaster } from "sonner-native";

SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

/* -------------------------------------------------------------------------- */
/*                              ROOT CONTENT                                  */
/* -------------------------------------------------------------------------- */
function RootLayoutContent() {
  // ✅ SINGLE SOURCE OF NOTIFICATIONS
  usePushNotifications();

  const { isDark } = useTheme();
  const {
    isAuthenticated,
    isLoading,
    isHydrated,
    hydrate,
  } = useAuthStore();

  const segments = useSegments();
  const router = useRouter();

  /* ----------------------------- HYDRATION -------------------------------- */
  useEffect(() => {
    const init = async () => {
      console.log("🚀 App mounted, hydrating store...");
      await hydrate();
    };
    init();
  }, []);

  /* --------------------------- SPLASH SCREEN ------------------------------- */
  useEffect(() => {
    if (!isLoading && isHydrated) {
      SplashScreen.hideAsync();
    }
  }, [isLoading, isHydrated]);

  /* ---------------------------- AUTH ROUTING ------------------------------- */
  useEffect(() => {
    if (isLoading || !isHydrated) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)/prompts");
    }
  }, [isAuthenticated, isLoading, isHydrated, segments]);

  /* ----------------------------- LOADING UI -------------------------------- */
  if (isLoading || !isHydrated) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
        }}
      >
        <ActivityIndicator
          size="large"
          color={isDark ? "#FFFFFF" : "#0a0a0a"}
        />
      </View>
    );
  }

  /* ------------------------------- APP ------------------------------------ */
  return (
    <>
      <StatusBar
        style={isDark ? "light" : "dark"}
        backgroundColor={isDark ? "#0a0a0a" : "#FFFFFF"}
        translucent={false}
      />

      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: {
            backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
          },
        }}
      />

      <Toaster
        theme={isDark ? "dark" : "light"}
        position="top-center"
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                                ROOT LAYOUT                                 */
/* -------------------------------------------------------------------------- */
export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <RootLayoutContent />
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
