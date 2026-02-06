import Header from "@/components/Header";
import { ReferralCard } from "@/components/ReferralCard";
import { Skeleton } from "@/components/Skeleton";
import { Text } from "@/components/Themedtext";
import { useTheme } from "@/contexts/ThemeContext";
import { useCampus } from "@/hooks/useCampus";
import { useProfileStats } from "@/hooks/useProfileStats";
import { useAuthStore } from "@/state/authStore";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import moment from "moment";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from "react-native";
import { toast } from "sonner-native";

const SkeletonStat = ({ isDark }: { isDark: boolean }) => {
  const dynamicStyles = {
    iconBackground: {
      backgroundColor: isDark ? "#333333" : "#F0F0F0",
    },
  };

  return (
    <View style={styles.statItem}>
      <View style={[styles.iconBackground, dynamicStyles.iconBackground]}>
        <Skeleton width={18} height={18} borderRadius={9} />
      </View>
      <Skeleton
        width={30}
        height={20}
        borderRadius={4}
        style={{ marginVertical: 4 }}
      />
      <Skeleton width={60} height={11} borderRadius={4} />
    </View>
  );
};

const SkeletonInterest = () => {
  return (
    <Skeleton
      width={80}
      height={32}
      borderRadius={16}
      style={{ marginRight: 8, marginBottom: 8 }}
    />
  );
};

const Profile = () => {
  const { isDark } = useTheme();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { universities, isLoading: isLoadingUniversities } = useCampus();
  const { stats, isLoading: isLoadingStats, refresh } = useProfileStats();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copyLoading, setCopyLoading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [universityName, setUniversityName] = useState('');
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);

  // University name resolution logic following the documented pattern
  useEffect(() => {
    if (!user?.universityID || !universities || universities.length === 0) {
      setUniversityName('Grambling State University'); // Fallback
      return;
    }

    // Find university by ID in the flattened universities array
    const foundUniversity = universities.find(university => university.id === user.universityID);
    
    if (foundUniversity) {
      setUniversityName(foundUniversity.name);
    } else {
      setUniversityName('Grambling State University'); // Fallback if not found
    }
  }, [user?.universityID, universities]);

  // Check profile completion status
  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (!user) return;

      try {
        // Check if phone number exists in user data or SecureStore
        const hasPhoneInProfile = !!(user.phoneNumber && user.phoneNumber.trim());
        const storedPhone = await SecureStore.getItemAsync('user_phone_number');
        const hasStoredPhone = !!(storedPhone && storedPhone.trim());

        // Show completion prompt if no phone number is found
        setShowProfileCompletion(!hasPhoneInProfile && !hasStoredPhone);
        
        console.log('Profile completion check:', {
          hasPhoneInProfile,
          hasStoredPhone,
          showCompletion: !hasPhoneInProfile && !hasStoredPhone
        });
      } catch (error) {
        console.error('Error checking profile completion:', error);
        // Default to showing completion if we can't check
        setShowProfileCompletion(!user.phoneNumber);
      }
    };

    checkProfileCompletion();
  }, [user]);

  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
    },
    text: {
      color: isDark ? "#FFFFFF" : "#0a0a0a",
    },
    subtitle: {
      color: isDark ? "#CCCCCC" : "#666666",
    },
    card: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    button: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    statDivider: {
      backgroundColor: isDark ? "#333333" : "#E0E0E0",
    },
    iconBackground: {
      backgroundColor: isDark ? "#333333" : "#F0F0F0",
    },
    referralLinkContainer: {
      backgroundColor: isDark ? "#212122" : "#F5F5F5",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
  };

  const referralLink = `https://tarpup.com/?ref=${user?.id}`;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  const handleCopyReferralLink = async () => {
    try {
      setCopyLoading(true);
      await Clipboard.setStringAsync(referralLink);
      toast.success("Referral link copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy link");
    } finally {
      setCopyLoading(false);
    }
  };

  const handleShareReferralLink = async () => {
    try {
      await Share.share({
        message: `Hey! Sign up to TarpAI Connect using my referral link and let's connect there!\n\n${referralLink}`,
        title: "Join me on TarpAI Connect 🎉",
        url: referralLink,
      });
    } catch (error) {
      handleCopyReferralLink();
    }
  };

  const handleLogout = () => {
    Alert.alert("Sign Out?", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            router.push("/onboarding/Welcome-screen-one");
          } catch (error) {
            toast.error("Failed to sign out");
          }
        },
      },
    ]);
  };

  const settingsOptions = [
    {
      id: 1,
      iconName: "settings-outline",
      title: "Account Settings",
      hasChevron: true,
      route: "/account-settings",
    },
    // {
    //   id: 2,
    //   iconName: "notifications-outline",
    //   title: "Notifications",
    //   hasChevron: true,
    //   route: "/notifications",
    // },
    // {
    //   id: 3,
    //   iconName: "shield-checkmark-outline",
    //   title: "Privacy & Safety",
    //   hasChevron: true,
    //   route: "/privacy",
    // },
    {
      id: 4,
      iconName: "help-circle-outline",
      title: "How It Works",
      hasChevron: true,
      route: "/how-it-works",
    },
  ];

  if (!isAuthenticated || !user) {
    return (
      <View style={[styles.container, dynamicStyles.container]}>
        <Header />
        <ScrollView style={styles.content}>
          <View style={[styles.profileCard, dynamicStyles.card]}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <Skeleton width={60} height={60} borderRadius={30} />
                <View style={styles.profileInfo}>
                  <Skeleton
                    width={120}
                    height={16}
                    borderRadius={4}
                    style={{ marginBottom: 8 }}
                  />
                  <Skeleton
                    width={180}
                    height={12}
                    borderRadius={4}
                    style={{ marginBottom: 4 }}
                  />
                  <Skeleton width={160} height={12} borderRadius={4} />
                </View>
              </View>
            </View>
            <Skeleton
              width={140}
              height={14}
              borderRadius={4}
              style={{ marginBottom: 16 }}
            />
            <Skeleton width="100%" height={48} borderRadius={8} />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Header />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Profile Section */}
        <View style={[styles.profileCard, dynamicStyles.card]}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Pressable onPress={() => user.bgUrl && setShowImageModal(true)}>
                <View style={styles.avatar}>
                  {user.bgUrl ? (
                    <Image
                      source={{ uri: user.bgUrl }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Text style={styles.avatarText}>
                      {user.fname?.[0]?.toUpperCase() || "U"}
                    </Text>
                  )}
                </View>
              </Pressable>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, dynamicStyles.text]}>
                  {user.fname} {user.lname}
                </Text>
                <View style={styles.infoRow}>
                  <Ionicons
                    name="school-outline"
                    size={14}
                    color={dynamicStyles.subtitle.color}
                  />
                  <Text style={[styles.infoText, dynamicStyles.subtitle]}>
                    {isLoadingUniversities ? "Loading..." : universityName}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons
                    name="mail-outline"
                    size={14}
                    color={dynamicStyles.subtitle.color}
                  />
                  <Text style={[styles.infoText, dynamicStyles.subtitle]}>
                    {user.email}
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
                size={16}
                color={dynamicStyles.text.color}
              />
              <Text style={[styles.editText, dynamicStyles.text]}>Edit</Text>
            </Pressable>
          </View>

          <Text style={[styles.memberSince, dynamicStyles.subtitle]}>
            Member since {moment(user.createdAt).format("MMMM YYYY")}
          </Text>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statColumn}>
              <Text style={[styles.statNumber, dynamicStyles.text]}>
                {stats?.prompts || 0}
              </Text>
              <Text style={[styles.statLabel, dynamicStyles.subtitle]}>
                Prompts
              </Text>
            </View>
            <View style={styles.statColumn}>
              <Text style={[styles.statNumber, dynamicStyles.text]}>
                {stats?.posts || 0}
              </Text>
              <Text style={[styles.statLabel, dynamicStyles.subtitle]}>
                Posts
              </Text>
            </View>
            <View style={styles.statColumn}>
              <Text style={[styles.statNumber, dynamicStyles.text]}>
                {stats?.followers || 0}
              </Text>
              <Text style={[styles.statLabel, dynamicStyles.subtitle]}>
                Followers
              </Text>
            </View>
            <View style={styles.statColumn}>
              <Text style={[styles.statNumber, dynamicStyles.text]}>
                {stats?.followings || 0}
              </Text>
              <Text style={[styles.statLabel, dynamicStyles.subtitle]}>
                Followings
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Pressable
              style={[styles.completeButton, dynamicStyles.button]}
              onPress={() => router.push("/edit-profile")}
            >
              <Text style={[styles.completeButtonText, dynamicStyles.text]}>
                Complete Profile
              </Text>
            </Pressable>
            <Pressable
              style={[styles.connectionsButton, { backgroundColor: "#000000" }]}
              onPress={() => router.push("/connections")}
            >
              <Ionicons name="people" size={16} color="#FFFFFF" />
              <Text style={[styles.connectionsButtonText, { color: "#FFFFFF" }]}>
                Connections
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Profile Completion Banner */}
        {showProfileCompletion && (
          <View style={[styles.completionBanner, dynamicStyles.card]}>
            <View style={styles.completionContent}>
              <View style={styles.completionLeft}>
                <View style={[styles.completionIcon, { backgroundColor: "#FF9500" }]}>
                  <Ionicons name="person-outline" size={16} color="#FFFFFF" />
                </View>
                <View style={styles.completionText}>
                  <Text style={[styles.completionTitle, dynamicStyles.text]}>
                    Profile 80% Complete
                  </Text>
                  <Text style={[styles.completionSubtitle, dynamicStyles.subtitle]}>
                    Add your phone number to complete your profile
                  </Text>
                </View>
              </View>
              <Pressable
                style={styles.completionButton}
                onPress={() => router.push("/edit-profile")}
              >
                <Text style={styles.completionButtonText}>Complete</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Enhanced Referrals Section */}
        <ReferralCard showStats={true} compact={false} />

        {/* Activity Stats */}
        <View style={styles.section}>
          <View style={[styles.statsCard, dynamicStyles.card]}>
            <Text style={[styles.sectionTitle, dynamicStyles.text]}>
              Activity Stats
            </Text>

            <View style={styles.statsContainer}>
              {isLoadingStats ? (
                <>
                  <SkeletonStat isDark={isDark} />
                  <SkeletonStat isDark={isDark} />
                  <SkeletonStat isDark={isDark} />
                </>
              ) : (
                <>
                  <View style={styles.statItem}>
                    <View
                      style={[
                        styles.iconBackground,
                        dynamicStyles.iconBackground,
                      ]}
                    >
                      <Ionicons
                        name="star-outline"
                        size={16}
                        color={dynamicStyles.subtitle.color}
                      />
                    </View>
                    <Text style={[styles.statNumber, dynamicStyles.text]}>
                      {stats?.totalMatches ?? 0}
                    </Text>
                    <Text style={[styles.statLabel, dynamicStyles.subtitle]}>
                      Total Matches
                    </Text>
                  </View>

                  <View style={styles.statItem}>
                    <View
                      style={[
                        styles.iconBackground,
                        dynamicStyles.iconBackground,
                      ]}
                    >
                      <Ionicons
                        name="people-outline"
                        size={16}
                        color={dynamicStyles.subtitle.color}
                      />
                    </View>
                    <Text style={[styles.statNumber, dynamicStyles.text]}>
                      {stats?.activeGroups ?? 0}
                    </Text>
                    <Text style={[styles.statLabel, dynamicStyles.subtitle]}>
                      Active Groups
                    </Text>
                  </View>

                  <View style={styles.statItem}>
                    <View
                      style={[
                        styles.iconBackground,
                        dynamicStyles.iconBackground,
                      ]}
                    >
                      <Ionicons
                        name="trending-up-outline"
                        size={16}
                        color={dynamicStyles.subtitle.color}
                      />
                    </View>
                    <Text style={[styles.statNumber, dynamicStyles.text]}>
                      {stats?.avgCompatibility ?? 0}%
                    </Text>
                    <Text style={[styles.statLabel, dynamicStyles.subtitle]}>
                      Avg Compatibility
                    </Text>
                  </View>
                </>
              )}
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
              <Pressable onPress={() => router.push("/edit-profile")}>
                <Text style={[styles.addMoreText, dynamicStyles.text]}>
                  Add More
                </Text>
              </Pressable>
            </View>

            <View style={styles.interestsGrid}>
              {isLoadingStats ? (
                <>
                  <SkeletonInterest />
                  <SkeletonInterest />
                  <SkeletonInterest />
                  <SkeletonInterest />
                  <SkeletonInterest />
                </>
              ) : (
                stats?.interests?.map((interest, index) => (
                  <View
                    key={index}
                    style={[styles.interestChip, dynamicStyles.button]}
                  >
                    <Text style={[styles.interestText, dynamicStyles.text]}>
                      {interest}
                    </Text>
                  </View>
                )) ??
                user.interests?.map((interest, index) => (
                  <View
                    key={index}
                    style={[styles.interestChip, dynamicStyles.button]}
                  >
                    <Text style={[styles.interestText, dynamicStyles.text]}>
                      {interest}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>

        {/* Settings */}
        <View style={[styles.settingsCard, dynamicStyles.card]}>
          <Text style={[styles.sectionTitleInCard, dynamicStyles.text]}>
            Settings
          </Text>
          {settingsOptions.map((option) => (
  <Pressable
    key={option.id}
    style={styles.settingItem}
    onPress={() => router.push(option.route as any)}
  >
    <View style={styles.settingLeft}>
      <Ionicons
        name={option.iconName as any}
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

          {/* Sign Out */}
          <Pressable style={styles.settingItem} onPress={handleLogout}>
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

      {/* Profile Image Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackground}
            onPress={() => setShowImageModal(false)}
          >
            <View style={styles.modalContent}>
              <Pressable
                style={styles.closeButton}
                onPress={() => setShowImageModal(false)}
              >
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </Pressable>

              {user.bgUrl && (
                <Image
                  source={{ uri: user.bgUrl }}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
              )}
            </View>
          </Pressable>
        </View>
      </Modal>
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
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  profileInfo: {
    flex: 1,
    gap: 6,
    justifyContent: "center",
  },
  profileName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  infoText: {
    fontSize: 10,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editText: {
    fontSize: 12,
    fontWeight: "600",
  },
  memberSince: {
    fontSize: 12,
    marginBottom: 20,
    fontWeight: "500",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
    paddingVertical: 8,
  },
  statColumn: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  completeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  completeButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  connectionsButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  connectionsButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
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
    fontSize: 14,
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
  referralsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  referralStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  referralCount: {
    fontSize: 10,
    fontWeight: "700",
  },
  referralDescription: {
    fontSize: 11,
    lineHeight: 18,
    marginBottom: 12,
  },
  referralLinkContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  referralLink: {
    fontSize: 11,
    flex: 1,
  },
  copyButton: {
    padding: 4,
    marginLeft: 8,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#4f46e5",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  shareButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingText: {
    fontSize: 11,
    fontWeight: "700",
  },
  signOutText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FF4444",
  },
  footerCard: {
    paddingVertical: 22,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 30,
  },
  footerTitle: {
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 1,
    padding: 8,
  },
  fullImage: {
    width: "90%",
    height: "90%",
    maxWidth: 500,
    maxHeight: 500,
  },
  iconBackground: {
    width: 35,
    height: 35,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  footerSubtitle: {
    fontSize: 10,
    marginBottom: 14,
  },
  footerVersion: {
    fontSize: 10,
  },
  completionBanner: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  completionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  completionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  completionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  completionText: {
    flex: 1,
  },
  completionTitle: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 2,
  },
  completionSubtitle: {
    fontSize: 11,
    lineHeight: 16,
  },
  completionButton: {
    backgroundColor: "#FF9500",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  completionButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
});

export default Profile;
