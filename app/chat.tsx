import { api } from "@/api/client";
import {
  ChatSettingsModal,
  ConfirmationModal,
} from "@/components/chatComponents/chatSettingsModal";
import { ImageUploadModal } from "@/components/ImageUploadModal";
import { Skeleton } from "@/components/Skeleton";
import { Text } from "@/components/Themedtext";
import { UrlConstants } from "@/constants/apiUrls";
import { useTheme } from "@/contexts/ThemeContext";
import { useEnhancedPersonalChat } from "@/hooks/useEnhancedPersonalChat";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useMatchActions } from "@/hooks/useMatchActions";
import { useAuthStore } from "@/state/authStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

const Chat = () => {
  const { isDark } = useTheme();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);
  const { user } = useAuthStore();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showClearChatConfirm, setShowClearChatConfirm] = useState(false);
  const { selectAndProcessImage, isLoading: isImageLoading } = useImageUpload();
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);
  const [selectedImageData, setSelectedImageData] = useState<{
    uri: string;
    width: number;
    height: number;
    size?: number;
  } | null>(null);
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const {
    messages,
    isLoading,
    isTyping,
    sendMessage,
    markAsRead,
    clearMessages,
    isCached,
    isRefreshing,
  } = useEnhancedPersonalChat();

  const { handleMatchAction: processMatchAction, isLoading: isMatchLoading } =
    useMatchActions();

  const [matchActionStates, setMatchActionStates] = useState<Record<string, "accepted" | "declined">>({});
  const MATCH_STATE_KEY = "tarpai_match_actions";

  useEffect(() => {
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync(MATCH_STATE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === "object") {
            setMatchActionStates(parsed);
          }
        }
      } catch {}
    })();
  }, []);

  const persistMatchStates = async (states: Record<string, "accepted" | "declined">) => {
    try {
      await SecureStore.setItemAsync(MATCH_STATE_KEY, JSON.stringify(states));
    } catch {}
  };
  const quickStartOptions = [
    { icon: "car-outline", text: "I need a ride to downtown" },
    { icon: "home-outline", text: "Looking for a roommate" },
    { icon: "people-outline", text: "Want to join a Study group" },
    { icon: "book-outline", text: "Need to Sell My textbooks" },
  ];

  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
    },
    header: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
      borderBottomColor: isDark ? "#333333" : "#E0E0E0",
    },
    text: {
      color: isDark ? "#FFFFFF" : "#0a0a0a",
    },
    subtitle: {
      color: isDark ? "#CCCCCC" : "#666666",
    },
    quickStartButton: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    userMessage: {
      backgroundColor: isDark ? "#262626" : "#262626",
    },
    userMessageText: {
      color: isDark ? "#FFFFFF" : "#FFFFFF",
    },
    aiMessageContainer: {
      backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5",
    },
    matchButton: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    input: {
      backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5",
      borderColor: isDark ? "#333333" : "#E0E0E0",
      color: isDark ? "#FFFFFF" : "#0a0a0a",
    },
    sendButton: {
      backgroundColor: isDark ? "#FFFFFF" : "#0a0a0a",
    },
    sendIcon: {
      color: isDark ? "#0a0a0a" : "#FFFFFF",
    },
  };

  const MessageSkeleton = ({ isUser }: { isUser: boolean }) => (
    <View
      style={[styles.messageContainer, isUser && styles.userMessageContainer]}
    >
      {!isUser && (
        <View style={styles.avatarContainer}>
          <Skeleton width={32} height={32} borderRadius={16} />
        </View>
      )}
      <View style={[styles.messageBubble, { padding: 12 }]}>
        <Skeleton
          width={Math.random() * 120 + 80}
          height={14}
          style={{ marginBottom: 4 }}
        />
        <Skeleton
          width={Math.random() * 100 + 60}
          height={14}
          style={{ marginBottom: 4 }}
        />
        <Skeleton width={40} height={10} />
      </View>
      {isUser && (
        <View style={styles.avatarContainer}>
          <Skeleton width={32} height={32} borderRadius={16} />
        </View>
      )}
    </View>
  );

  const QuickStartSkeleton = () => (
    <View style={styles.quickStartSection}>
      <Skeleton width={80} height={16} style={{ marginBottom: 8 }} />
      <View style={styles.quickStartGrid}>
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <View
              key={i}
              style={[
                styles.quickStartButton,
                { borderWidth: 1, borderColor: "#333" },
              ]}
            >
              <Skeleton width={14} height={14} borderRadius={7} />
              <Skeleton
                width={Math.random() * 60 + 80}
                height={12}
                style={{ flex: 1, marginLeft: 6 }}
              />
            </View>
          ))}
      </View>

      <View style={styles.initialAiMessageSection}>
        <Skeleton width={32} height={32} borderRadius={16} />
        <View style={[styles.initialAiMessage, { padding: 12 }]}>
          <Skeleton width="100%" height={14} style={{ marginBottom: 4 }} />
          <Skeleton width="90%" height={14} style={{ marginBottom: 4 }} />
          <Skeleton width="70%" height={14} />
        </View>
      </View>
    </View>
  );

  const handleClose = () => {
    markAsRead();
    router.back();
  };

  const handleQuickStartPress = (text: string) => {
    sendMessage(text);
  };

  const handleSend = () => {
    if (message.trim()) {
      sendMessage(message.trim());
      setMessage("");
    }
  };

  const onMatchAction = async (
    matchId: string,
    action: "private" | "public" | "decline"
  ) => {
    const status = action === "decline" ? "declined" : "accepted";
    setMatchActionStates((prev) => {
      const updated: Record<string, "accepted" | "declined"> = { ...prev, [matchId]: status };
      void persistMatchStates(updated);
      return updated;
    });
    const result = await processMatchAction(matchId, action);

    if (result.status === "ok") {
      if (action !== "decline" && result.groupId) {
        router.push(`/group-chat/${result.groupId}`);
      }
    } else {
      Alert.alert("Error", result.message || "Failed to process action");
    }
  };

  const handleAddImage = async (messageId: string) => {
    setCurrentMessageId(messageId);
    const imageData = await selectAndProcessImage();
    if (imageData) {
      setSelectedImageData(imageData);
      setShowImageUploadModal(true);
    }
  };

  const handleImageUpload = async (imageUri: string) => {
    if (!currentMessageId) return;

    try {
      setUploadingImage(true);

      const fileExtension = imageUri.split(".").pop()?.toLowerCase();
      const mimeType = fileExtension === "png" ? "image/png" : "image/jpeg";
      const fileName = `image.${fileExtension}`;

      console.log("=== UPLOAD DEBUG ===");
      console.log("File extension:", fileExtension);
      console.log("MIME type:", mimeType);
      console.log("messageId:", currentMessageId);

      const formData = new FormData();
      formData.append("image", {
        uri: imageUri,
        type: mimeType,
        name: fileName,
      } as any);

      const response = await api.post(
        UrlConstants.uploadImageToMessage(currentMessageId),
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      Alert.alert("Success", "Image uploaded successfully!");
    } catch (error: any) {
      console.log("=== UPLOAD ERROR ===");
      console.log(
        "Response data:",
        JSON.stringify(error.response?.data, null, 2)
      );
      Alert.alert("Error", "Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
      setShowImageUploadModal(false);
      setSelectedImageData(null);
      setCurrentMessageId(null);
    }
  };

  const renderMatchButtons = (matchId: string) => {
    const state = matchActionStates[matchId];
    if (state === "accepted") {
      return (
        <View style={styles.matchButtonsContainer}>
          <View style={[styles.statusChip, { backgroundColor: "#10B981" }]}>
            <Text style={[styles.statusChipText, { color: "#FFFFFF" }]}>
              Accepted
            </Text>
          </View>
        </View>
      );
    }
    if (state === "declined") {
      return (
        <View style={styles.matchButtonsContainer}>
          <View style={[styles.statusChip, { backgroundColor: "#EF4444" }]}>
            <Text style={[styles.statusChipText, { color: "#FFFFFF" }]}>
              Declined
            </Text>
          </View>
        </View>
      );
    }
    return (
      <View style={styles.matchButtonsContainer}>
        <View style={styles.matchButtonRow}>
          <Pressable
            style={[
              styles.matchButton,
              dynamicStyles.matchButton,
              { backgroundColor: "#3B82F6" },
            ]}
            onPress={() => onMatchAction(matchId, "private")}
            disabled={isMatchLoading}
          >
            <Text style={[styles.matchButtonText, { color: "#FFFFFF" }]}>
              Private Chat
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.matchButton,
              dynamicStyles.matchButton,
              { backgroundColor: "#10B981" },
            ]}
            onPress={() => onMatchAction(matchId, "public")}
            disabled={isMatchLoading}
          >
            <Text style={[styles.matchButtonText, { color: "#FFFFFF" }]}>
              Create Group
            </Text>
          </Pressable>
        </View>
        <Pressable
          style={[
            styles.matchButton,
            dynamicStyles.matchButton,
            { borderColor: "#EF4444" },
          ]}
          onPress={() => onMatchAction(matchId, "decline")}
          disabled={isMatchLoading}
        >
          <Text style={[styles.matchButtonText, { color: "#EF4444" }]}>
            Decline
          </Text>
        </Pressable>
      </View>
    );
  };

  const parseMessageForActions = (content: string) => {
    const matchButtonPattern = /<MatchButton[^>]*id="([^"]*)"[^>]*\/>/;
    const match = content.match(matchButtonPattern);
    const userProfileTag = content.match(/<UserProfile[^>]*\/>/);
    const requestDetailsTag = content.match(/<RequestDetails[^>]*\/>/);

    const extractAttr = (src: string | null, name: string) => {
      if (!src) return undefined;
      const m = src.match(new RegExp(`${name}="([^"]*)"`, "i"));
      return m ? m[1] : undefined;
    };

    const fname = extractAttr(userProfileTag ? userProfileTag[0] : null, "fname");
    const campusName = extractAttr(userProfileTag ? userProfileTag[0] : null, "campusName");
    const description = extractAttr(requestDetailsTag ? requestDetailsTag[0] : null, "description");

    const normalizedDesc = (() => {
      if (!description) return "";
      let d = description;
      d = d.replace(/requesting connection with the group organizer/gi, "connecting with the group organizers");
      return d;
    })();

    const descriptiveText = (() => {
      if (fname || campusName || normalizedDesc) {
        const who = fname ? fname : "Someone";
        const from = campusName ? ` from ${campusName}` : "";
        const action = normalizedDesc ? `: ${normalizedDesc}` : "";
        return `${who}${from} is interested in your activity${action}`.trim();
      }
      const cleaned = content
        .replace(matchButtonPattern, "")
        .replace(/<[^>]+>/g, "")
        .trim();
      return cleaned;
    })();

    if (match) {
      const matchId = match[1];
      return {
        hasMatchButtons: true,
        matchId,
        textContent: descriptiveText,
      };
    }
    return {
      hasMatchButtons: false,
      textContent: descriptiveText,
    };
  };

  const renderMessage = (msg: any, index: number) => {
    const isUser = msg.sender === "user";
    const messageData = parseMessageForActions(msg.content);

    return (
      <View
        key={msg.id || index}
        style={[styles.messageContainer, isUser && styles.userMessageContainer]}
      >
        {!isUser && (
          <View style={styles.avatarContainer}>
            <View style={styles.aiAvatar}>
              <Image
                source={require("@/assets/images/tarpup-plain-dark.png")}
                style={{ width: 30, height: 30 }}
                resizeMode="contain"
              />
            </View>
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isUser
              ? [styles.userMessage, dynamicStyles.userMessage]
              : dynamicStyles.aiMessageContainer,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser ? dynamicStyles.userMessageText : dynamicStyles.text,
            ]}
          >
            {messageData.textContent}
          </Text>

          {messageData.hasMatchButtons &&
            messageData.matchId &&
            renderMatchButtons(messageData.matchId)}

          {/* Image display */}
          {msg.imageUrl && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: msg.imageUrl }}
                style={styles.messageImage}
                resizeMode="cover"
              />
            </View>
          )}

          {!isUser && msg.isRequest && !msg.imageUrl && (
            <Pressable
              style={[styles.addImageButton, dynamicStyles.quickStartButton]}
              onPress={() => handleAddImage(msg.id)}
              disabled={isImageLoading || uploadingImage}
            >
              {uploadingImage && currentMessageId === msg.id ? (
                <>
                  <ActivityIndicator
                    size="small"
                    color={dynamicStyles.text.color}
                  />
                  <Text style={[styles.addImageText, dynamicStyles.text]}>
                    Uploading...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name="image-outline"
                    size={16}
                    color={dynamicStyles.text.color}
                  />
                  <Text style={[styles.addImageText, dynamicStyles.text]}>
                    Add Image
                  </Text>
                </>
              )}
            </Pressable>
          )}
        </View>

        {isUser && (
          <View style={styles.avatarContainer}>
            <View style={styles.userAvatar}>
              <Ionicons
                name="person-outline"
                size={20}
                color={dynamicStyles.text.color}
              />
            </View>
          </View>
        )}
      </View>
    );
  };

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isTyping]);

  useEffect(() => {
    markAsRead();
  }, []);

  return (
    <KeyboardAvoidingView
      style={[styles.container, dynamicStyles.container]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      {/* Header */}
      <View style={[styles.header, dynamicStyles.header]}>
        {isLoading && !isCached ? (
          <>
            <Skeleton width={120} height={20} />
            <View style={styles.headerActions}>
              <Skeleton width={24} height={24} borderRadius={12} />
              <Skeleton width={24} height={24} borderRadius={12} />
              <Skeleton width={24} height={24} borderRadius={12} />
            </View>
          </>
        ) : (
          <>
            <View style={styles.headerTitleContainer}>
              <Text style={[styles.headerTitle, dynamicStyles.text]}>
                Chat with TarpAI
              </Text>
              {/* {isCached && isRefreshing && (
                <View style={styles.refreshIndicator}>
                  <ActivityIndicator size="small" color={dynamicStyles.subtitle.color} />
                  <Text style={[styles.refreshText, dynamicStyles.subtitle]}>
                    Syncing...
                  </Text>
                </View>
              )} */}
            </View>
            <View style={styles.headerActions}>
              <Pressable
                style={styles.settingsButton}
                onPress={() => setShowSettingsModal(true)}
                hitSlop={10}
              >
                <Ionicons name="settings-outline" size={20} color="#EF4444" />
              </Pressable>
              <Pressable
                style={styles.clearButton}
                onPress={() => setShowClearChatConfirm(true)}
                hitSlop={10}
              >
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color={dynamicStyles.text.color}
                />
              </Pressable>
              <Pressable
                style={styles.closeButton}
                onPress={handleClose}
                hitSlop={10}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={dynamicStyles.text.color}
                />
              </Pressable>
            </View>
          </>
        )}
      </View>

      {/* Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {isLoading && !isCached ? (
          <>
            <QuickStartSkeleton />
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <MessageSkeleton key={i} isUser={i % 3 === 0} />
              ))}
          </>
        ) : (
          <>
            {messages.length === 0 ||
            (messages.length === 1 && messages[0].id === "-1") ? (
              <View style={styles.quickStartSection}>
                <Text style={[styles.sectionTitle, dynamicStyles.text]}>
                  Quick Start
                </Text>
                <View style={styles.quickStartGrid}>
                  {quickStartOptions.map((option, index) => (
                    <Pressable
                      key={index}
                      style={[
                        styles.quickStartButton,
                        dynamicStyles.quickStartButton,
                      ]}
                      onPress={() => handleQuickStartPress(option.text)}
                    >
                      <Ionicons
                        name={option.icon as any}
                        size={14}
                        color={dynamicStyles.text.color}
                      />
                      <Text style={[styles.quickStartText, dynamicStyles.text]}>
                        {option.text}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.initialAiMessageSection}>
                  <View style={styles.avatarContainer}>
                    <View style={styles.aiAvatar}>
                      <Image
                        source={require("@/assets/images/tarpup-plain-dark.png")}
                        style={{ width: 16, height: 16 }}
                        resizeMode="contain"
                      />
                    </View>
                  </View>
                  <View
                    style={[
                      styles.initialAiMessage,
                      dynamicStyles.aiMessageContainer,
                    ]}
                  >
                    <Text style={[styles.aiMessageText, dynamicStyles.text]}>
                      Hi! I'm TarpAI, your smart campus connection assistant. I
                      help you find compatible students based on your needs.
                      What would you like help with today?
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <>
                {messages.map(renderMessage)}
                {isTyping && (
                  <View
                    style={[styles.messageContainer, styles.aiMessageContainer]}
                  >
                    <View style={styles.avatarContainer}>
                      <View style={styles.aiAvatar}>
                        <Image
                          source={require("@/assets/images/tarpup-plain-dark.png")}
                          style={{ width: 16, height: 16 }}
                          resizeMode="contain"
                        />
                      </View>
                    </View>
                    <View
                      style={[
                        styles.typingBubble,
                        dynamicStyles.aiMessageContainer,
                      ]}
                    >
                      <ActivityIndicator
                        size="small"
                        color={dynamicStyles.text.color}
                      />
                      <Text style={[styles.typingText, dynamicStyles.subtitle]}>
                        TarpAI is typing...
                      </Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.inputSection}>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, dynamicStyles.input]}
            placeholder="Tell TarpAI what you need..."
            placeholderTextColor={isDark ? "#666666" : "#999999"}
            value={message}
            onChangeText={setMessage}
            multiline
            blurOnSubmit={false}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            editable={!isLoading}
          />
          <Pressable
            style={[
              styles.sendButton,
              dynamicStyles.sendButton,
              (!message.trim() || isLoading) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!message.trim() || isLoading}
          >
            <Ionicons
              name="send"
              size={20}
              color={dynamicStyles.sendIcon.color}
            />
          </Pressable>
        </View>
      </View>

      {/* Your existing modals */}
      <ChatSettingsModal
        visible={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onClearChat={clearMessages}
      />

      <ConfirmationModal
        visible={showClearChatConfirm}
        title="Clear chat?"
        message="This will permanently delete your messages. Are you sure?"
        onConfirm={() => {
          setShowClearChatConfirm(false);
          clearMessages();
        }}
        onCancel={() => setShowClearChatConfirm(false)}
      />
      <ImageUploadModal
        visible={showImageUploadModal}
        imageData={selectedImageData}
        onClose={() => {
          setShowImageUploadModal(false);
          setSelectedImageData(null);
          setCurrentMessageId(null);
        }}
        onUpload={handleImageUpload}
        isUploading={uploadingImage}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  refreshText: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  settingsButton: {
    padding: 8,
  },
  clearButton: {
    padding: 8,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
  },
  quickStartSection: {
    marginBottom: 16,
  },
  addImageButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  addImageText: {
    fontSize: 12,
  },
  imageContainer: {
    marginTop: 8,
    borderRadius: 8,
    overflow: "hidden",
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  quickStartGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 16,
  },
  quickStartButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: "48%",
    flexBasis: "48%",
  },
  quickStartText: {
    fontSize: 11,
    flex: 1,
  },
  initialAiMessageSection: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  initialAiMessage: {
    padding: 12,
    borderRadius: 12,
    flex: 1,
  },
  aiMessageText: {
    fontSize: 12,
    lineHeight: 18,
  },
  messageContainer: {
    marginVertical: 8,
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-end",
  },
  aiMessageContainer: {
    justifyContent: "flex-start",
  },
  userMessageContainer: {
    alignSelf: "flex-end",
    flexDirection: "row",
  },
  avatarContainer: {
    alignSelf: "flex-end",
    marginBottom: 4,
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#6B46C1",
    justifyContent: "center",
    alignItems: "center",
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#6B46C1",
    justifyContent: "center",
    alignItems: "center",
  },
  messageBubble: {
    maxWidth: "70%",
    padding: 12,
    borderRadius: 12,
  },
  userMessage: {
    alignSelf: "flex-end",
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  matchButtonsContainer: {
    marginTop: 12,
    gap: 8,
  },
  matchButtonRow: {
    flexDirection: "row",
    gap: 8,
  },
  matchButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    flex: 1,
  },
  matchButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  typingText: {
    fontSize: 12,
    fontStyle: "italic",
  },
  inputSection: {
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 24 : 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 50,
    maxHeight: 100,
    borderRadius: 25,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    textAlignVertical: "center",
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default Chat;
