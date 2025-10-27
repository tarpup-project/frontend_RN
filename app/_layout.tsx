import { ThemeProvider } from "@/app/contexts/ThemeContext";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Text, TextInput } from "react-native";

SplashScreen.preventAutoHideAsync();

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
  Text.defaultProps.style = { fontFamily: 'Geist-Regular' };
// @ts-ignore
  // TextInput.defaultProps = TextInput.defaultProps || {};
  // // @ts-ignore
  // TextInput.defaultProps.style = { fontFamily: 'Geist-Regular' };



  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
