import "react-native-gesture-handler"
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { useAuthStore } from "@/state/authStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Toaster } from "sonner-native";
import { AuthProvider } from "@/contexts/Authprovider";

SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

function RootLayoutContent() {
  const { isDark } = useTheme();
  const { isAuthenticated, isLoading, isHydrated, hydrate } = useAuthStore();
  const segments = useSegments();
  const router = useRouter(); 

  useEffect(() => {
    console.log('🚀 App mounted, triggering hydration...');
    hydrate();
  }, []);


  useEffect(() => {
    if (!isLoading && isHydrated) {
      SplashScreen.hideAsync();
    }
  }, [isLoading, isHydrated]);

  useEffect(() => {
    if (isLoading || !isHydrated) {
      return;
    }

    const inAuthGroup = segments[0] === "(auth)";

    if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)/prompts");
    }
  }, [isAuthenticated, isLoading, isHydrated, segments, router]);


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
      <Toaster theme={isDark ? "dark" : "light"} position="top-center" />
    </>
  );
}

export default function RootLayout() {
  const { expoPushToken, notification } = usePushNotifications();

  useEffect(() => {
    if (expoPushToken) {
      console.log('Push token ready:', expoPushToken);
      // Send to your backend here, remember Blaise
    }
  }, [expoPushToken]);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <ThemeProvider>
              <RootLayoutContent />
            </ThemeProvider>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </AuthProvider>
    </QueryClientProvider>
  );
}
