import Header from "@/components/Header";
import { Ionicons } from "@expo/vector-icons";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

const Profile = () => {
  const theme = useColorScheme() || "light";
  const isDark = theme === "dark";

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
    button: {
      backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
  };

  const interests = [
    "Computer Science",
    "Gaming",
    "Movies",
    "Study Groups",
    "Downtown",
  ];

  const settingsOptions = [
    {
      id: 1,
      icon: "person-circle-outline",
      title: "Account Settings",
      hasChevron: true,
    },
    {
      id: 2,
      icon: "notifications-outline",
      title: "Notifications",
      hasChevron: true,
    },
    {
      id: 3,
      icon: "shield-checkmark-outline",
      title: "Privacy & Safety",
      hasChevron: true,
    },
    {
      id: 4,
      icon: "help-circle-outline",
      title: "How It Works",
      hasChevron: true,
    },
  ];

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Header />

      <ScrollView style={styles.content}>
        {/* Profile Section */}
        <View style={[styles.profileCard, dynamicStyles.card]}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>J</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, dynamicStyles.text]}>
                  John Doe
                </Text>
                <View style={styles.infoRow}>
                  <Ionicons
                    name="school-outline"
                    size={14}
                    color={dynamicStyles.subtitle.color}
                  />
                  <Text style={[styles.infoText, dynamicStyles.subtitle]}>
                    University of South Florida
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons
                    name="mail-outline"
                    size={14}
                    color={dynamicStyles.subtitle.color}
                  />
                  <Text style={[styles.infoText, dynamicStyles.subtitle]}>
                    JoeDoeUSF01@gmail.com
                  </Text>
                </View>
              </View>
            </View>
            <Pressable style={styles.editButton}>
              <Ionicons name="create-outline" size={18} color={dynamicStyles.text.color} />
              <Text style={[styles.editText, dynamicStyles.text]}>Edit</Text>
            </Pressable>
          </View>

          <Text style={[styles.memberSince, dynamicStyles.subtitle]}>
            Member Since September 2024
          </Text>

          <Pressable style={[styles.completeButton, dynamicStyles.button]}>
            <Text style={[styles.completeButtonText, dynamicStyles.text]}>
              Complete Profile Setup
            </Text>
          </Pressable>
        </View>

        {/* Activity Stats */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, dynamicStyles.text]}>
            Activity Stats
          </Text>

          <View style={styles.statsGrid}>
            <View style={[styles.statCard, dynamicStyles.card]}>
              <Ionicons name="star-outline" size={32} color={dynamicStyles.subtitle.color} />
              <Text style={[styles.statNumber, dynamicStyles.text]}>12</Text>
              <Text style={[styles.statLabel, dynamicStyles.subtitle]}>
                Total Matches
              </Text>
            </View>

            <View style={[styles.statCard, dynamicStyles.card]}>
              <Ionicons name="people-outline" size={32} color={dynamicStyles.subtitle.color} />
              <Text style={[styles.statNumber, dynamicStyles.text]}>4</Text>
              <Text style={[styles.statLabel, dynamicStyles.subtitle]}>
                Active Groups
              </Text>
            </View>

            <View style={[styles.statCard, dynamicStyles.card]}>
              <Ionicons name="trending-up-outline" size={32} color={dynamicStyles.subtitle.color} />
              <Text style={[styles.statNumber, dynamicStyles.text]}>87%</Text>
              <Text style={[styles.statLabel, dynamicStyles.subtitle]}>
                Avg Compatibility
              </Text>
            </View>
          </View>
        </View>

        {/* Your Interests */}
        <View style={styles.section}>
          <View style={styles.interestsHeader}>
            <Text style={[styles.sectionTitle, dynamicStyles.text]}>
              Your Interests
            </Text>
            <Pressable>
              <Text style={[styles.addMoreText, dynamicStyles.text]}>
                ADD MORE
              </Text>
            </Pressable>
          </View>

          <View style={styles.interestsGrid}>
            {interests.map((interest, index) => (
              <View key={index} style={[styles.interestChip, dynamicStyles.button]}>
                <Text style={[styles.interestText, dynamicStyles.text]}>
                  {interest}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, dynamicStyles.text]}>Settings</Text>

          <View style={[styles.settingsCard, dynamicStyles.card]}>
            {settingsOptions.map((option, index) => (
              <Pressable
                key={option.id}
                style={[
                  styles.settingItem,
                  index !== settingsOptions.length - 1 && styles.settingItemBorder,
                  { borderBottomColor: dynamicStyles.card.borderColor },
                ]}
              >
                <View style={styles.settingLeft}>
                  <Ionicons
                    name={option.icon as any}
                    size={20}
                    color={dynamicStyles.text.color}
                  />
                  <Text style={[styles.settingText, dynamicStyles.text]}>
                    {option.title}
                  </Text>
                </View>
                {option.hasChevron && (
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={dynamicStyles.subtitle.color}
                  />
                )}
              </Pressable>
            ))}
          </View>

          {/* Sign Out Button */}
          <Pressable style={styles.signOutButton}>
            <Ionicons name="log-out-outline" size={20} color="#FF4444" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerTitle, dynamicStyles.text]}>
            Targit Connect
          </Text>
          <Text style={[styles.footerSubtitle, dynamicStyles.subtitle]}>
            Smart campus connections powered by AI
          </Text>
          <Text style={[styles.footerVersion, dynamicStyles.subtitle]}>
            Version 1.0.0
          </Text>
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
  profileCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
    marginBottom: 24,
  },
  profileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  avatarContainer: {
    flexDirection: "row",
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#00D084",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoText: {
    fontSize: 12,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  editText: {
    fontSize: 14,
    fontWeight: "600",
  },
  memberSince: {
    fontSize: 12,
    marginBottom: 12,
  },
  completeButton: {
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 11,
    textAlign: "center",
  },
  interestsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  addMoreText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  interestsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  interestChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  interestText: {
    fontSize: 14,
    fontWeight: "500",
  },
  settingsCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingText: {
    fontSize: 15,
    fontWeight: "500",
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF4444",
  },
  signOutText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FF4444",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 32,
    marginBottom: 80,
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  footerSubtitle: {
    fontSize: 12,
    marginBottom: 8,
  },
  footerVersion: {
    fontSize: 11,
  },
});

export default Profile;