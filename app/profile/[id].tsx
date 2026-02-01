import Header from "@/components/Header";
import { Skeleton } from "@/components/Skeleton";
import { Text } from "@/components/Themedtext";
import { useTheme } from "@/contexts/ThemeContext";
import { useCampus } from "@/hooks/useCampus";
import { useFullUserProfile } from "@/hooks/useFullUserProfile";
import { useAuthStore } from "@/state/authStore";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import moment from "moment";
import { useEffect, useState } from "react";
import {
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

const UserProfile = () => {
  const { isDark } = useTheme();
  const { user: currentUser } = useAuthStore();
  const { universities, isLoading: isLoadingUniversities } = useCampus();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: profileData, isLoading, error, refetch } = useFullUserProfile(id!);
  const user = profileData?.userDetails || {} as any;
  const stats = profileData?.stats || {} as any;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copyLoading, setCopyLoading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [universityName, setUniversityName] = useState('');

  // University name resolution logic
  useEffect(() => {
    const university = user?.university;

    if (!university?.id || !universities || universities.length === 0) {
      setUniversityName(university?.name || 'University');
      return;
    }

    const foundUniversity = universities.find(u => u.id === university.id);

    if (foundUniversity) {
      setUniversityName(foundUniversity.name);
    } else {
      setUniversityName(university?.name || 'University');
    }
  }, [user, universities]);

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
    iconBackground: {
      backgroundColor: isDark ? "#333333" : "#F0F0F0",
    },
    shareButton: {
      backgroundColor: isDark ? "#4f46e5" : "#4f46e5",
    },
  };

  const profileLink = `https://tarpup.com/profile/${id}`;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleCopyProfileLink = async () => {
    try {
      setCopyLoading(true);
      await Clipboard.setStringAsync(profileLink);
      toast.success("Profile link copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy link");
    } finally {
      setCopyLoading(false);
    }
  };

  const handleShareProfile = async () => {
    try {
      await Share.share({
        message: `Check out ${user?.fname}'s profile on TarpAI Connect!\n\n${profileLink}`,
        title: `${user?.fname}'s Profile`,
        url: profileLink,
      });
    } catch (error) {
      handleCopyProfileLink();
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push("/(tabs)/groups");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, dynamicStyles.container]}>
        <Header />
        <ScrollView style={styles.content}>
          <View style={[styles.profileCard, dynamicStyles.card]}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <Skeleton width={80} height={80} borderRadius={40} />
                <View style={styles.profileInfo}>
                  <Skeleton
                    width={120}
                    height={18}
                    borderRadius={4}
                    style={{ marginBottom: 8 }}
                  />
                  <Skeleton
                    width={180}
                    height={13}
                    borderRadius={4}
                    style={{ marginBottom: 4 }}
                  />
                  <Skeleton width={160} height={13} borderRadius={4} />
                </View>
              </View>
            </View>
            <Skeleton
              width={140}
              height={14}
              borderRadius={4}
              style={{ marginBottom: 16 }}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  // Error state
  if (error || !profileData) {
    return (
      <View style={[styles.container, dynamicStyles.container]}>
        <Header />
        <View style={styles.errorContainer}>
          <Ionicons name="person-circle-outline" size={64} color={dynamicStyles.subtitle.color} />
          <Text style={[styles.errorTitle, dynamicStyles.text]}>
            Profile Not Found
          </Text>
          <Text style={[styles.errorSubtitle, dynamicStyles.subtitle]}>
            This user's profile could not be loaded or doesn't exist.
          </Text>
          <Pressable
            style={[styles.retryButton, dynamicStyles.button]}
            onPress={handleRefresh}
          >
            <Text style={[styles.retryButtonText, dynamicStyles.text]}>
              Try Again
            </Text>
          </Pressable>
          <Pressable
            style={styles.backButton}
            onPress={handleBack}
          >
            <Ionicons name="arrow-back" size={20} color={dynamicStyles.text.color} />
            <Text style={[styles.backButtonText, dynamicStyles.text]}>
              Go Back
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const isOwnProfile = currentUser?.id === user.id;

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Header />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Back Button */}
        <Pressable style={styles.backButtonContainer} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={dynamicStyles.text.color} />
          <Text style={[styles.backText, dynamicStyles.text]}>Back</Text>
        </Pressable>

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
                  {isOwnProfile && " (You)"}
                </Text>
                {user.university && (
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
                )}
                {user.bio && (
                  <Text style={[styles.bioText, dynamicStyles.subtitle]}>
                    {user.bio}
                  </Text>
                )}
              </View>
            </View>
          </View>

          <Text style={[styles.memberSince, dynamicStyles.subtitle]}>
            Member since {moment(user.createdAt).format("MMMM YYYY")}
          </Text>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statColumn}>
              <Text style={[styles.statNumber, dynamicStyles.text]}>
                {stats?.totalMatches || 0}
              </Text>
              <Text style={[styles.statLabel, dynamicStyles.subtitle]}>
                Total Matches
              </Text>
            </View>
            <View style={styles.statColumn}>
              <Text style={[styles.statNumber, dynamicStyles.text]}>
                {stats?.totalGroups || 0}
              </Text>
              <Text style={[styles.statLabel, dynamicStyles.subtitle]}>
                Active Groups
              </Text>
            </View>
            <View style={styles.statColumn}>
              <Text style={[styles.statNumber, dynamicStyles.text]}>
                {stats?.avgComp || 0}%
              </Text>
              <Text style={[styles.statLabel, dynamicStyles.subtitle]}>
                Avg Compatibility
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          {!isOwnProfile && (
            <View style={styles.actionButtons}>
              <Pressable
                style={[styles.shareButton, dynamicStyles.shareButton]}
                onPress={handleShareProfile}
              >
                <Ionicons name="share-outline" size={16} color="#FFFFFF" />
                <Text style={styles.shareButtonText}>Share Profile</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Share Profile Link */}
        {!isOwnProfile && (
          <View style={[styles.shareCard, dynamicStyles.card]}>
            <Text style={[styles.shareTitle, dynamicStyles.text]}>
              Share profile link with friends
            </Text>
            <View style={styles.linkContainer}>
              <Text style={[styles.profileLink, dynamicStyles.subtitle]} numberOfLines={1}>
                {profileLink}
              </Text>
              <Pressable
                style={styles.copyButton}
                onPress={handleCopyProfileLink}
                disabled={copyLoading}
              >
                <Ionicons
                  name={copyLoading ? "hourglass-outline" : "copy-outline"}
                  size={16}
                  color={dynamicStyles.text.color}
                />
              </Pressable>
            </View>
          </View>
        )}

        {/* Interests */}
        {stats?.interests && stats.interests.length > 0 && (
          <View style={[styles.interestsCard, dynamicStyles.card]}>
            <Text style={[styles.sectionTitle, dynamicStyles.text]}>
              Interests
            </Text>
            <View style={styles.interestsGrid}>
              {stats.interests.map((interest: string, index: number) => (
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
        )}
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
  backButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  backText: {
    fontSize: 16,
    fontWeight: "500",
  },
  profileCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  profileHeader: {
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
    fontSize: 18,
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
    fontSize: 13,
  },
  bioText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  memberSince: {
    fontSize: 14,
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
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  shareButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  shareCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  shareTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  linkContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    backgroundColor: "rgba(128, 128, 128, 0.1)",
    borderRadius: 8,
  },
  profileLink: {
    flex: 1,
    fontSize: 12,
  },
  copyButton: {
    padding: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
  },
  interestsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
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
    fontSize: 12,
    fontWeight: "500",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  iconBackground: {
    width: 35,
    height: 35,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  errorSubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 16,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
});

export default UserProfile;