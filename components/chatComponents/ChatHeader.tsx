import { GroupOptionsDropdown } from "@/components/GroupOptionsDropdown";
import { useTheme } from "@/contexts/ThemeContext";
import { GroupMember } from "@/types/groups";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

interface ChatHeaderProps {
  groupDetails: {
    id: string;
    name: string;
    members: GroupMember[];
    score: number;
    shareLink: string;
    isJoined: boolean;
    isAdmin: boolean;
    isComplete: boolean;
  };
  showDropdown: boolean;
  onToggleDropdown: () => void;
  onShowGroupInfo: () => void;
  onLeaveSuccess: () => void;
  navigateToProfile: (userId: string) => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  groupDetails,
  showDropdown,
  onToggleDropdown,
  onShowGroupInfo,
  onLeaveSuccess,
  navigateToProfile,
}) => {
  const { isDark } = useTheme();
  const router = useRouter();

  const dynamicStyles = {
    header: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
      borderBottomColor: isDark ? "#333333" : "#E0E0E0",
    },
    text: {
      color: isDark ? "#FFFFFF" : "#000000",
    },
    subtitle: {
      color: isDark ? "#CCCCCC" : "#666666",
    },
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={[styles.header, dynamicStyles.header]}>
      <Pressable onPress={handleBack} style={styles.backButton}>
        <Ionicons
          name="arrow-back"
          size={24}
          color={dynamicStyles.text.color}
        />
      </Pressable>

      <Pressable style={styles.headerInfo} onPress={onToggleDropdown}>
        <View style={styles.avatarsContainer}>
          {(groupDetails.members || [])
            .slice(0, 3)
            .map((member: GroupMember, index: number) => {
              const colors = ["#FF6B9D", "#4A90E2", "#9C27B0", "#00D084"];
              return (
                <Pressable
                  key={member.id}
                  onPress={() => navigateToProfile(member.id)}
                >
                  <View
                    style={[
                      styles.headerAvatar,
                      {
                        backgroundColor: member.bgUrl
                          ? "transparent"
                          : colors[index % colors.length],
                      },
                      index > 0 && { marginLeft: -8 },
                    ]}
                  >
                    {member.bgUrl ? (
                      <Image
                        source={{ uri: member.bgUrl }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <Text style={styles.avatarText}>{(member.fname || 'U')[0]}</Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
        </View>

        <View style={styles.headerText}>
          <Text style={[styles.groupName, dynamicStyles.text]}>
            {groupDetails.name}
          </Text>
          <View style={styles.headerSubtitle}>
            <Text style={[styles.membersCount, dynamicStyles.subtitle]}>
              {(groupDetails.members || []).length} members
            </Text>
            <View style={styles.dot} />
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={[styles.ratingText, dynamicStyles.subtitle]}>
                {groupDetails.score || 0}%
              </Text>
            </View>
          </View>
        </View>
      </Pressable>

      <View style={styles.infoButtonContainer}>
        <GroupOptionsDropdown
          groupDetails={groupDetails}
          showDropdown={showDropdown}
          onToggleDropdown={onToggleDropdown}
          onShowGroupInfo={onShowGroupInfo}
          onLeaveSuccess={onLeaveSuccess}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  backButton: {
    padding: 4,
  },
  headerInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  headerText: {
    flex: 1,
  },
  groupName: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  headerSubtitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  membersCount: {
    fontSize: 12,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#999999",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
  },
  infoButtonContainer: {
    position: "relative",
  },
});