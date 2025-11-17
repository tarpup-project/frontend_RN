import { Text } from "@/components/Themedtext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuthStore } from "@/state/authStore";
import { GroupMember } from "@/types/groups";
import { Star, UsersRound } from "lucide-react-native";
import React from "react";
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

interface GroupInfoModalProps {
  visible: boolean;
  groupDetails: {
    id: string;
    name: string;
    members: GroupMember[];
    score: number;
    category?: Array<{ name: string; bgColorHex: string }>;
  };
  iconPosition: { x: number; y: number };
  slideAnim: Animated.Value;
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
  onClose: () => void;
  navigateToProfile: (userId: string) => void;
}

export const GroupInfoModal: React.FC<GroupInfoModalProps> = ({
  visible,
  groupDetails,
  iconPosition,
  slideAnim,
  fadeAnim,
  scaleAnim,
  onClose,
  navigateToProfile,
}) => {
  const { isDark } = useTheme();
  const { user } = useAuthStore();

  const dynamicStyles = {
    modal: {
      backgroundColor: isDark ? "#0A0A0A" : "#FFFFFF",
      borderColor: isDark ? "#43474c" : "#d6dadf",
    },
    text: {
      color: isDark ? "#FFFFFF" : "#000000",
    },
    subtitle: {
      color: isDark ? "#CCCCCC" : "#666666",
    },
    compatibilityText: {
      color: isDark ? "#FFFFFF" : "#000000",
    },
  };

  if (!visible) return null;

  return (
    <>
      <Pressable 
        style={styles.modalOverlay}
        onPress={onClose}
      />

      <Animated.View
        style={[
          styles.groupInfoSlideModal,
          dynamicStyles.modal,
          {
            top: iconPosition.y,
            right: 16, 
            opacity: fadeAnim,
            transform: [
              { translateX: slideAnim },
              { scale: scaleAnim }
            ],
          },
        ]}
      >
        <ScrollView style={styles.groupInfoContent}>
          <View style={styles.groupInfoSection}>
            <View style={styles.groupInfoTop}>
              <View
                style={[
                  styles.groupCategoryIcon,
                  {
                    backgroundColor:
                      groupDetails.category?.[0]?.bgColorHex ||
                      "#007AFF",
                  },
                ]}
              >
                <UsersRound size={20} color="#ab653e" />
              </View>
              <Text style={[styles.groupInfoName, dynamicStyles.text]}>
                {groupDetails.name}
              </Text>
              <View style={styles.compatibilityBadge}>
                <Star size={16} color="#FFD700" />
                <Text
                  style={[
                    styles.compatibilityText,
                    dynamicStyles.compatibilityText,
                  ]}
                >
                  {groupDetails.score}% compatibility
                </Text>
              </View>
              <Text style={[styles.categorySubtext, dynamicStyles.subtitle]}>
                {groupDetails.category?.[0]?.name || "friends"} •{" "}
                {groupDetails.members.length} members
              </Text>
            </View>
          </View>

          <View style={styles.groupInfoSection}>
            <View style={styles.membersHeader}>
              <UsersRound size={18} color={dynamicStyles.text.color} />
              <Text style={[styles.groupInfoLabel, dynamicStyles.text]}>
                Members ({groupDetails.members.length})
              </Text>
            </View>

            <ScrollView style={styles.membersScrollContainer}>
            {groupDetails.members.map(
              (member: GroupMember, index: number) => {
                const colors = [
                  "#FF6B9D",
                  "#4A90E2",
                  "#9C27B0",
                  "#00D084",
                  "#FFB347",
                ];
                return (
                  <Pressable
                    key={member.id}
                    style={styles.memberItem}
                    onPress={() => {
                      onClose();
                      navigateToProfile(member.id);
                    }}
                  >
                    <View
                      style={[
                        styles.memberAvatar,
                        {
                          backgroundColor: member.bgUrl
                            ? "transparent"
                            : colors[index % colors.length],
                        },
                      ]}
                    >
                      {member.bgUrl ? (
                        <Image
                          source={{ uri: member.bgUrl }}
                          style={styles.memberAvatarImage}
                        />
                      ) : (
                        <Text style={styles.memberAvatarText}>
                          {member.fname[0]}
                        </Text>
                      )}
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={[styles.memberName, dynamicStyles.text]}>
                        {member.fname}
                        {member.id === user?.id && " (You)"}
                      </Text>
                      {index === 0 && (
                        <Text
                          style={[styles.memberRole, dynamicStyles.subtitle]}
                        >
                          Admin
                        </Text>
                      )}
                    </View>
                  </Pressable>
                );
              }
            )}
            </ScrollView>
          </View>
        </ScrollView>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    backgroundColor: "transparent", 
  },
  groupInfoSlideModal: {
    position: "absolute",
    width: 280, // Increased from 190
    maxHeight: 500, // Added max height
    borderRadius: 12,
    borderWidth: 1,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 10,
  },
  groupInfoContent: {
    flex: 1,
    padding: 16, // Increased from 12
  },
  groupInfoSection: {
    marginBottom: 16, // Increased from 12
  },
  groupInfoTop: {
    alignItems: "center",
    marginBottom: 20,
  },
  groupCategoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  groupInfoName: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  compatibilityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  compatibilityText: {
    fontSize: 12,
    fontWeight: "600",
  },
  categorySubtext: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 4,
  },
  membersHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  membersScrollContainer: {
    maxHeight: 250, // Increased from 150
  },
  groupInfoLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  memberAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  memberAvatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 12,
    fontWeight: "500",
  },
  memberRole: {
    fontSize: 10,
    marginTop: 2,
  },
});