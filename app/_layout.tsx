import { SocketProvider } from "@/contexts/SocketProvider";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { WatermelonProvider } from "@/contexts/WatermelonProvider";
import { asyncStorageDB } from "@/database/asyncStorageDB";
import { useAppBadge } from "@/hooks/useAppBadge";
import { useAppUpdate } from "@/hooks/useAppUpdate";
import { useDeepLinking } from "@/hooks/useDeepLinking";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAuthStore } from "@/state/authStore";
import { useSyncStore } from "@/state/syncStore";
import { asyncStoragePersister, initializeQueryPersistence, queryClient } from "@/utils/queryClient";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as Updates from "expo-updates";
import React, { useEffect, useRef } from "react";
import { ActivityIndicator, AppState, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Toaster } from "sonner-native";

import { NetworkStatusBanner } from "@/components/NetworkStatusBanner";
import { setupBackgroundMessageHandler } from "@/utils/backgroundMessaging";

// Register background handler immediately
setupBackgroundMessageHandler();

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

  // ✅ HANDLE APP BADGE COUNTS
  useAppBadge();

  const { isDark } = useTheme();
  const {
    isAuthenticated,
    isLoading,
    isHydrated,
    hydrate,
  } = useAuthStore();
  const { isSyncing, statusMessage } = useSyncStore();

  const appState = useRef(AppState.currentState);
  const backgroundTime = useRef<number | null>(null);

  /* -------------------------- INACTIVITY RELOAD --------------------------- */
  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // App has come to the foreground
        if (backgroundTime.current) {
          const timeInBackground = Date.now() - backgroundTime.current;
          console.log(`📱 App foregrounded after ${timeInBackground}ms`);

          // If backgrounded for more than 40 seconds (40000ms), reload the app
          if (timeInBackground > 30000) {
            console.log("🔄 App was in background for >40s. Reloading...");
            try {
              await Updates.reloadAsync();
            } catch (error) {
              console.error("❌ Failed to reload app:", error);
            }
          }
        }
        backgroundTime.current = null;
      } else if (nextAppState.match(/inactive|background/)) {
        // App has gone to the background
        console.log("📱 App backgrounded");
        backgroundTime.current = Date.now();
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const segments = useSegments();
  const router = useRouter();

  /* ----------------------------- HYDRATION -------------------------------- */
  useEffect(() => {
    const init = async () => {
      console.log("🚀 App mounted, initializing...");

      // Initialize query persistence (noop now, handled by provider, but kept for flow)
      await initializeQueryPersistence();

      // Initialize local DB for synchronous access
      await asyncStorageDB.initialize();

      // Then hydrate auth store
      await hydrate();
    };
    init();
  }, []);

  /* --------------------------- SPLASH SCREEN ------------------------------- */
  useEffect(() => {
    // Only hide splash screen when:
    // 1. Auth loading is done
    // 2. Hydration is complete
    // 3. Global message sync is complete (not syncing)
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
  // Show loading screen if:
  // 1. Auth is loading or hydrating
  // 2. Global sync is in progress
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

      <NetworkStatusBanner />

      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: {
            backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
          },
        }}
      >
        <Stack.Screen
          name="chat"
          options={{
            presentation: "modal",
            headerShown: false,
            contentStyle: {
              backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
            },
          }}
        />
      </Stack>

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
