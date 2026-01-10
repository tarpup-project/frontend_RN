import { Text } from "@/components/Themedtext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuthStore } from "@/state/authStore";
import { GroupMember } from "@/types/groups";
import { Ionicons } from "@expo/vector-icons";
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

  // Function to detect if a name looks like a person's name
  const isPersonName = (name: string): boolean => {
    if (!name) return false;
    
    const normalizedName = name.trim().toLowerCase();
    
    // Common patterns that indicate it's NOT a person's name
    const nonPersonPatterns = [
      /roommate/i,
      /wanted/i,
      /looking for/i,
      /seeking/i,
      /need/i,
      /study group/i,
      /study buddy/i,
      /project/i,
      /assignment/i,
      /homework/i,
      /tutor/i,
      /help/i,
      /ride/i,
      /carpool/i,
      /share/i,
      /sell/i,
      /buy/i,
      /trade/i,
      /exchange/i,
      /market/i,
      /book/i,
      /textbook/i,
      /furniture/i,
      /apartment/i,
      /housing/i,
      /sublease/i,
      /sublet/i,
      /rent/i,
      /lease/i,
      /group/i,
      /team/i,
      /club/i,
      /event/i,
      /party/i,
      /meetup/i,
      /hangout/i,
      /friends/i,
      /gaming/i,
      /game/i,
      /workout/i,
      /gym/i,
      /fitness/i,
      /sports/i,
      /basketball/i,
      /soccer/i,
      /tennis/i,
      /volleyball/i,
      /football/i,
      /baseball/i,
      /class/i,
      /course/i,
      /lecture/i,
      /lab/i,
      /discussion/i,
      /section/i,
      /cs\s*\d+/i, // CS101, CS 101, etc.
      /math\s*\d+/i, // MATH101, MATH 101, etc.
      /eng\s*\d+/i, // ENG101, ENG 101, etc.
      /bio\s*\d+/i, // BIO101, BIO 101, etc.
      /chem\s*\d+/i, // CHEM101, CHEM 101, etc.
      /phys\s*\d+/i, // PHYS101, PHYS 101, etc.
      /econ\s*\d+/i, // ECON101, ECON 101, etc.
      /psyc\s*\d+/i, // PSYC101, PSYC 101, etc.
      /hist\s*\d+/i, // HIST101, HIST 101, etc.
      /\d{3,}/i, // Any 3+ digit numbers (course codes)
    ];
    
    // Check if name matches any non-person patterns
    const matchesNonPersonPattern = nonPersonPatterns.some(pattern => pattern.test(normalizedName));
    
    if (matchesNonPersonPattern) {
      return false;
    }
    
    // Additional checks for person names
    const words = normalizedName.split(/\s+/);
    
    // If it's 1-2 words and doesn't match non-person patterns, likely a person
    if (words.length <= 2) {
      // Check if it contains common first names or looks like a name
      const commonFirstNames = [
        'john', 'jane', 'mike', 'sarah', 'david', 'emily', 'chris', 'jessica',
        'michael', 'ashley', 'james', 'amanda', 'robert', 'melissa', 'william',
        'stephanie', 'richard', 'nicole', 'joseph', 'elizabeth', 'thomas', 'heather',
        'charles', 'michelle', 'daniel', 'kimberly', 'matthew', 'donna', 'anthony',
        'carol', 'mark', 'ruth', 'donald', 'sharon', 'steven', 'laura', 'paul',
        'sandra', 'andrew', 'kathy', 'joshua', 'cynthia', 'kenneth', 'amy',
        'kevin', 'angela', 'brian', 'shirley', 'george', 'anna', 'edward', 'brenda',
        'ronald', 'emma', 'timothy', 'olivia', 'jason', 'wayne', 'jeffrey', 'ryan',
        'jacob', 'gary', 'nicholas', 'noah', 'jonathan', 'brandon', 'justin',
        'gregory', 'samuel', 'alexander', 'patrick', 'benjamin', 'jack', 'dennis',
        'jerry', 'tyler', 'aaron', 'jose', 'henry', 'adam', 'douglas', 'nathan',
        'peter', 'zachary', 'kyle', 'walter', 'harold', 'carl', 'arthur', 'gerald',
        'roger', 'keith', 'jeremy', 'lawrence', 'sean', 'christian', 'ethan',
        'austin', 'joe', 'albert', 'mason', 'roy', 'eugene', 'louis', 'wayne',
        'ralph', 'bobby', 'russell', 'louis', 'philip', 'johnny', 'hieu', 'nguyen',
        'alex', 'sam', 'max', 'ben', 'tom', 'tim', 'jim', 'bob', 'dan', 'matt',
        'nick', 'rick', 'steve', 'dave', 'pete', 'tony', 'andy', 'jeff', 'bill',
        'will', 'rob', 'ron', 'don', 'ken', 'ray', 'lee', 'jay', 'guy', 'art'
      ];
      
      const firstWord = words[0];
      if (commonFirstNames.includes(firstWord)) {
        return true;
      }
      
      // Check if it looks like a name (starts with capital, reasonable length)
      if (firstWord.length >= 2 && firstWord.length <= 15 && /^[a-z]+$/.test(firstWord)) {
        return true;
      }
    }
    
    return false;
  };

  // Determine if this is a personal chat based on member count AND name pattern
  const isPersonalChat = (() => {
    const memberCount = (groupDetails.members || []).length;
    
    // If 2 or fewer members AND the name looks like a person's name, it's a personal chat
    if (memberCount <= 2 && groupDetails.name && isPersonName(groupDetails.name)) {
      return true;
    }
    
    // Otherwise, it's a group chat
    return false;
  })();

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
            top: iconPosition.y + 70,
            right: 20, 
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
                <Ionicons name="people" size={20} color="#ab653e" />
              </View>
              <Text style={[styles.groupInfoName, dynamicStyles.text]}>
                {groupDetails.name}
              </Text>
              <View style={styles.compatibilityBadge}>
              <Ionicons name="star" size={16} color="#FFD700" />
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
            <Ionicons name="people" size={18} color={dynamicStyles.text.color} />
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
                
                // Determine if this member should show admin label
                const shouldShowAdmin = !isPersonalChat && (
                  index === 0 || // First member (traditional admin)
                  !isPersonName(groupDetails.name) // Auto-admin for non-personal names
                );
                
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
                      {shouldShowAdmin && (
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
    width: 280, 
    height: 550,
    maxHeight: 600, 
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
    padding: 16, 
  },
  groupInfoSection: {
    marginBottom: 16, 
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
    maxHeight: 300, 
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