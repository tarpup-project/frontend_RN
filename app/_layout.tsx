import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAuthStore } from "@/state/authStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import messaging from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Toaster } from "sonner-native";


messaging().setBackgroundMessageHandler(async (remoteMessage: any) => {
  const title =
    remoteMessage?.notification?.title ||
    remoteMessage?.data?.title ||
    "Notification";
  const body =
    remoteMessage?.notification?.body ||
    remoteMessage?.data?.body ||
    "";
  const data = remoteMessage?.data || {};

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: String(title),
        body: String(body),
        data,
        sound: "default",
      },
      trigger: null,
    });
  } catch {}
});

SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

function RootLayoutContent() {
  usePushNotifications();
  const { isDark } = useTheme();
  const { isAuthenticated, isLoading, isHydrated, hydrate, user } = useAuthStore();
  const segments = useSegments();
  const router = useRouter(); 

  useEffect(() => {
    const initialize = async () => {
      console.log(' App mounted, triggering hydration...');
      await hydrate();     

    };    
    initialize();
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
