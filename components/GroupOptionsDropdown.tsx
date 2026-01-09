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

  // Check if user is admin when dropdown is shown or detailed data changes
  useEffect(() => {
    if (showDropdown) {
      // Use detailed data if available, otherwise fallback to prop data
      const data = detailedGroupData || groupDetails;
      
      if (data) {
        // Check if current user is admin
        let isAdmin = data.isAdmin || false;
        
        // Fallback: If isAdmin is false, check if user is the first member
        // (Backend convention: Creator/Admin is often the first member)
        if (!isAdmin && user?.id && data.members && Array.isArray(data.members) && data.members.length > 0) {
          const firstMember = data.members[0];
          // Handle case where member might be an ID string or an object with ID
          const firstMemberId = typeof firstMember === 'string' ? firstMember : firstMember.id;
          
          if (firstMemberId === user.id) {
            isAdmin = true;
          }
        }
        
        setIsUserAdmin(isAdmin);
      }
    }
  }, [showDropdown, detailedGroupData, groupDetails, user?.id]);

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

  const handleLeaveGroup = async () => {
    const success = await leaveGroup(groupDetails.id);
    setShowLeaveModal(false);
    if (success) {
      onLeaveSuccess();
    }
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

          {groupDetails.shareLink && (
            <Pressable style={styles.dropdownItem} onPress={handleShareGroup}>
              <Ionicons name="share-outline" size={16} color={dynamicStyles.text.color} />
              <Text style={[styles.dropdownText, dynamicStyles.text]}>
                Share Group
              </Text>
            </Pressable>
          )}

          {isUserAdmin && !detailedGroupData?.isComplete && (
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
                {isLeaving ? "Leaving..." : "Leave Group"}
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
              Are you sure you want to leave this group?
            </Text>

            <View style={styles.confirmButtons}>
              <Pressable
                style={[styles.confirmButton, styles.confirmLeave]}
                onPress={handleLeaveGroup}
                disabled={isLeaving}
              >
                <Text style={styles.confirmLeaveText}>
                  {isLeaving ? "Leaving..." : "Yes, Leave"}
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
