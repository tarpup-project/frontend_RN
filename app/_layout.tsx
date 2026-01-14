import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { WatermelonProvider } from "@/contexts/WatermelonProvider";
import { SocketProvider } from "@/contexts/SocketProvider";
import { useAppUpdate } from "@/hooks/useAppUpdate";
import { useDeepLinking } from "@/hooks/useDeepLinking";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAuthStore } from "@/state/authStore";
import { asyncStoragePersister, initializeQueryPersistence, queryClient } from "@/utils/queryClient";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Toaster } from "sonner-native";

SplashScreen.preventAutoHideAsync();

/* -------------------------------------------------------------------------- */
/*                              ROOT CONTENT                                  */
/* -------------------------------------------------------------------------- */
function RootLayoutContent() {
  // ✅ CHECK FOR APP UPDATES
  useAppUpdate();

  // ✅ SINGLE SOURCE OF NOTIFICATIONS
  usePushNotifications();
  
  // ✅ HANDLE DEEP LINKING FOR REFERRALS
  useDeepLinking();

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
      console.log("🚀 App mounted, initializing...");
      
      // Initialize query persistence (noop now, handled by provider, but kept for flow)
      await initializeQueryPersistence();
      
      // Then hydrate auth store
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
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      <WatermelonProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <ThemeProvider>
              <SocketProvider>
                <RootLayoutContent />
              </SocketProvider>
            </ThemeProvider>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </WatermelonProvider>
    </PersistQueryClientProvider>
  );
}
