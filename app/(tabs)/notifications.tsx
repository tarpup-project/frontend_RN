import Header from "@/components/Header";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/app/contexts/ThemeContext";
import { Text } from "@/components/Themedtext";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

const Notifications = () => {
  const { isDark } = useTheme();
  const router = useRouter();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [newMatches, setNewMatches] = useState(true);
  const [groupMessages, setGroupMessages] = useState(true);
  const [emergencyAlerts, setEmergencyAlerts] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [importantUpdates, setImportantUpdates] = useState(true);
  const [newFeatures, setNewFeatures] = useState(false);
  const [rides, setRides] = useState(true);
  const [roommates, setRoommates] = useState(true);
  const [marketplace, setMarketplace] = useState(false);
  const [sports, setSports] = useState(true);
  const [dating, setDating] = useState(false);
  const [study, setStudy] = useState(true);

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
      backgroundColor: isDark ? "#000000" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    divider: {
      backgroundColor: isDark ? "#333333" : "#E0E0E0",
    },
  };

  const enableAll = () => {
    setNotificationsEnabled(true);
    setNewMatches(true);
    setGroupMessages(true);
    setEmergencyAlerts(true);
    setEmailEnabled(true);
    setWeeklyDigest(true);
    setImportantUpdates(true);
    setNewFeatures(true);
    setRides(true);
    setRoommates(true);
    setMarketplace(true);
    setSports(true);
    setDating(true);
    setStudy(true);
  };

  const disableAll = () => {
    setNotificationsEnabled(false);
    setNewMatches(false);
    setGroupMessages(false);
    setEmergencyAlerts(false);
    setEmailEnabled(false);
    setWeeklyDigest(false);
    setImportantUpdates(false);
    setNewFeatures(false);
    setRides(false);
    setRoommates(false);
    setMarketplace(false);
    setSports(false);
    setDating(false);
    setStudy(false);
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Header />

      <ScrollView style={styles.content}>
        {/* Back Button */}
        <Pressable style={styles.backButton} onPress={() => router.push("/profile")}>
          <Ionicons
            name="arrow-back"
            size={20}
            color={dynamicStyles.text.color}
          />
          <Text style={[styles.backText, dynamicStyles.text]}>
            Back to Profile
          </Text>
        </Pressable>

        {/* Header Section - ALL IN ONE CARD */}
        <View style={[styles.headerCard, dynamicStyles.card]}>
          {/* Notification Settings with ON badge */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleRow}>
              <Ionicons
                name="notifications-outline"
                size={22}
                color={dynamicStyles.text.color}
              />
              <Text style={[styles.headerTitle, dynamicStyles.text]}>
                Notification Settings
              </Text>
            </View>
            <View style={styles.onBadge}>
              <Text style={styles.onBadgeText}>ON</Text>
            </View>
          </View>

          {/* Enable All / Disable All buttons */}
          <View style={styles.quickActions}>
            <Pressable
              style={[styles.quickActionButton, dynamicStyles.card]}
              onPress={enableAll}
            >
              <Text style={[styles.quickActionText, dynamicStyles.text]}>
                Enable All
              </Text>
            </Pressable>
            <Pressable
              style={[styles.quickActionButton, dynamicStyles.card]}
              onPress={disableAll}
            >
              <Text style={[styles.quickActionText, dynamicStyles.text]}>
                Disable All
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Push Notifications */}
        <View style={[styles.section, dynamicStyles.card]}>
          {/* Section Title with Icon */}
          <View style={styles.sectionTitleRow}>
            <Ionicons
              name="phone-portrait-outline"
              size={20}
              color={dynamicStyles.text.color}
            />
            <Text style={[styles.sectionTitle, dynamicStyles.text]}>
              Push Notifications
            </Text>
          </View>

          <Pressable
            style={styles.toggleRow}
            onPress={() => setNotificationsEnabled(!notificationsEnabled)}
          >
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, dynamicStyles.text]}>
                Enable Push Notifications
              </Text>
              <Text style={[styles.toggleDescription, dynamicStyles.subtitle]}>
                Master toggle for all push notifications
              </Text>
            </View>
            <View
              style={[
                styles.customToggle,
                notificationsEnabled && styles.customToggleActive,
              ]}
            >
              <View
                style={[
                  styles.customToggleDot,
                  notificationsEnabled && styles.customToggleDotActive,
                ]}
              />
            </View>
          </Pressable>

          {/* Divider Line */}
          <View style={[styles.divider, dynamicStyles.divider]} />

          <Pressable
            style={styles.toggleRow}
            onPress={() => setNewMatches(!newMatches)}
          >
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, dynamicStyles.text]}>
                New Matches
              </Text>
              <Text style={[styles.toggleDescription, dynamicStyles.subtitle]}>
                Get notified when you have new matches
              </Text>
            </View>
            <View
              style={[
                styles.customToggle,
                newMatches && styles.customToggleActive,
              ]}
            >
              <View
                style={[
                  styles.customToggleDot,
                  newMatches && styles.customToggleDotActive,
                ]}
              />
            </View>
          </Pressable>

          <Pressable
            style={styles.toggleRow}
            onPress={() => setGroupMessages(!groupMessages)}
          >
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, dynamicStyles.text]}>
                Group Messages
              </Text>
              <Text style={[styles.toggleDescription, dynamicStyles.subtitle]}>
                New messages in your groups
              </Text>
            </View>
            <View
              style={[
                styles.customToggle,
                groupMessages && styles.customToggleActive,
              ]}
            >
              <View
                style={[
                  styles.customToggleDot,
                  groupMessages && styles.customToggleDotActive,
                ]}
              />
            </View>
          </Pressable>

          <Pressable
            style={styles.toggleRow}
            onPress={() => setEmergencyAlerts(!emergencyAlerts)}
          >
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, dynamicStyles.text]}>
                Emergency Alerts
              </Text>
              <Text style={[styles.toggleDescription, dynamicStyles.subtitle]}>
                Critical campus safety notifications
              </Text>
            </View>
            <View
              style={[
                styles.customToggle,
                emergencyAlerts && styles.customToggleActive,
              ]}
            >
              <View
                style={[
                  styles.customToggleDot,
                  emergencyAlerts && styles.customToggleDotActive,
                ]}
              />
            </View>
          </Pressable>
        </View>

        {/* Email Notifications */}
        <View style={[styles.section, dynamicStyles.card]}>
          {/* Section Title with Icon */}
          <View style={styles.sectionTitleRow}>
            <Ionicons
              name="mail-outline"
              size={20}
              color={dynamicStyles.text.color}
            />
            <Text style={[styles.sectionTitle, dynamicStyles.text]}>
              Email Notifications
            </Text>
          </View>

          <Pressable
            style={styles.toggleRow}
            onPress={() => setEmailEnabled(!emailEnabled)}
          >
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, dynamicStyles.text]}>
                Enable Email Notifications
              </Text>
              <Text style={[styles.toggleDescription, dynamicStyles.subtitle]}>
                Receive notifications via email
              </Text>
            </View>
            <View
              style={[
                styles.customToggle,
                emailEnabled && styles.customToggleActive,
              ]}
            >
              <View
                style={[
                  styles.customToggleDot,
                  emailEnabled && styles.customToggleDotActive,
                ]}
              />
            </View>
          </Pressable>

          <Pressable
            style={styles.toggleRow}
            onPress={() => setWeeklyDigest(!weeklyDigest)}
          >
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, dynamicStyles.text]}>
                Weekly Digest
              </Text>
              <Text style={[styles.toggleDescription, dynamicStyles.subtitle]}>
                Summary of your weekly activity
              </Text>
            </View>
            <View
              style={[
                styles.customToggle,
                weeklyDigest && styles.customToggleActive,
              ]}
            >
              <View
                style={[
                  styles.customToggleDot,
                  weeklyDigest && styles.customToggleDotActive,
                ]}
              />
            </View>
          </Pressable>

          <Pressable
            style={styles.toggleRow}
            onPress={() => setImportantUpdates(!importantUpdates)}
          >
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, dynamicStyles.text]}>
                Important Updates
              </Text>
              <Text style={[styles.toggleDescription, dynamicStyles.subtitle]}>
                Account and security notifications
              </Text>
            </View>
            <View
              style={[
                styles.customToggle,
                importantUpdates && styles.customToggleActive,
              ]}
            >
              <View
                style={[
                  styles.customToggleDot,
                  importantUpdates && styles.customToggleDotActive,
                ]}
              />
            </View>
          </Pressable>

          <Pressable
            style={styles.toggleRow}
            onPress={() => setNewFeatures(!newFeatures)}
          >
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, dynamicStyles.text]}>
                New Features
              </Text>
              <Text style={[styles.toggleDescription, dynamicStyles.subtitle]}>
                Updates about new app features
              </Text>
            </View>
            <View
              style={[
                styles.customToggle,
                newFeatures && styles.customToggleActive,
              ]}
            >
              <View
                style={[
                  styles.customToggleDot,
                  newFeatures && styles.customToggleDotActive,
                ]}
              />
            </View>
          </Pressable>
        </View>

        {/* Category Preferences */}
        <View style={[styles.section, dynamicStyles.card]}>
          <Text style={[styles.sectionTitle, dynamicStyles.text]}>
            Category Preferences
          </Text>
          <Text style={[styles.sectionSubtitle, dynamicStyles.subtitle]}>
            Choose which categories you want to receive notifications for
          </Text>

          <View style={styles.categoryGrid}>
            <Pressable
              style={[styles.categoryCard, dynamicStyles.card]}
              onPress={() => setRides(!rides)}
            >
              <Text style={[styles.categoryLabel, dynamicStyles.text]}>
                Rides
              </Text>
              <View
                style={[
                  styles.categoryToggle,
                  rides && styles.categoryToggleActive,
                ]}
              >
                <View
                  style={[
                    styles.categoryToggleDot,
                    rides && styles.categoryToggleDotActive,
                  ]}
                />
              </View>
            </Pressable>

            <Pressable
              style={[styles.categoryCard, dynamicStyles.card]}
              onPress={() => setRoommates(!roommates)}
            >
              <Text style={[styles.categoryLabel, dynamicStyles.text]}>
                Roommates
              </Text>
              <View
                style={[
                  styles.categoryToggle,
                  roommates && styles.categoryToggleActive,
                ]}
              >
                <View
                  style={[
                    styles.categoryToggleDot,
                    roommates && styles.categoryToggleDotActive,
                  ]}
                />
              </View>
            </Pressable>

            <Pressable
              style={[styles.categoryCard, dynamicStyles.card]}
              onPress={() => setMarketplace(!marketplace)}
            >
              <Text style={[styles.categoryLabel, dynamicStyles.text]}>
                Marketplace
              </Text>
              <View
                style={[
                  styles.categoryToggle,
                  marketplace && styles.categoryToggleActive,
                ]}
              >
                <View
                  style={[
                    styles.categoryToggleDot,
                    marketplace && styles.categoryToggleDotActive,
                  ]}
                />
              </View>
            </Pressable>

            <Pressable
              style={[styles.categoryCard, dynamicStyles.card]}
              onPress={() => setSports(!sports)}
            >
              <Text style={[styles.categoryLabel, dynamicStyles.text]}>
                Sports
              </Text>
              <View
                style={[
                  styles.categoryToggle,
                  sports && styles.categoryToggleActive,
                ]}
              >
                <View
                  style={[
                    styles.categoryToggleDot,
                    sports && styles.categoryToggleDotActive,
                  ]}
                />
              </View>
            </Pressable>

            <Pressable
              style={[styles.categoryCard, dynamicStyles.card]}
              onPress={() => setDating(!dating)}
            >
              <Text style={[styles.categoryLabel, dynamicStyles.text]}>
                Dating
              </Text>
              <View
                style={[
                  styles.categoryToggle,
                  dating && styles.categoryToggleActive,
                ]}
              >
                <View
                  style={[
                    styles.categoryToggleDot,
                    dating && styles.categoryToggleDotActive,
                  ]}
                />
              </View>
            </Pressable>

            <Pressable
              style={[styles.categoryCard, dynamicStyles.card]}
              onPress={() => setStudy(!study)}
            >
              <Text style={[styles.categoryLabel, dynamicStyles.text]}>
                Study
              </Text>
              <View
                style={[
                  styles.categoryToggle,
                  study && styles.categoryToggleActive,
                ]}
              >
                <View
                  style={[
                    styles.categoryToggleDot,
                    study && styles.categoryToggleDotActive,
                  ]}
                />
              </View>
            </Pressable>
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.saveButtonContainer}>
          <Pressable style={styles.saveButton}>
            <Text style={styles.saveButtonText}>
              Save Notification Settings
            </Text>
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
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    marginBottom: 24,
  },
  backText: {
    fontSize: 16,
  },
  headerCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    paddingVertical: 24,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  onBadge: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 13,
  },
  onBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000000",
  },
  quickActions: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-start",
  },
  quickActionButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
  },
  quickActionText: {
    fontSize: 10,
    fontWeight: "600",
  },
  section: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 12,
  },
  customToggle: {
    width: 40,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#333333",
    justifyContent: "center",
    paddingHorizontal: 2,
    alignItems: "flex-start",
  },
  customToggleActive: {
    backgroundColor: "#FFFFFF",
    alignItems: "flex-end",
  },
  customToggleDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  customToggleDotActive: {
    backgroundColor: "#000000",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryCard: {
    width: "48%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  categoryToggle: {
    width: 40,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#333333",
    justifyContent: "center",
    paddingHorizontal: 2,
    alignItems: "flex-start",
  },
  categoryToggleActive: {
    backgroundColor: "#FFFFFF",
    alignItems: "flex-end",
  },
  categoryToggleDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  categoryToggleDotActive: {
    backgroundColor: "#000000",
  },
  saveButtonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 100,
    marginTop: 16,
  },
  saveButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
});

export default Notifications;