import Header from "@/components/Header";
import { Skeleton } from "@/components/Skeleton";
import { Text } from "@/components/Themedtext";
import { useTheme } from "@/contexts/ThemeContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import moment from "moment";
import React, { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from "react-native";
import { toast } from "sonner-native";

const UserProfile = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isDark } = useTheme();
  const { data: profile, isLoading, error } = useUserProfile(id as string);
  const [copied, setCopied] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
    },
    text: {
      color: isDark ? "#fafafa" : "#0a0a0a",
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
    button: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    linkContainer: {
      backgroundColor: isDark ? "#212122" : "#F5F5F5",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
  };

  const profileLink = `https://tarpup.com/profile/${id}`;

  const copyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(profileLink);
      setCopied(true);
      toast.success("Profile link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const shareProfile = async () => {
    if (!profile?.userDetails) return;

    try {
      await Share.share({
        message: `Check out ${profile.userDetails.fname}'s profile on TarpAI Connect!\n\n${profileLink}`,
        title: `View ${profile.userDetails.fname}'s profile on TarpAI Connect 🎉`,
        url: profileLink,
      });
    } catch (error) {
      copyToClipboard();
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, dynamicStyles.container]}>
        <Header />
        <ScrollView style={styles.content}>
          <View style={[styles.profileCard, dynamicStyles.card]}>
            <View style={styles.backSection}>
              <Skeleton width={24} height={24} borderRadius={12} />
              <Skeleton width={60} height={16} borderRadius={4} />
            </View>

            <View style={styles.profileHeader}>
              <Skeleton width={100} height={100} borderRadius={50} />
              <View style={styles.profileInfo}>
                <Skeleton
                  width={140}
                  height={20}
                  borderRadius={4}
                  style={{ marginBottom: 8 }}
                />
                <Skeleton
                  width={180}
                  height={14}
                  borderRadius={4}
                  style={{ marginBottom: 4 }}
                />
                <Skeleton width={160} height={14} borderRadius={4} />
                <Skeleton
                  width={120}
                  height={12}
                  borderRadius={4}
                  style={{ marginTop: 8 }}
                />
              </View>
            </View>
          </View>

          <View style={[styles.statsCard, dynamicStyles.card]}>
            <Skeleton
              width={120}
              height={16}
              borderRadius={4}
              style={{ marginBottom: 16 }}
            />
            <View style={styles.statsContainer}>
              {Array(3)
                .fill(0)
                .map((_, i) => (
                  <View key={i} style={styles.statItem}>
                    <Skeleton width={45} height={45} borderRadius={22} />
                    <Skeleton
                      width={30}
                      height={18}
                      borderRadius={4}
                      style={{ marginTop: 8 }}
                    />
                    <Skeleton
                      width={80}
                      height={12}
                      borderRadius={4}
                      style={{ marginTop: 4 }}
                    />
                  </View>
                ))}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={[styles.container, dynamicStyles.container]}>
        <Header />
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
          <Text style={[styles.errorText, dynamicStyles.text]}>
            {error?.toString() || "User not found"}
          </Text>
          <Text style={[styles.errorSubtext, dynamicStyles.subtitle]}>
            This user's profile could not be loaded.
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
        <View style={styles.backSection}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons
              name="arrow-back"
              size={24}
              color={dynamicStyles.text.color}
            />
          </Pressable>
          <Text style={[styles.backText, dynamicStyles.text]}>Back</Text>
        </View>
        {/* Profile Section */}
        <View style={[styles.profileCard, dynamicStyles.card]}>
          <View style={styles.profileHeader}>
            <Pressable
              onPress={() =>
                profile.userDetails?.bgUrl && setShowImageModal(true)
              }
            >
              <View style={styles.avatar}>
                {profile.userDetails?.bgUrl ? (
                  <Image
                    source={{ uri: profile.userDetails.bgUrl }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View
                    style={[
                      styles.avatarPlaceholder,
                      dynamicStyles.iconBackground,
                    ]}
                  >
                    <Text style={[styles.avatarText, dynamicStyles.text]}>
                      {profile.userDetails?.fname?.[0]?.toUpperCase() || "U"}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>

            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, dynamicStyles.text]}>
                {profile.userDetails?.fname}
              </Text>

              {profile.userDetails?.university && (
                <View style={styles.infoRow}>
                  <Ionicons
                    name="school-outline"
                    size={16}
                    color={dynamicStyles.subtitle.color}
                  />
                  <Text style={[styles.universityText, dynamicStyles.subtitle]}>
                    {profile.userDetails.university.name}
                  </Text>
                </View>
              )}

              {profile.userDetails?.phoneNumber && (
                <View style={styles.infoRow}>
                  <Ionicons
                    name="call-outline"
                    size={16}
                    color={dynamicStyles.subtitle.color}
                  />
                  <Text style={[styles.infoText, dynamicStyles.subtitle]}>
                    {profile.userDetails.phoneNumber}
                  </Text>
                </View>
              )}

              <Text style={[styles.memberSince, dynamicStyles.subtitle]}>
                Member since{" "}
                {moment(profile.userDetails?.createdAt).format("MMMM YYYY")}
              </Text>
            </View>
          </View>

          {profile.userDetails?.bio && (
            <Text style={[styles.bioText, dynamicStyles.subtitle]}>
              {profile.userDetails.bio}
            </Text>
          )}
        </View>

        {/* Activity Stats */}
        <View style={[styles.statsCard, dynamicStyles.card]}>
          <Text style={[styles.sectionTitle, dynamicStyles.text]}>
            Activity Stats
          </Text>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View
                style={[styles.iconBackground, dynamicStyles.iconBackground]}
              >
                <Ionicons
                  name="star-outline"
                  size={18}
                  color={dynamicStyles.subtitle.color}
                />
              </View>
              <Text style={[styles.statNumber, dynamicStyles.text]}>
                {profile.stats?.totalMatches || 0}
              </Text>
              <Text style={[styles.statLabel, dynamicStyles.subtitle]}>
                Total Matches
              </Text>
            </View>

            <View style={styles.statItem}>
              <View
                style={[styles.iconBackground, dynamicStyles.iconBackground]}
              >
                <Ionicons
                  name="people-outline"
                  size={18}
                  color={dynamicStyles.subtitle.color}
                />
              </View>
              <Text style={[styles.statNumber, dynamicStyles.text]}>
                {profile.stats?.totalGroups || 0}
              </Text>
              <Text style={[styles.statLabel, dynamicStyles.subtitle]}>
                Active Groups
              </Text>
            </View>

            <View style={styles.statItem}>
              <View
                style={[styles.iconBackground, dynamicStyles.iconBackground]}
              >
                <Ionicons
                  name="trending-up-outline"
                  size={18}
                  color={dynamicStyles.subtitle.color}
                />
              </View>
              <Text style={[styles.statNumber, dynamicStyles.text]}>
                {profile.stats?.avgComp || 0}%
              </Text>
              <Text style={[styles.statLabel, dynamicStyles.subtitle]}>
                Avg Compatibility
              </Text>
            </View>
          </View>
        </View>

        {/* Share Profile */}
        <View style={[styles.shareCard, dynamicStyles.card]}>
          <Text style={[styles.sectionTitle, dynamicStyles.text]}>
            Share Profile
          </Text>
          <Text style={[styles.shareDescription, dynamicStyles.subtitle]}>
            Share {profile.userDetails?.fname}'s profile with friends
          </Text>

          <View style={[styles.linkContainer, dynamicStyles.linkContainer]}>
            <Text
              style={[styles.linkText, dynamicStyles.text]}
              numberOfLines={1}
            >
              {profileLink}
            </Text>
            <Pressable style={styles.copyButton} onPress={copyToClipboard}>
              <Ionicons
                name={copied ? "checkmark-outline" : "copy-outline"}
                size={18}
                color={copied ? "#4ADE80" : dynamicStyles.text.color}
              />
            </Pressable>
          </View>

          <Pressable style={styles.shareButton} onPress={shareProfile}>
            <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
            <Text style={styles.shareButtonText}>Share Profile</Text>
          </Pressable>
        </View>

        {/* Interests */}
        {profile.stats?.interests && profile.stats.interests.length > 0 && (
          <View style={[styles.interestsCard, dynamicStyles.card]}>
            <Text style={[styles.sectionTitle, dynamicStyles.text]}>
              Interests
            </Text>

            <View style={styles.interestsGrid}>
              {profile.stats.interests.map(
                (interest: string, index: number) => (
                  <View
                    key={index}
                    style={[styles.interestChip, dynamicStyles.button]}
                  >
                    <Text style={[styles.interestText, dynamicStyles.text]}>
                      {interest}
                    </Text>
                  </View>
                )
              )}
            </View>
          </View>
        )}

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

              {profile.userDetails?.bgUrl && (
                <Image
                  source={{ uri: profile.userDetails.bgUrl }}
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

  backBtn: {
    padding: 4,
  },

  profileHeader: {
    flexDirection: "row",
    gap: 16,
    alignItems: "flex-start",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  profileInfo: {
    flex: 1,
    gap: 6,
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
    marginBottom: 4,
  },
  universityText: {
    fontSize: 14,
    fontWeight: "500",
  },
  infoText: {
    fontSize: 13,
    fontWeight: "500",
  },
  bioText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 12,
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
    width: 45,
    height: 45,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  backSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 4,
  },
  backText: {
    fontSize: 16,
    fontWeight: "500",
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
  shareCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  shareDescription: {
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 18,
  },
  linkContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  linkText: {
    fontSize: 12,
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
    borderRadius: 8,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  interestsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  footerSubtitle: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 4,
  },
  footerVersion: {
    fontSize: 11,
    textAlign: "center",
  },
  interestsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  interestChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  interestText: {
    fontSize: 10,
    fontWeight: "500",
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
  errorSubtext: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
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
});

export default UserProfile;
