import Header from "@/components/Header";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Switch,
} from "react-native";

const Notifications = () => {
  const theme = useColorScheme() || "light";
  const isDark = theme === "dark";

  // Push Notifications
  const [enablePush, setEnablePush] = useState(true);
  const [newMatches, setNewMatches] = useState(true);
  const [groupMessages, setGroupMessages] = useState(true);
  const [emergencyAlerts, setEmergencyAlerts] = useState(true);

  // Email Notifications
  const [enableEmail, setEnableEmail] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [importantUpdates, setImportantUpdates] = useState(true);
  const [newFeatures, setNewFeatures] = useState(false);

  // Category Preferences
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
      backgroundColor: isDark ? "#0A0A0A" : "#F5F5F5",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
  };

  const enableAll = () => {
    setEnablePush(true);
    setNewMatches(true);
    setGroupMessages(true);
    setEmergencyAlerts(true);
    setEnableEmail(true);
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
    setEnablePush(false);
    setNewMatches(false);
    setGroupMessages(false);
    setEmergencyAlerts(false);
    setEnableEmail(false);
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
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.titleRow}>
            <Ionicons name="notifications" size={20} color={dynamicStyles.text.color} />
            <Text style={[styles.title, dynamicStyles.text]}>
              Notification Settings
            </Text>
            <View style={styles.onBadge}>
              <Text style={styles.onText}>ON</Text>
            </View>
          </View>
        </View>

        {/* Back Button */}
        <Pressable style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={dynamicStyles.text.color} />
          <Text style={[styles.backText, dynamicStyles.text]}>
            Back to Profile
          </Text>
        </Pressable>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Pressable style={styles.quickButton} onPress={enableAll}>
            <Text style={styles.quickButtonText}>Enable All</Text>
          </Pressable>
          <Pressable
            style={[styles.quickButton, styles.disableButton]}
            onPress={disableAll}
          >
            <Text style={styles.quickButtonText}>Disable All</Text>
          </Pressable>
        </View>

        {/* Push Notifications Section */}
        <View style={[styles.section, dynamicStyles.card]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="phone-portrait" size={20} color={dynamicStyles.text.color} />
            <Text style={[styles.sectionTitle, dynamicStyles.text]}>
              Push Notifications
            </Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, dynamicStyles.text]}>
                Enable Push Notifications
              </Text>
              <Text style={[styles.settingDescription, dynamicStyles.subtitle]}>
                Master toggle for all push notifications
              </Text>
            </View>
            <Switch
              value={enablePush}
              onValueChange={setEnablePush}
              trackColor={{ false: "#333333", true: "#00D084" }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingIconRow}>
              <Ionicons name="star" size={18} color={dynamicStyles.subtitle.color} />
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, dynamicStyles.text]}>
                  New Matches
                </Text>
                <Text style={[styles.settingDescription, dynamicStyles.subtitle]}>
                  When Targit finds compatible users
                </Text>
              </View>
            </View>
            <Switch
              value={newMatches}
              onValueChange={setNewMatches}
              trackColor={{ false: "#333333", true: "#00D084" }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingIconRow}>
              <Ionicons name="chatbubbles" size={18} color={dynamicStyles.subtitle.color} />
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, dynamicStyles.text]}>
                  Group Messages
                </Text>
                <Text style={[styles.settingDescription, dynamicStyles.subtitle]}>
                  New messages in your groups
                </Text>
              </View>
            </View>
            <Switch
              value={groupMessages}
              onValueChange={setGroupMessages}
              trackColor={{ false: "#333333", true: "#00D084" }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingIconRow}>
              <Ionicons name="alert-circle" size={18} color={dynamicStyles.subtitle.color} />
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, dynamicStyles.text]}>
                  Emergency Alerts
                </Text>
                <Text style={[styles.settingDescription, dynamicStyles.subtitle]}>
                  Important safety notifications
                </Text>
              </View>
            </View>
            <Switch
              value={emergencyAlerts}
              onValueChange={setEmergencyAlerts}
              trackColor={{ false: "#333333", true: "#00D084" }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Email Notifications Section */}
        <View style={[styles.section, dynamicStyles.card]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="mail" size={20} color={dynamicStyles.text.color} />
            <Text style={[styles.sectionTitle, dynamicStyles.text]}>
              Email Notifications
            </Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, dynamicStyles.text]}>
                Enable Email Notifications
              </Text>
              <Text style={[styles.settingDescription, dynamicStyles.subtitle]}>
                Receive notifications via email
              </Text>
            </View>
            <Switch
              value={enableEmail}
              onValueChange={setEnableEmail}
              trackColor={{ false: "#333333", true: "#00D084" }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, dynamicStyles.text]}>
                Weekly Digest
              </Text>
              <Text style={[styles.settingDescription, dynamicStyles.subtitle]}>
                Summary of your matches and activity
              </Text>
            </View>
            <Switch
              value={weeklyDigest}
              onValueChange={setWeeklyDigest}
              trackColor={{ false: "#333333", true: "#00D084" }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, dynamicStyles.text]}>
                Important Updates
              </Text>
              <Text style={[styles.settingDescription, dynamicStyles.subtitle]}>
                Security and account notifications
              </Text>
            </View>
            <Switch
              value={importantUpdates}
              onValueChange={setImportantUpdates}
              trackColor={{ false: "#333333", true: "#00D084" }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, dynamicStyles.text]}>
                New Features
              </Text>
              <Text style={[styles.settingDescription, dynamicStyles.subtitle]}>
                Updates about new app features
              </Text>
            </View>
            <Switch
              value={newFeatures}
              onValueChange={setNewFeatures}
              trackColor={{ false: "#333333", true: "#00D084" }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Category Preferences Section */}
        <View style={[styles.section, dynamicStyles.card]}>
          <Text style={[styles.sectionTitle, dynamicStyles.text]}>
            Category Preferences
          </Text>
          <Text style={[styles.categoryDescription, dynamicStyles.subtitle]}>
            Choose which categories you want to receive notifications for
          </Text>

          <View style={styles.categoryGrid}>
            <Pressable
              style={[styles.categoryCard, dynamicStyles.card]}
              onPress={() => setRides(!rides)}
            >
              <Ionicons name="car" size={20} color={dynamicStyles.text.color} />
              <Text style={[styles.categoryText, dynamicStyles.text]}>Rides</Text>
              <View style={[styles.categoryToggle, rides && styles.categoryToggleActive]}>
                {rides && <View style={styles.categoryToggleInner} />}
              </View>
            </Pressable>

            <Pressable
              style={[styles.categoryCard, dynamicStyles.card]}
              onPress={() => setRoommates(!roommates)}
            >
              <Ionicons name="people" size={20} color={dynamicStyles.text.color} />
              <Text style={[styles.categoryText, dynamicStyles.text]}>Roommates</Text>
              <View style={[styles.categoryToggle, roommates && styles.categoryToggleActive]}>
                {roommates && <View style={styles.categoryToggleInner} />}
              </View>
            </Pressable>

            <Pressable
              style={[styles.categoryCard, dynamicStyles.card]}
              onPress={() => setMarketplace(!marketplace)}
            >
              <Ionicons name="bag" size={20} color={dynamicStyles.text.color} />
              <Text style={[styles.categoryText, dynamicStyles.text]}>Marketplace</Text>
              <View style={[styles.categoryToggle, marketplace && styles.categoryToggleActive]}>
                {marketplace && <View style={styles.categoryToggleInner} />}
              </View>
            </Pressable>

            <Pressable
              style={[styles.categoryCard, dynamicStyles.card]}
              onPress={() => setSports(!sports)}
            >
              <Ionicons name="basketball" size={20} color={dynamicStyles.text.color} />
              <Text style={[styles.categoryText, dynamicStyles.text]}>Sports</Text>
              <View style={[styles.categoryToggle, sports && styles.categoryToggleActive]}>
                {sports && <View style={styles.categoryToggleInner} />}
              </View>
            </Pressable>

            <Pressable
              style={[styles.categoryCard, dynamicStyles.card]}
              onPress={() => setDating(!dating)}
            >
              <Ionicons name="heart" size={20} color={dynamicStyles.text.color} />
              <Text style={[styles.categoryText, dynamicStyles.text]}>Dating</Text>
              <View style={[styles.categoryToggle, dating && styles.categoryToggleActive]}>
                {dating && <View style={styles.categoryToggleInner} />}
              </View>
            </Pressable>

            <Pressable
              style={[styles.categoryCard, dynamicStyles.card]}
              onPress={() => setStudy(!study)}
            >
              <Ionicons name="book" size={20} color={dynamicStyles.text.color} />
              <Text style={[styles.categoryText, dynamicStyles.text]}>Study</Text>
              <View style={[styles.categoryToggle, study && styles.categoryToggleActive]}>
                {study && <View style={styles.categoryToggleInner} />}
              </View>
            </Pressable>
          </View>
        </View>

        {/* Save Button */}
        <Pressable style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save Notification Settings</Text>
        </Pressable>
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
  headerSection: {
    marginTop: 16,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
  },
  onBadge: {
    backgroundColor: "#00D084",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  onText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
  },
  quickActions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  quickButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  disableButton: {
    backgroundColor: "#1A1A1A",
  },
  quickButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
  section: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
  },
  settingIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  categoryDescription: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryCard: {
    width: "47%",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
  },
  categoryToggle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#333333",
    justifyContent: "center",
    alignItems: "center",
  },
  categoryToggleActive: {
    backgroundColor: "#00D084",
    borderColor: "#00D084",
  },
  categoryToggleInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
  },
  saveButton: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 80,
    marginTop: 8,
  },
  saveButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default Notifications;