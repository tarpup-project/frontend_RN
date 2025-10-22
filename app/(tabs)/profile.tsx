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

const Profile = () => {
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
    button: {
      backgroundColor: isDark ? "#000000" : "#F5F5F5",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    statDivider: {
      backgroundColor: isDark ? "#333333" : "#E0E0E0",
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
            <Pressable
              style={styles.editButton}
              onPress={() => router.push("/edit-profile")}
            >
              <Ionicons
                name="create-outline"
                size={18}
                color={dynamicStyles.text.color}
              />
              <Text style={[styles.editText, dynamicStyles.text]}>Edit</Text>
            </Pressable>
          </View>

          <Text style={[styles.memberSince, dynamicStyles.subtitle]}>
            Member Since September 2024
          </Text>

          <Pressable
            style={[styles.completeButton, dynamicStyles.button]}
            onPress={() => router.push("/edit-profile")}
          >
            <Text style={[styles.completeButtonText, dynamicStyles.text]}>
              Complete Profile Setup
            </Text>
          </Pressable>
        </View>

        {/* Activity Stats */}
        <View style={styles.section}>
          <View style={[styles.statsCard, dynamicStyles.card]}>
            <Text style={[styles.sectionTitle, dynamicStyles.text]}>
              Activity Stats
            </Text>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <View style={styles.iconBackground}>
                  <Ionicons
                    name="star-outline"
                    size={18}
                    color={dynamicStyles.subtitle.color}
                  />
                </View>
                <Text style={[styles.statNumber, dynamicStyles.text]}>12</Text>
                <Text style={[styles.statLabel, dynamicStyles.subtitle]}>
                  Total Matches
                </Text>
              </View>

              <View style={styles.statItem}>
                <View style={styles.iconBackground}>
                  <Ionicons
                    name="people-outline"
                    size={18}
                    color={dynamicStyles.subtitle.color}
                  />
                </View>
                <Text style={[styles.statNumber, dynamicStyles.text]}>4</Text>
                <Text style={[styles.statLabel, dynamicStyles.subtitle]}>
                  Active Groups
                </Text>
              </View>

              <View style={styles.statItem}>
                <View style={styles.iconBackground}>
                  <Ionicons
                    name="trending-up-outline"
                    size={18}
                    color={dynamicStyles.subtitle.color}
                  />
                </View>
                <Text style={[styles.statNumber, dynamicStyles.text]}>87%</Text>
                <Text style={[styles.statLabel, dynamicStyles.subtitle]}>
                  Avg Compatibility
                </Text>
              </View>
            </View>
          </View>
        </View>
        {/* Your Interests */}
        <View style={styles.section}>
          <View style={[styles.interestsCard, dynamicStyles.card]}>
            <View style={styles.interestsHeader}>
              <Text style={[styles.sectionTitle, dynamicStyles.text]}>
                Your Interests
              </Text>
              <Pressable>
                <Text style={[styles.addMoreText, dynamicStyles.text]}>
                  Add More
                </Text>
              </Pressable>
            </View>

            <View style={styles.interestsGrid}>
              {interests.map((interest, index) => (
                <View
                  key={index}
                  style={[styles.interestChip, dynamicStyles.button]}
                >
                  <Text style={[styles.interestText, dynamicStyles.text]}>
                    {interest}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Settings */}
        <View style={[styles.settingsCard, dynamicStyles.card]}>
          <Text style={[styles.sectionTitleInCard, dynamicStyles.text]}>
            Settings
          </Text>
          {settingsOptions.map((option) => (
            <Pressable key={option.id} style={styles.settingItem}>
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

          {/* Sign Out - now inside settings card */}
          <Pressable style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="log-out-outline" size={20} color="#FF4444" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </View>
          </Pressable>
        </View>

        {/* Footer */}
        <View style={[styles.footerCard, dynamicStyles.card]}>
          <Text style={[styles.footerTitle, dynamicStyles.text]}>
            TarpAI Connect
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
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
  },
  statsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 11,
    textAlign: "center",
  },
  interestsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  interestsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  addMoreText: {
    fontSize: 10,
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
    fontSize: 9,
    fontWeight: "500",
  },
  settingsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 16,
  },
  sectionTitleInCard: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    marginTop: 0,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
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
  signOutText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FF4444",
  },
  footerCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 80,
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  iconBackground: {
    width: 35,
    height: 35,
    borderRadius: 24,
    backgroundColor: "#333333",
    justifyContent: "center",
    alignItems: "center",
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
