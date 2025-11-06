import { ThemeProvider, useTheme } from "@/app/contexts/ThemeContext";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import { AuthProvider } from "./contexts/Authprovider";
import * as SplashScreen from "expo-splash-screen";
import { Toaster } from "sonner-native";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Text, View, ActivityIndicator } from "react-native";
import { useAuthStore } from "@/state/authStore";

SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

function RootLayoutContent() {
  const { isDark } = useTheme();
  const { isAuthenticated, isLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const inAuthGroup = segments[0] === "(auth)";

    if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)/prompts");
    }
  }, [isAuthenticated, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
        }}
      >
        <ActivityIndicator size="large" color={isDark ? "#FFFFFF" : "#000000"} />
      </View>
    );
  }

  return (
    <>
      <StatusBar
        style={isDark ? "light" : "dark"}
        backgroundColor={isDark ? "#000000" : "#FFFFFF"}
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
  const [fontsLoaded] = useFonts({
    "Geist-Regular": require("@/assets/fonts/Geist-Regular.otf"),
    "Geist-Medium": require("@/assets/fonts/Geist-Medium.otf"),
    "Geist-Bold": require("@/assets/fonts/Geist-Bold.otf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  // @ts-ignore
  Text.defaultProps = Text.defaultProps || {};
  // @ts-ignore
  Text.defaultProps.style = { fontFamily: "Geist-Regular" };

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

