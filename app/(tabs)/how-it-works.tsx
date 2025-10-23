import Header from "@/components/Header";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

const HowItWorks = () => {
  const theme = useColorScheme() || "light";
  const isDark = theme === "dark";
  const router = useRouter();

  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? "#000000" : "#FFFFFF",
    },
    text: {
      color: isDark ? "#FFFFFF" : "#000000",
    },
    subtitle: {
      color: isDark ? "#CCCCCC" : "#666666",
    },
    card: {
      backgroundColor: isDark ? "#000000" : "#F5F5F5",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    grayCard: {
      backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
  };

  const gettingStartedSteps = [
    {
      id: 1,
      icon: "chatbubble-ellipses",
      iconColor: "#4A90E2",
      title: "1. Just state your need",
      description:
        'Simply type what you\'re looking for in natural language. Examples: "Sell a couch", "Find a study partner", "Plan events", "Catch a ride"',
    },
    {
      id: 2,
      icon: "color-wand",
      iconColor: "#E91E63",
      title: "2. Get Matched Instantly",
      description:
        "Our AI finds and connects you with students who share your interests and needs in real-time across your campus.",
    },
    {
      id: 3,
      icon: "people",
      iconColor: "#FF5722",
      title: "3. Connect and Coordinate",
      description:
        "Chat directly with your matches to coordinate details. Share contact info, plan meetups and build lasting connections.",
    },
  ];

  const appFeatures = [
    {
      id: 1,
      icon: "home",
      title: "Spot Tab",
      description:
        "Browse through different categories including Rides, Roommates, Marketplace, Sports, Dating, Study Groups, Giveaways, and Party planning. Select a category to see relevant matches.",
    },
    {
      id: 2,
      icon: "flash",
      title: "Prompts Tab",
      description:
        "View a live feed of campus activities and needs from other students. Filter by category, time posted, and university location to find activities that interest you.",
    },
    {
      id: 3,
      icon: "people",
      title: "Joined Groups Tab",
      description:
        "Access all your AI-matched group chats. Each group shows compatibility scores (60-95%) with other members. Chat, coordinate, and build relationships with your matches.",
    },
    {
      id: 4,
      icon: "person",
      title: "Profile Tab",
      description:
        "Manage your account, view activity stats, add interests for better matches, and customize notification and privacy settings.",
    },
  ];

  const matchingSystem = [
    {
      id: 1,
      title: "Compatibility Scores",
      description:
        "Our AI analyzes your interests, needs, and preferences to calculate compatibility scores (60-95%) with other students. Higher scores indicate better potential matches.",
    },
    {
      id: 2,
      title: "Automatic Group Creation",
      description:
        "When compatible matches are found, Targit AI automatically creates group chats. No manual posting required - just state your need and let AI do the work.",
    },
    {
      id: 3,
      title: "Real-Time Matching",
      description:
        "Matches happen in real-time across your campus. Get connected instantly with students who share your interests and needs.",
    },
  ];

  const tips = [
    "Complete your profile with interests to get better matches",
    "Be specific when stating your needs for more accurate matching",
    "Check your Joined Groups regularly for new matches",
    "Engage in group chats to build connections",
    "Browse the Prompts tab to discover campus activities",
  ];

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Header />

      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.push("/profile")}>
            <Ionicons name="arrow-back" size={20} color={dynamicStyles.text.color} />
            <Text style={[styles.backText, dynamicStyles.text]}>
              BAck to Profile
            </Text>
          </Pressable>
        </View>

        {/* Welcome Section */}
        <View style={[styles.section, dynamicStyles.card]}>
          <Text style={[styles.welcomeTitle, dynamicStyles.text]}>
            Welcome to Targit AI
          </Text>
          <Text style={[styles.welcomeDescription, dynamicStyles.subtitle]}>
            Targit AI is an AI-powered platform that automatically matches
            students within the same university for various needs including
            rides, roommates, marketplace items, sports activities, dating, and
            study groups.
          </Text>
        </View>

        {/* Getting Started */}
        <View style={styles.mainSection}>
          <Text style={[styles.mainSectionTitle, dynamicStyles.text]}>
            Getting Started
          </Text>

          {gettingStartedSteps.map((step, index) => (
            <View
              key={step.id}
              style={[
                styles.stepCard,
                dynamicStyles.card,
                index !== gettingStartedSteps.length - 1 && styles.stepCardMargin,
              ]}
            >
              <View
                style={[
                  styles.stepIcon,
                  { backgroundColor: step.iconColor + "20" },
                ]}
              >
                <Ionicons
                  name={step.icon as any}
                  size={28}
                  color={step.iconColor}
                />
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, dynamicStyles.text]}>
                  {step.title}
                </Text>
                <Text style={[styles.stepDescription, dynamicStyles.subtitle]}>
                  {step.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* App Features */}
        <View style={styles.mainSection}>
          <Text style={[styles.mainSectionTitle, dynamicStyles.text]}>
            App Features
          </Text>

          {appFeatures.map((feature) => (
            <View
              key={feature.id}
              style={[styles.featureCard, dynamicStyles.card]}
            >
              <View style={styles.featureHeader}>
                <Ionicons
                  name={feature.icon as any}
                  size={20}
                  color={dynamicStyles.text.color}
                />
                <Text style={[styles.featureTitle, dynamicStyles.text]}>
                  {feature.title}
                </Text>
              </View>
              <Text style={[styles.featureDescription, dynamicStyles.subtitle]}>
                {feature.description}
              </Text>
            </View>
          ))}
        </View>

        {/* AI Matching System - BLACK CARD */}
        <View style={styles.mainSection}>
          <Text style={[styles.mainSectionTitle, dynamicStyles.text]}>
            AI Matching System
          </Text>

          <View style={[styles.matchingCard, dynamicStyles.card]}>
            {matchingSystem.map((item, index) => (
              <View 
                key={item.id} 
                style={[
                  styles.matchingItem,
                  index !== matchingSystem.length - 1 && styles.matchingItemMargin
                ]}
              >
                <Text style={[styles.matchingTitle, dynamicStyles.text]}>
                  {item.title}
                </Text>
                <Text style={[styles.matchingDescription, dynamicStyles.subtitle]}>
                  {item.description}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tips for Success - BLACK CARD */}
        <View style={styles.mainSection}>
          <Text style={[styles.mainSectionTitle, dynamicStyles.text]}>
            Tips for Success
          </Text>

          <View style={[styles.tipsCard, dynamicStyles.card]}>
            <View style={styles.tipsList}>
              {tips.map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={[styles.tipText, dynamicStyles.subtitle]}>
                    {tip}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Need More Help - GRAY CARD */}
        <View style={[styles.helpSection, dynamicStyles.grayCard]}>
          <Text style={[styles.helpTitle, dynamicStyles.text]}>
            Need More Help?
          </Text>
          <Text style={[styles.helpDescription, dynamicStyles.subtitle]}>
            If you have questions or need assistance, use the "Try Targit Chat"
            button in the header to get help from our AI assistant.
          </Text>

          <Pressable style={styles.supportButton}>
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  welcomeDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  mainSection: {
    marginBottom: 32,
  },
  mainSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  stepCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
  },
  stepCardMargin: {
    marginBottom: 16,
  },
  stepIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  featureCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  featureHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  matchingCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  matchingItem: {
  },
  matchingItemMargin: {
    marginBottom: 20,
  },
  matchingTitle: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 8,
  },
  matchingDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  tipsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: "row",
    gap: 8,
  },
  bullet: {
    fontSize: 16,
    color: "#CCCCCC",
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  helpSection: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 80,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "left",
  },
  helpDescription: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "left",
    marginBottom: 20,
  },
  supportButton: {
    backgroundColor: "#1A1A1A",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    borderWidth: 1,     
  borderColor: "#333333",
    width: "100%",
    alignItems: "center",
  },
  supportButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default HowItWorks;