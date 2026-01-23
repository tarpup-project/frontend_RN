import { Text } from "@/components/Themedtext";
import { useTheme } from "@/contexts/ThemeContext";
import { useGroupActions } from "@/hooks/useGroupActions";
import { useGroupDetails } from "@/hooks/useGroups";
import { useAuthStore } from "@/state/authStore";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { toast } from "sonner-native";

interface GroupDetailsType {
  id: string;
  name: string;
  shareLink?: string;
  isJoined: boolean | undefined;
  isAdmin: boolean | undefined;
  isComplete: boolean;
  members?: any[];
}

interface GroupOptionsDropdownProps {
  groupDetails: GroupDetailsType;
  showDropdown: boolean;
  onToggleDropdown: () => void;
  onShowGroupInfo: () => void;
  onLeaveSuccess: () => void;
  onRefresh?: () => void;
}

export const GroupOptionsDropdown = ({
  groupDetails,
  showDropdown,
  onToggleDropdown,
  onShowGroupInfo,
  onLeaveSuccess,
  onRefresh,
}: GroupOptionsDropdownProps) => {
  const { isDark } = useTheme();
  const { user } = useAuthStore();
  const router = useRouter();
  
  const {
    leaveGroup,
    reportGroup,
    markAsCompleted,
    isLeaving,
    isReporting,
    isMarkingComplete,
  } = useGroupActions();

  // Fetch detailed group info when dropdown is shown
  const { data: detailedGroupData, refetch: refetchGroupDetails } = useGroupDetails(groupDetails.id);
  
  const [showReportModal, setShowReportModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [reportReason, setReportReason] = useState("spam");
  const [reportDetails, setReportDetails] = useState("");
  const [isUserAdmin, setIsUserAdmin] = useState(false);

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

  // Determine if this is a personal chat (hide mark as completed for all personal chats)
  const isPersonalChat = (() => {
    const memberCount = (detailedGroupData?.members?.length || groupDetails.members?.length || 0);
    
    // If there are 2 or fewer people, it's a personal chat (1-on-1 or just me)
    if (memberCount <= 2) {
      return true;
    }
    
    // Otherwise, it's a group
    return false;
  })();
  
  const chatType = isPersonalChat ? 'chat' : 'group';

  // Check if user is admin when dropdown is shown or detailed data changes
  useEffect(() => {
    const data = detailedGroupData || groupDetails;
    const groupName = data?.name;
    const nameIsPerson = isPersonName(groupName);
    
    // Check admin if it's a group chat OR if it's a personal chat with a non-person name (e.g. "Buying Shoe")
    const shouldCheckAdmin = !isPersonalChat || !nameIsPerson;

    if (showDropdown && shouldCheckAdmin) {
      if (data) {
        console.log('🔍 Checking admin status for group:', data.name);
        console.log('🔍 Current user ID:', user?.id);
        console.log('🔍 Group isAdmin flag:', data.isAdmin);
        console.log('🔍 Group members:', data.members);
        
        // Check if current user is admin - rely on backend data first
        let isAdmin = data.isAdmin || false;
        
        // Fallback: If isAdmin is false, check if user is the first member
        // (Backend convention: Creator/Admin is often the first member)
        if (!isAdmin && user?.id && data.members && Array.isArray(data.members) && data.members.length > 0) {
          const firstMember = data.members[0];
          // Handle case where member might be an ID string or an object with ID
          const firstMemberId = typeof firstMember === 'string' ? firstMember : firstMember.id;
          
          console.log('🔍 First member ID:', firstMemberId);
          
          if (firstMemberId === user.id) {
            isAdmin = true;
            console.log('✅ User is admin (first member)');
          }
        }
        
        // Additional fallback: Check if user ID matches any member with admin role
        if (!isAdmin && user?.id && data.members && Array.isArray(data.members)) {
          const userMember = data.members.find((member: any) => {
            const memberId = typeof member === 'string' ? member : member.id;
            return memberId === user.id;
          });
          
          if (userMember && typeof userMember === 'object' && userMember.isAdmin) {
            isAdmin = true;
            console.log('✅ User is admin (member role)');
          }
        }
        
        console.log('🔍 Final admin status:', isAdmin);
        setIsUserAdmin(isAdmin);
      }
    } else if (showDropdown) {
      // Personal chats (with person names) don't have admin concept
      setIsUserAdmin(false);
    }
  }, [showDropdown, detailedGroupData, groupDetails, user?.id, isPersonalChat]);

  // Refetch group details when dropdown is opened
  useEffect(() => {
    if (showDropdown) {
      refetchGroupDetails();
    }
  }, [showDropdown, refetchGroupDetails]);

  const dynamicStyles = {
    text: {
      color: isDark ? "#FFFFFF" : "#000000",
    },
    subtitle: {
      color: isDark ? "#CCCCCC" : "#666666",
    },
    dropdown: {
      backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    modal: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
    },
    input: {
      backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5",
      borderColor: isDark ? "#333333" : "#E0E0E0",
      color: isDark ? "#FFFFFF" : "#000000",
    },
  };

  const handleShareGroup = async () => {
    onToggleDropdown();
    if (!groupDetails?.shareLink) {
      toast.error("No share link available");
      return;
    }

    try {
      await Clipboard.setStringAsync(groupDetails.shareLink);
      toast.success("Group link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleLeaveGroup = () => {
    // Optimistically close modal and navigate back
    setShowLeaveModal(false);
    onLeaveSuccess();

    // Perform leave action in background
    leaveGroup(groupDetails.id).catch((error) => {
      console.error("Failed to leave group in background:", error);
      // Note: error handling is managed within useGroupActions including rollback
    });
  };

  const handleMarkComplete = async () => {
    const success = await markAsCompleted(groupDetails.id);
    setShowCompleteModal(false);
    if (success) {
      if (onRefresh) {
        onRefresh();
      }
      // Update local state to reflect completion
      setIsUserAdmin(false); // Hide the option after completion
      router.back();
    }
  };

  const handleReportSubmit = async () => {
    const success = await reportGroup({
      groupID: groupDetails.id,
      reportReason,
      reportExplanation: reportDetails,
    });
    if (success) {
      setShowReportModal(false);
      setReportReason("spam");
      setReportDetails("");
    }
  };

  return (
    <>
      <Pressable style={styles.infoButton} onPress={onToggleDropdown}>
        {!showDropdown ? (
          <View
            style={[
              styles.infoIconCircle,
              { borderColor: dynamicStyles.text.color },
            ]}
          >
            <Text style={[styles.infoIconText, dynamicStyles.text]}>i</Text>
          </View>
        ) : (
          <Ionicons name="close" size={20} color="#FF3B30" />
        )}
      </Pressable>

      {showDropdown && (
        <View style={[styles.dropdown, dynamicStyles.dropdown]}>
          <Pressable
            style={styles.dropdownItem}
            onPress={() => {
              onToggleDropdown();
              onShowGroupInfo();
            }}
          >
            <Ionicons name="people-outline" size={16} color={dynamicStyles.text.color} />
            <Text style={[styles.dropdownText, dynamicStyles.text]}>
              More Info
            </Text>
          </Pressable>

          {groupDetails.isJoined !== false && (
            <Pressable
              style={styles.dropdownItem}
              onPress={() => {
                onToggleDropdown();
                setShowReportModal(true);
              }}
            >
              <Ionicons
                name="flag-outline"
                size={16}
                color={dynamicStyles.text.color}
              />
              <Text style={[styles.dropdownText, dynamicStyles.text]}>
                Report
              </Text>
            </Pressable>
          )}

          {groupDetails.shareLink && !isPersonalChat && (
            <Pressable style={styles.dropdownItem} onPress={handleShareGroup}>
              <Ionicons name="share-outline" size={16} color={dynamicStyles.text.color} />
              <Text style={[styles.dropdownText, dynamicStyles.text]}>
                Share Group
              </Text>
            </Pressable>
          )}

          {(() => {
            // Only show for groups where user is admin
            // Also show for personal chats (<=2 members) if the name is NOT a person's name AND there are multiple bgUrls
            const groupName = detailedGroupData?.name || groupDetails.name;
            const nameIsPerson = isPersonName(groupName);
            
            const members = detailedGroupData?.members || groupDetails.members || [];
            const bgUrlCount = members.filter((m: any) => m.bgUrl).length;

            const shouldShow = (!detailedGroupData?.isComplete) && isUserAdmin && (
              !isPersonalChat || (!nameIsPerson && bgUrlCount > 1)
            );

            console.log('🔍 Mark as Completed visibility check:', {
              isPersonalChat,
              nameIsPerson,
              bgUrlCount,
              isUserAdmin,
              isComplete: detailedGroupData?.isComplete,
              shouldShow
            });
            return shouldShow;
          })() && (
            <Pressable
              style={styles.dropdownItem}
              onPress={() => {
                onToggleDropdown();
                setShowCompleteModal(true);
              }}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={16}
                color="#4ADE80"
              />
              <Text style={[styles.dropdownText, { color: "#4ADE80" }]}>
                Mark as Completed
              </Text>
            </Pressable>
          )}

          {groupDetails.isJoined !== false && (
            <Pressable
              style={styles.dropdownItem}
              onPress={() => {
                onToggleDropdown();
                setShowLeaveModal(true);
              }}
              disabled={isLeaving}
            >
              <Ionicons name="close" size={16} color="#FF3B30" />
              <Text style={[styles.dropdownText, { color: "#FF3B30" }]}>
                {isLeaving ? `Leaving ${chatType}...` : `Leave ${chatType === 'chat' ? 'Chat' : 'Group'}`}
              </Text>
            </Pressable>
          )}
        </View>
      )}

      <Modal
        visible={showReportModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.centeredModalContainer}>
          <View style={[styles.reportModal, dynamicStyles.modal]}>
            <View style={styles.reportHeader}>
              <Text style={[styles.reportTitle, dynamicStyles.text]}>
                Report Group
              </Text>
              <Pressable onPress={() => setShowReportModal(false)}>
                <Ionicons name="close" size={24} color={dynamicStyles.text.color} />
              </Pressable>
            </View>

            <Text style={[styles.reportSubtitle, dynamicStyles.subtitle]}>
              Please select a reason for reporting this group:
            </Text>

            <View style={[styles.pickerContainer, dynamicStyles.input]}>
              <Pressable
                style={styles.picker}
                onPress={() => {
                  const reasons = [
                    "Spam",
                    "Abusive Content",
                    "Inappropriate Content",
                    "Other",
                  ];
                  Alert.alert(
                    "Select Reason",
                    "",
                    reasons.map((reason) => ({
                      text: reason,
                      onPress: () =>
                        setReportReason(reason.toLowerCase().replace(" ", "")),
                    }))
                  );
                }}
              >
                <Text style={[styles.pickerText, dynamicStyles.text]}>
                  {reportReason.charAt(0).toUpperCase() + reportReason.slice(1)}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={dynamicStyles.text.color}
                />
              </Pressable>
            </View>

            <TextInput
              style={[styles.reportTextInput, dynamicStyles.input]}
              placeholder="Additional details (optional)"
              placeholderTextColor={isDark ? "#666666" : "#999999"}
              value={reportDetails}
              onChangeText={setReportDetails}
              multiline
              maxLength={500}
            />

            <View style={styles.reportButtons}>
              <Pressable
                style={[styles.reportButton, styles.reportSubmit]}
                onPress={handleReportSubmit}
                disabled={isReporting}
              >
                <Text style={styles.reportSubmitText}>
                  {isReporting ? "Submitting..." : "Submit Report"}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.reportButton, styles.reportCancel]}
                onPress={() => setShowReportModal(false)}
              >
                <Text style={styles.reportCancelText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showLeaveModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLeaveModal(false)}
      >
        <View style={styles.centeredModalContainer}>
          <View style={[styles.confirmModal, dynamicStyles.modal]}>
            <Text style={[styles.confirmTitle, dynamicStyles.text]}>
              Are you sure you want to leave this {chatType}?
            </Text>

            <View style={styles.confirmButtons}>
              <Pressable
                style={[styles.confirmButton, styles.confirmLeave]}
                onPress={handleLeaveGroup}
                disabled={isLeaving}
              >
                <Text style={styles.confirmLeaveText}>
                  {isLeaving ? `Leaving ${chatType}...` : "Yes, Leave"}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.confirmButton, styles.confirmCancel]}
                onPress={() => setShowLeaveModal(false)}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCompleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCompleteModal(false)}
      >
        <View style={styles.centeredModalContainer}>
          <View style={[styles.confirmModal, dynamicStyles.modal]}>
            <Text style={[styles.confirmTitle, dynamicStyles.text]}>
              Are you sure you want to mark "{detailedGroupData?.name || groupDetails.name}" as completed?
            </Text>

            <View style={styles.confirmButtons}>
              <Pressable
                style={[styles.confirmButton, styles.confirmCancel]}
                onPress={() => setShowCompleteModal(false)}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.confirmButton, styles.confirmComplete]}
                onPress={handleMarkComplete}
                disabled={isMarkingComplete}
              >
                <Text style={styles.confirmCompleteText}>
                  {isMarkingComplete ? "Marking..." : "Mark Complete"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {showDropdown && (
        <Pressable style={styles.overlay} onPress={onToggleDropdown} />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  infoButton: {
    padding: 4,
  },
  infoIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  infoIconText: {
    fontSize: 6,
    fontWeight: "600",
  },
  dropdown: {
    position: "absolute",
    top: 35,
    right: 0,
    width: 150,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 8,
  },
  dropdownText: {
    fontSize: 11,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  centeredModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  reportModal: {
    borderRadius: 12,
    padding: 20,
    maxWidth: "90%",
    width: 360,
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  reportSubtitle: {
    fontSize: 11,
    marginBottom: 16,
    lineHeight: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
  },
  picker: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 7,
  },
  pickerText: {
    fontSize: 13,
  },
  reportTextInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    minHeight: 50,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  reportButtons: {
    flexDirection: "row",
    gap: 12,
  },
  reportButton: {
    flex: 1,
    paddingHorizontal: 4,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: "center",
  },
  reportSubmit: {
    backgroundColor: "#FF3B30",
  },
  reportCancel: {
    backgroundColor: "#F5F5F5",
  },
  reportSubmitText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  reportCancelText: {
    color: "#000000",
    fontWeight: "500",
    fontSize: 12,
  },
  confirmModal: {
    borderRadius: 12,
    padding: 20,
    maxWidth: "90%",
    width: 280,
  },
  confirmTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
  confirmButtons: {
    flexDirection: "row",
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmCancel: {
    backgroundColor: "#F5F5F5",
  },
  confirmLeave: {
    backgroundColor: "#FF3B30",
  },
  confirmComplete: {
    backgroundColor: "#4ADE80",
  },
  confirmCancelText: {
    color: "#000000",
    fontWeight: "500",
    fontSize: 12,
  },
  confirmLeaveText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  confirmCompleteText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
