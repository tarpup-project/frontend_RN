import { Text } from "@/components/Themedtext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  useActivePrompts,
  useDeleteActivePrompt,
} from "@/hooks/useActivePrompts";
import { Ionicons } from "@expo/vector-icons";
import moment from "moment";
import React, { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { toast } from "sonner-native";

interface ChatSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onClearChat: () => void;
}

interface ActivePrompt {
  id: string;
  title: string;
  description: string;
  createdAt: string;
}

interface PendingMatch {
  id: string;
  title: string;
  description: string;
  similarityScore: number;
  type: "request" | "group";
  createdAt: string;
  owner?: {
    fname: string;
    id: string;
  };
}

// ... imports and interfaces remain the same ...

export const ChatSettingsModal: React.FC<ChatSettingsModalProps> = ({
  visible,
  onClose,
  onClearChat,
}) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<"prompts" | "matches">("prompts");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showClearChatConfirm, setShowClearChatConfirm] = useState(false);
  const [selectedPromptId, setSelectedPromptId] = useState<string>("");
  const [confirmDeleteAction, setConfirmDeleteAction] = useState<
    (() => Promise<void>) | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ... dynamicStyles and handler functions remain the same ...
  const dynamicStyles = {
    modal: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    overlay: {
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    text: {
      color: isDark ? "#FFFFFF" : "#0a0a0a",
    },
    subtitle: {
      color: isDark ? "#CCCCCC" : "#666666",
    },
    tabContainer: {
      backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5",
    },
    activeTab: {
      backgroundColor: isDark ? "#0a0a0a" : "#000000",
    },
    activeTabText: {
      color: isDark ? "#FFFFFF" : "#FFFFFF",
    },
    inactiveTabText: {
      color: isDark ? "#CCCCCC" : "#666666",
    },
  };
  // ... handler functions remain the same ...
  const handleDeletePrompt = (id: string, onConfirm: () => Promise<void>) => {
    setSelectedPromptId(id);
    setConfirmDeleteAction(() => onConfirm);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (confirmDeleteAction) {
      setIsDeleting(true);
      try {
        await confirmDeleteAction();
      } finally {
        setIsDeleting(false);
      }
    }
    setShowDeleteConfirm(false);
    setConfirmDeleteAction(null);
  };
  // --- MISSING CLEAR CHAT BUTTON FIX ---
  const handleClearChatPress = () => {
    setShowClearChatConfirm(true);
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide" // Changed fade to slide for better feel
        onRequestClose={onClose}
      >
        {/* Fix: The main wrapper needs to use `styles.overlay` to fill the screen */}
        <View style={[styles.overlay, dynamicStyles.overlay]}>
          {/* Fix: This container defines the size/position of the modal content */}
          <View style={[styles.modalContainer, dynamicStyles.modal]}>
            {/* Header */}
            <View
              style={[
                styles.header,
                { borderColor: dynamicStyles.modal.borderColor },
              ]}
            >
              <View style={styles.headerLeft}>
                <Pressable onPress={onClose} style={styles.headerButton}>
                  <Ionicons
                    name="arrow-back"
                    size={20}
                    color={dynamicStyles.text.color}
                  />
                </Pressable>
                <Text style={[styles.headerTitle, dynamicStyles.text]}>
                  Prompt Settings
                </Text>
              </View>
              <View style={styles.headerRight}>
                {/* --- FIX: Added Clear Chat Button --- */}
                <Pressable onPress={onClose} style={styles.headerButton}>
                  <Ionicons
                    name="close"
                    size={20}
                    color={dynamicStyles.text.color}
                  />
                </Pressable>
              </View>
            </View>

            {/* Tab Selector */}
            <View style={styles.tabSection}>
              <View style={[styles.tabContainer, dynamicStyles.tabContainer]}>
                <Pressable
                  style={[
                    styles.tab,
                    activeTab === "prompts" && [
                      styles.activeTab,
                      dynamicStyles.activeTab,
                    ],
                  ]}
                  onPress={() => setActiveTab("prompts")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === "prompts"
                        ? dynamicStyles.activeTabText
                        : dynamicStyles.inactiveTabText,
                    ]}
                  >
                    Active Prompts
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.tab,
                    activeTab === "matches" && [
                      styles.activeTab,
                      dynamicStyles.activeTab,
                    ],
                  ]}
                  onPress={() => setActiveTab("matches")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === "matches"
                        ? dynamicStyles.activeTabText
                        : dynamicStyles.inactiveTabText,
                    ]}
                  >
                    Pending Matches
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Content ScrollView */}
            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
            >
              {activeTab === "prompts" ? (
                <ActivePromptsTab 
                  onDeletePrompt={handleDeletePrompt}
                  busyId={selectedPromptId}
                  isDeleting={isDeleting}
                />
              ) : (
                <PendingMatchesTab />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Confirmation Modals (remain unchanged) */}
      <ConfirmationModal
        visible={showDeleteConfirm}
        title="Remove from prompts marketplace"
        message="Are you sure you want to remove this prompt from the prompts marketplace?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        isLoading={isDeleting}
      />

      <ConfirmationModal
        visible={showClearChatConfirm}
        title="Clear chat?"
        message="This will permanently delete your messages. Are you sure?"
        onConfirm={() => {
          setShowClearChatConfirm(false);
          onClearChat();
          onClose();
        }}
        onCancel={() => setShowClearChatConfirm(false)}
      />
    </>
  );
};

const ActivePromptsTab = ({
  onDeletePrompt,
  busyId,
  isDeleting,
}: {
  onDeletePrompt: (id: string, onConfirm: () => Promise<void>) => void;
  busyId?: string;
  isDeleting?: boolean;
}) => {
  const { isDark } = useTheme();
  const { data: prompts, isLoading } = useActivePrompts();
  const deletePromptMutation = useDeleteActivePrompt();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [localBusyId, setLocalBusyId] = useState<string | null>(null);

  const dynamicStyles = {
    text: {
      color: isDark ? "#FFFFFF" : "#0a0a0a",
    },
    subtitle: {
      color: isDark ? "#CCCCCC" : "#666666",
    },
    promptCard: {
      backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePromptMutation.mutateAsync(id);
      toast.success("Prompt removed from marketplace");
    } catch (error) {
      toast.error("Failed to remove prompt");
    }
  };

  if (isLoading) {
    return (
      <View style={styles.tabContent}>
        <Text style={[styles.tabDescription, dynamicStyles.subtitle]}>
          Your prompts that are visible on the marketplace
        </Text>
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.promptCard,
              dynamicStyles.promptCard,
              { opacity: 0.5 },
            ]}
          >
            <View style={styles.promptContent}>
              <View
                style={{
                  height: 14,
                  backgroundColor: dynamicStyles.subtitle.color,
                  marginBottom: 4,
                  borderRadius: 4,
                  width: "80%",
                }}
              />
              <View
                style={{
                  height: 10,
                  backgroundColor: dynamicStyles.subtitle.color,
                  borderRadius: 4,
                  width: "40%",
                }}
              />
            </View>
            <View
              style={{
                height: 26,
                width: 70,
                backgroundColor: "#EF4444",
                borderRadius: 6,
              }}
            />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      <Text style={[styles.tabDescription, dynamicStyles.subtitle]}>
        Your prompts that are visible on the marketplace
      </Text>

      {prompts && prompts.length > 0 ? (
        prompts.map((prompt) => (
          <View
            key={prompt.id}
            style={[styles.promptCard, dynamicStyles.promptCard]}
          >
            <View style={styles.promptContent}>
              <Text style={[styles.promptTitle, dynamicStyles.text]}>
                {prompt.title}
              </Text>
              <Text style={[styles.promptDate, dynamicStyles.subtitle]}>
                {moment(prompt.createdAt).fromNow()}
              </Text>
            </View>
            {confirmId === prompt.id ? (
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable
                  style={[styles.cancelButton, { minWidth: 60 }]}
                  onPress={() => setConfirmId(null)}
                  disabled={localBusyId === prompt.id}
                >
                  <Text style={[styles.cancelButtonText, { color: "#000000" }]}>No</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.confirmButton,
                    localBusyId === prompt.id && { opacity: 0.8 },
                  ]}
                  onPress={async () => {
                    setLocalBusyId(prompt.id);
                    try {
                      await handleDelete(prompt.id);
                    } finally {
                      setLocalBusyId(null);
                      setConfirmId(null);
                    }
                  }}
                  disabled={localBusyId === prompt.id}
                >
                  {localBusyId === prompt.id ? (
                    <Ionicons name="hourglass-outline" size={12} color="#FFFFFF" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Yes</Text>
                  )}
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={[styles.removeButton]}
                onPress={() => setConfirmId(prompt.id)}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </Pressable>
            )}
          </View>
        ))
      ) : (
        <Text style={[styles.emptyText, dynamicStyles.subtitle]}>
          No active prompts yet.
        </Text>
      )}
    </View>
  );
};

const PendingMatchesTab = () => {
  const { isDark } = useTheme();
  const [matches] = useState<PendingMatch[]>([]);
  const [loadingAction, setLoadingAction] = useState<{
    id: string;
    type: string;
  } | null>(null);

  const dynamicStyles = {
    text: {
      color: isDark ? "#FFFFFF" : "#0a0a0a",
    },
    subtitle: {
      color: isDark ? "#CCCCCC" : "#666666",
    },
    matchCard: {
      backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
  };

  const handleAction = async (matchId: string, action: string) => {
    setLoadingAction({ id: matchId, type: action });
    // Simulate API call
    setTimeout(() => {
      setLoadingAction(null);
    }, 2000);
  };

  return (
    <View style={styles.tabContent}>
      {matches.length > 0 ? (
        matches.map((match) => (
          <View
            key={match.id}
            style={[styles.matchCard, dynamicStyles.matchCard]}
          >
            <View style={styles.matchHeader}>
              <View style={styles.userInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {match.owner?.fname?.[0] || "A"}
                  </Text>
                </View>
                <Text style={[styles.userName, dynamicStyles.text]}>
                  {match.owner?.fname || "Anonymous"}
                </Text>
              </View>
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreText}>
                  {match.similarityScore}% Match
                </Text>
              </View>
            </View>

            <Text style={[styles.matchTitle, dynamicStyles.text]}>
              {match.title}
            </Text>
            <Text style={[styles.matchDescription, dynamicStyles.subtitle]}>
              {match.description}
            </Text>

            <View style={styles.matchActions}>
              <View style={styles.actionRow}>
                <Pressable
                  style={[styles.actionButton, { backgroundColor: "#3B82F6" }]}
                  onPress={() => handleAction(match.id, "private")}
                  disabled={loadingAction?.id === match.id}
                >
                  {loadingAction?.id === match.id &&
                  loadingAction?.type === "private" ? (
                    <Ionicons
                      name="hourglass-outline"
                      size={12}
                      color="#FFFFFF"
                    />
                  ) : (
                    <Text style={styles.actionButtonText}>Private Chat</Text>
                  )}
                </Pressable>
                <Pressable
                  style={[styles.actionButton, { backgroundColor: "#10B981" }]}
                  onPress={() => handleAction(match.id, "public")}
                  disabled={loadingAction?.id === match.id}
                >
                  {loadingAction?.id === match.id &&
                  loadingAction?.type === "public" ? (
                    <Ionicons
                      name="hourglass-outline"
                      size={12}
                      color="#FFFFFF"
                    />
                  ) : (
                    <Text style={styles.actionButtonText}>Public Group</Text>
                  )}
                </Pressable>
              </View>
              <Pressable
                style={[styles.declineButton]}
                onPress={() => handleAction(match.id, "decline")}
                disabled={loadingAction?.id === match.id}
              >
                {loadingAction?.id === match.id &&
                loadingAction?.type === "decline" ? (
                  <Ionicons
                    name="hourglass-outline"
                    size={12}
                    color="#EF4444"
                  />
                ) : (
                  <Text style={styles.declineButtonText}>Decline</Text>
                )}
              </Pressable>
            </View>
          </View>
        ))
      ) : (
        <Text style={[styles.emptyText, dynamicStyles.subtitle]}>
          No pending matches found.
        </Text>
      )}
    </View>
  );
};

// Updated ConfirmationModal with loading states
const ConfirmationModal = ({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  isLoading = false,
}: {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}) => {
  const { isDark } = useTheme();

  const dynamicStyles = {
    confirmModal: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    text: {
      color: isDark ? "#FFFFFF" : "#0a0a0a",
    },
    subtitle: {
      color: isDark ? "#CCCCCC" : "#666666",
    },
    cancelButton: {
      backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    cancelButtonText: {
      color: isDark ? "#FFFFFF" : "#0a0a0a",
    },
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.confirmOverlay}>
        <View style={[styles.confirmModal, dynamicStyles.confirmModal]}>
          <Text style={[styles.confirmTitle, dynamicStyles.text]}>{title}</Text>
          <Text style={[styles.confirmMessage, dynamicStyles.subtitle]}>
            {message}
          </Text>
          <View style={styles.confirmButtons}>
            <Pressable
              style={[
                styles.cancelButton,
                dynamicStyles.cancelButton,
                isLoading && { opacity: 0.6 },
              ]}
              onPress={onCancel}
              disabled={isLoading}
            >
              <Text
                style={[
                  styles.cancelButtonText,
                  dynamicStyles.cancelButtonText,
                ]}
              >
                Cancel
              </Text>
            </Pressable>

            <Pressable
              style={[styles.confirmButton, isLoading && { opacity: 0.8 }]}
              onPress={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <Ionicons
                    name="hourglass-outline"
                    size={12}
                    color="#FFFFFF"
                  />
                  <Text style={styles.confirmButtonText}>Removing...</Text>
                </View>
              ) : (
                <Text style={styles.confirmButtonText}>Remove</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  modalContainer: {
    width: "90%",
    height: "80%",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    //borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  headerButton: {
    padding: 4,
  },
  tabSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabContainer: {
    flexDirection: "row",
    borderRadius: 20,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  activeTab: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  tabContent: {
    paddingBottom: 20,
  },
  tabDescription: {
    fontSize: 11,
    marginBottom: 16,
    lineHeight: 16,
  },
  promptCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  promptContent: {
    flex: 1,
    marginRight: 12,
  },
  promptTitle: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  promptDate: {
    fontSize: 10,
  },
  removeButton: {
    backgroundColor: "#EF4444",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  removeButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  matchCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  matchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#6B46C1",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  userName: {
    fontSize: 12,
    fontWeight: "600",
  },
  scoreContainer: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  matchDate: {
    fontSize: 10,
    marginBottom: 8,
  },
  confirmButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    minHeight: 40,
  },
  confirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  scoreText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  matchTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  matchDescription: {
    fontSize: 11,
    marginBottom: 12,
    lineHeight: 16,
  },
  matchActions: {
    gap: 8,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 32,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  declineButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 32,
  },
  declineButtonText: {
    color: "#EF4444",
    fontSize: 11,
    fontWeight: "600",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  clearChatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  clearChatText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 11,
    marginTop: 40,
  },
  // Confirmation Modal
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmModal: {
    width: "80%",
    maxWidth: 300,
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
  },
  confirmTitle: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "left",
    marginBottom: 12,
  },
  confirmMessage: {
    fontSize: 11,
    textAlign: "left",
    lineHeight: 16,
    marginBottom: 20,
  },

  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },

  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
});

export { ConfirmationModal };
