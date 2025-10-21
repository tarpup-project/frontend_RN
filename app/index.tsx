import { Redirect } from "expo-router";

export default function Index() {

  return <Redirect href="/onboarding/Welcome-screen-one" />;
  // const hasSeenOnboarding = false;

  // if (!hasSeenOnboarding) {
  //   return <Redirect href="/onboarding/Welcome-screen-one" />;
  // }

  // return <Redirect href="/(tabs)" />;
}
