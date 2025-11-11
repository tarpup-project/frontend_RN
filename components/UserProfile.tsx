import React from "react";
import { View, StyleSheet, ActivityIndicator, Image, Pressable, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "@/app/contexts/ThemeContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import Header from "@/components/Header";
import { Text } from "@/components/Themedtext";
import { Skeleton } from "@/components/Skeleton";
import { Ionicons } from "@expo/vector-icons";
import moment from "moment";

const UserProfile = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isDark } = useTheme();
  const { data: profile, isLoading, error } = useUserProfile(id as string);

  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
    },
    text: {
      color: isDark ? "#FFFFFF" : "#000000",
    },
    subtitle: {
      color: isDark ? "#CCCCCC" : "#666666",
    },
    card: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    iconBackground: {
      backgroundColor: isDark ? "#333333" : "#F0F0F0",
    },
  };

  // Loading State
  if (isLoading) {
    return (
      <View style={[styles.container, dynamicStyles.container]}>
        <Header />
        <ScrollView style={styles.content}>
          <View style={[styles.profileCard, dynamicStyles.card]}>
            <View style={styles.headerRow}>
              <Skeleton width={24} height={24} borderRadius={12} />
              <Skeleton width={100} height={16} borderRadius={4} />
            </View>
            
            <View style={styles.profileHeader}>
              <Skeleton width={80} height={80} borderRadius={40} />
              <View style={styles.profileInfo}>
                <Skeleton width={140} height={20} borderRadius={4} style={{ marginBottom: 8 }} />
                <Skeleton width={180} height={14} borderRadius={4} style={{ marginBottom: 4 }} />
                <Skeleton width={160} height={14} borderRadius={4} />
              </View>
            </View>
          </View>

          <View style={[styles.statsCard, dynamicStyles.card]}>
            <Skeleton width={120} height={16} borderRadius={4} style={{ marginBottom: 16 }} />
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Skeleton width={40} height={40} borderRadius={20} />
                <Skeleton width={30} height={18} borderRadius={4} style={{ marginTop: 8 }} />
                <Skeleton width={80} height={12} borderRadius={4} style={{ marginTop: 4 }} />
              </View>
              <View style={styles.statItem}>
                <Skeleton width={40} height={40} borderRadius={20} />
                <Skeleton width={30} height={18} borderRadius={4} style={{ marginTop: 8 }} />
                <Skeleton width={80} height={12} borderRadius={4} style={{ marginTop: 4 }} />
              </View>
              <View style={styles.statItem}>
                <Skeleton width={40} height={40} borderRadius={20} />
                <Skeleton width={30} height={18} borderRadius={4} style={{ marginTop: 8 }} />
                <Skeleton width={80} height={12} borderRadius={4} style={{ marginTop: 4 }} />
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Error State
  if (error || !profile) {
    return (
      <View style={[styles.container, dynamicStyles.container]}>
        <Header />
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
          <Text style={[styles.errorText, dynamicStyles.text]}>
            {error || "User not found"}
          </Text>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Header />
      
      <ScrollView style={styles.content}>
        {/* Profile Section */}
        <View style={[styles.profileCard, dynamicStyles.card]}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={dynamicStyles.text.color} />
            </Pressable>
            <Text style={[styles.headerTitle, dynamicStyles.text]}>Profile</Text>
          </View>

          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              {profile.bgUrl ? (
                <Image source={{ uri: profile.bgUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>
                  {profile.fname?.[0]?.toUpperCase() || "U"}
                </Text>
              )}
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, dynamicStyles.text]}>
                {profile.fname} {profile.lname}
              </Text>
              
              {profile.university && (
                <View style={styles.infoRow}>
                  <Ionicons name="school-outline" size={14} color={dynamicStyles.subtitle.color} />
                  <Text style={[styles.infoText, dynamicStyles.subtitle]}>
                    {profile.university.name}
                  </Text>
                </View>
              )}
              
              <Text style={[styles.memberSince, dynamicStyles.subtitle]}>
                Member since {moment(profile.memberSince).format("MMMM YYYY")}
              </Text>
            </View>
          </View>
        </View>

        {/* Activity Stats */}
        <View style={[styles.statsCard, dynamicStyles.card]}>
          <Text style={[styles.sectionTitle, dynamicStyles.text]}>Activity Stats</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={[styles.iconBackground, dynamicStyles.iconBackground]}>
                <Ionicons name="star-outline" size={18} color={dynamicStyles.subtitle.color} />
              </View>
              <Text style={[styles.statNumber, dynamicStyles.text]}>12</Text>
              <Text style={[styles.statLabel, dynamicStyles.subtitle]}>Total Matches</Text>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.iconBackground, dynamicStyles.iconBackground]}>
                <Ionicons name="people-outline" size={18} color={dynamicStyles.subtitle.color} />
              </View>
              <Text style={[styles.statNumber, dynamicStyles.text]}>5</Text>
              <Text style={[styles.statLabel, dynamicStyles.subtitle]}>Active Groups</Text>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.iconBackground, dynamicStyles.iconBackground]}>
                <Ionicons name="trending-up-outline" size={18} color={dynamicStyles.subtitle.color} />
              </View>
              <Text style={[styles.statNumber, dynamicStyles.text]}>78%</Text>
              <Text style={[styles.statLabel, dynamicStyles.subtitle]}>Avg Compatibility</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={[styles.footerCard, dynamicStyles.card]}>
          <Text style={[styles.footerText, dynamicStyles.subtitle]}>
            Connect through shared interests and campus activities
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  profileCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  profileHeader: {
    flexDirection: "row",
    gap: 16,
    alignItems: "flex-start",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#00D084",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 40,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  profileInfo: {
    flex: 1,
    gap: 6,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    fontWeight: "500",
  },
  memberSince: {
    fontSize: 12,
    fontWeight: "600",
  },
  statsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    gap: 8,
  },
  iconBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 11,
    textAlign: "center",
    fontWeight: "600",
  },
  footerCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 30,
  },
  footerText: {
    fontSize: 13,
    textAlign: "center",
    fontWeight: "500",
  },
  errorText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
    textAlign: "center",
  },
  backButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#007AFF",
    borderRadius: 8,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default UserProfile;