import { Redirect } from "expo-router";
import { useAuthStore } from "@/state/authStore";

export default function Index() {
  const { isAuthenticated, isHydrated } = useAuthStore();

  if (!isHydrated) {
    return null;
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/onboarding/Welcome-screen-one" />;

}
