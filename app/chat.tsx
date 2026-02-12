import { api } from "@/api/client";
import { CampusGroup } from "@/components/chatComponents/CampusGroup";
import { CampusRequest } from "@/components/chatComponents/CampusRequest";
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
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import Hyperlink from "react-native-hyperlink";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Chat = () => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
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
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsSubmitting, setDetailsSubmitting] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [requestDetails, setRequestDetails] = useState<{
    id: string;
    group?: { id: string } | null;
    currState?: "pending" | "rejected" | "accepted";
  } | null | undefined>(undefined);

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

  type MatchState = "accepted" | "declined" | { status: "accepted" | "declined"; groupId?: string };
  const [matchActionStates, setMatchActionStates] = useState<Record<string, MatchState>>({});
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
      } catch { }
    })();
  }, []);

  const persistMatchStates = async (states: Record<string, MatchState>) => {
    try {
      await SecureStore.setItemAsync(MATCH_STATE_KEY, JSON.stringify(states));
    } catch { }
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
      marginTop: insets.top + 10,
      marginBottom: insets.bottom + 10,
      marginHorizontal: 16,
      borderRadius: 20,
      overflow: "hidden" as "hidden",
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
    action: "private" | "public" | "decline" | "add"
  ) => {
    const result = await processMatchAction(matchId, action);

    if (result.status === "ok") {
      const status = action === "decline" ? "declined" : "accepted";

      setMatchActionStates((prev) => {
        const newState: MatchState =
          status === "accepted" && result.groupId
            ? { status: "accepted", groupId: result.groupId }
            : status;

        const updated = { ...prev, [matchId]: newState };
        void persistMatchStates(updated);
        return updated;
      });

      if (action !== "decline" && result.groupId) {
        console.log("🔄 Replacing modal with group chat:", result.groupId);
        router.replace(`/group-chat/${result.groupId}`);
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

  const fetchRequestDetails = async (id: string) => {
    try {
      setDetailsLoading(true);
      const response = await api.get(UrlConstants.fetchRequestDetails(id));
      setRequestDetails(response.data?.data ?? null);
    } catch {
      setRequestDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const submitRequest = async () => {
    if (!selectedRequestId) return;
    if (requestDetails === undefined) return;
    try {
      setDetailsSubmitting(true);
      await api.post(UrlConstants.submitRequest, { requestID: selectedRequestId });
      await fetchRequestDetails(selectedRequestId);
    } catch {
    } finally {
      setDetailsSubmitting(false);
    }
  };

  const renderMatchButtons = (matchId: string) => {
    const rawState = matchActionStates[matchId];
    // Normalize state to object or string
    const status = typeof rawState === 'string' ? rawState : rawState?.status;
    const groupId = typeof rawState === 'object' ? rawState?.groupId : undefined;

    if (status === "accepted") {
      if (groupId) {
        return (
          <View style={styles.matchButtonsContainer}>
            <Pressable
              style={[
                styles.matchButton,
                dynamicStyles.matchButton,
                { backgroundColor: "#10B981", width: '100%' },
              ]}
              onPress={() => {
                console.log("🔄 Open Chat clicked, replacing route...");
                router.replace(`/group-chat/${groupId}`);
              }}
            >
              <Text style={[styles.matchButtonText, { color: "#FFFFFF" }]}>
                Open Chat
              </Text>
            </Pressable>
          </View>
        );
      }
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
    if (status === "declined") {
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
    // Legacy parsing
    const matchButtonPattern = /<MatchButton[^>]*id="([^"]*)"[^>]*\/>/;
    const match = content.match(matchButtonPattern);
    const userProfileTag = content.match(/<UserProfile[^>]*\/>/);
    const requestDetailsTag = content.match(/<RequestDetails[^>]*\/>/);

    // New parsing for CampusRequest and CampusGroup
    const campusRequestMatch = content.match(/<CampusRequest[^>]*\/>/);
    const campusGroupMatch = content.match(/<CampusGroup[^>]*\/>/);

    const extractAttributes = (tagString: string) => {
      const attrs: any = {};
      const regex = /(\w+)="([^"]*)"/g;
      let m;
      while ((m = regex.exec(tagString)) !== null) {
        attrs[m[1]] = m[2];
      }
      return attrs;
    };

    if (campusRequestMatch) {
      const attrs = extractAttributes(campusRequestMatch[0]);
      const index = campusRequestMatch.index ?? 0;
      const textBefore = content.substring(0, index).trim();
      const textAfter = content.substring(index + campusRequestMatch[0].length).trim();

      return {
        type: 'CampusRequest',
        props: attrs,
        textBefore,
        textAfter,
        textContent: textBefore + " " + textAfter // Fallback
      };
    }

    if (campusGroupMatch) {
      const attrs = extractAttributes(campusGroupMatch[0]);
      const index = campusGroupMatch.index ?? 0;
      const textBefore = content.substring(0, index).trim();
      const textAfter = content.substring(index + campusGroupMatch[0].length).trim();

      return {
        type: 'CampusGroup',
        props: attrs,
        textBefore,
        textAfter,
        textContent: textBefore + " " + textAfter // Fallback
      };
    }

    // Fallback to existing logic for legacy support
    const extractAttr = (src: string | null, name: string) => {
      if (!src) return undefined;
      const m = src.match(new RegExp(`${name}="([^"]*)"`, "i"));
      return m ? m[1] : undefined;
    };

    const fname = extractAttr(userProfileTag ? userProfileTag[0] : null, "fname");
    const campusName = extractAttr(userProfileTag ? userProfileTag[0] : null, "campusName");
    const description = extractAttr(requestDetailsTag ? requestDetailsTag[0] : null, "description");
    const groupName = extractAttr(requestDetailsTag ? requestDetailsTag[0] : null, "groupName");
    const matchPercent = extractAttr(requestDetailsTag ? requestDetailsTag[0] : null, "matchPercent");
    const buttonText = extractAttr(requestDetailsTag ? requestDetailsTag[0] : null, "buttonText");

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
        groupName,
        matchPercent,
        buttonText: buttonText || "View Details",
        hasInterestBlock: !!(fname || campusName || description) && !groupName,
        fname,
        campusName,
        description: normalizedDesc,
      };
    }
    return {
      hasMatchButtons: false,
      textContent: descriptiveText,
      hasInterestBlock: !!(fname || campusName || description) && !groupName,
      fname,
      campusName,
      description: normalizedDesc,
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
          {msg.messageType === "markdown" && !isUser ? (
            <View>
              {!!messageData.textBefore && (
                <Hyperlink linkDefault>
                  <Text style={[styles.messageText, dynamicStyles.text, { marginBottom: 4 }]}>
                    {messageData.textBefore}
                  </Text>
                </Hyperlink>
              )}

              {messageData.type === 'CampusRequest' && (
                <CampusRequest
                  id={messageData.props.id}
                  score={messageData.props.score}
                  title={messageData.props.title}
                  description={messageData.props.description}
                  startTime={messageData.props.startTime}
                  userFname={messageData.props.userFname}
                  userID={messageData.props.userID}
                />
              )}
              {messageData.type === 'CampusGroup' && (
                <CampusGroup
                  id={messageData.props.id}
                  score={messageData.props.score}
                  title={messageData.props.title}
                  description={messageData.props.description}
                  userFname={messageData.props.userFname}
                  userID={messageData.props.userID}
                />
              )}

              {!!messageData.textAfter && (
                <Hyperlink linkDefault>
                  <Text style={[styles.messageText, dynamicStyles.text, { marginTop: 4 }]}>
                    {messageData.textAfter}
                  </Text>
                </Hyperlink>
              )}

              {!messageData.type &&
                // Don't render text here if we are rendering it inside the Match Proposal Card
                !(messageData.hasMatchButtons && messageData.matchId && !messageData.groupName) && (
                  <Hyperlink linkDefault>
                    <Text style={[styles.messageText, dynamicStyles.text]}>
                      {messageData.textContent}
                    </Text>
                  </Hyperlink>
                )}
            </View>
          ) : (
            <Text
              style={[
                styles.messageText,
                isUser ? dynamicStyles.userMessageText : dynamicStyles.text,
              ]}
            >
              {messageData.textContent}
            </Text>
          )}

          {!isUser &&
            !messageData.type &&
            messageData.hasMatchButtons &&
            messageData.matchId &&
            !messageData.groupName && (
              <View style={[styles.requestCard, dynamicStyles.aiMessageContainer]}>
                <Text style={[styles.messageText, dynamicStyles.text, { marginBottom: 8 }]}>
                  {messageData.textContent}
                </Text>
                {renderMatchButtons(messageData.matchId)}
              </View>
            )}

          {!isUser &&
            !messageData.type && // Only show legacy if new type is not present
            messageData.hasMatchButtons &&
            messageData.matchId &&
            messageData.groupName && (
              <View style={[styles.requestCard, dynamicStyles.aiMessageContainer]}>
                <View style={styles.requestCardHeader}>
                  <Text style={[styles.requestCardTitle, dynamicStyles.text]}>
                    {messageData.groupName}
                  </Text>
                  {!!messageData.matchPercent && (
                    <View style={styles.matchPercentBadge}>
                      <Text style={styles.matchPercentText}>
                        {String(messageData.matchPercent).replace('%', '')}% Match
                      </Text>
                    </View>
                  )}
                </View>
                <Pressable
                  style={styles.requestCardButton}
                  onPress={() => {
                    setSelectedRequestId(messageData.matchId!);
                    setShowDetailsModal(true);
                    void fetchRequestDetails(messageData.matchId!);
                  }}
                >
                  <Text style={styles.requestCardButtonText}>
                    {messageData.buttonText}
                  </Text>
                </Pressable>
              </View>
            )}
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

  useEffect(() => {
    const keyboardListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    return () => {
      keyboardListener.remove();
    };
  }, []);

  return (
    <KeyboardAvoidingView
      style={[styles.container, dynamicStyles.container]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? -10 : 0}
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
      <Modal visible={showDetailsModal} transparent animationType="fade" onRequestClose={() => setShowDetailsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.detailsModalCard, dynamicStyles.container]}>
            {detailsLoading ? (
              <View style={styles.modalSection}>
                <ActivityIndicator size="small" color={dynamicStyles.text.color} />
                <Text style={[styles.loadingText, dynamicStyles.subtitle]}>Loading...</Text>
              </View>
            ) : requestDetails === null ? (
              <Pressable
                style={[styles.primaryActionButton, { backgroundColor: "#10B981" }]}
                onPress={submitRequest}
                disabled={detailsSubmitting}
              >
                <Text style={styles.primaryActionText}>
                  {detailsSubmitting ? "Submitting..." : "Match Request"}
                </Text>
              </Pressable>
            ) : requestDetails?.currState === "pending" ? (
              <View style={[styles.secondaryActionButton, { borderColor: "#F59E0B" }]}>
                <Text style={[styles.secondaryActionText, { color: "#F59E0B" }]}>
                  Awaiting Approval
                </Text>
              </View>
            ) : requestDetails?.currState === "rejected" ? (
              <View style={[styles.secondaryActionButton, { borderColor: "#EF4444" }]}>
                <Text style={[styles.secondaryActionText, { color: "#EF4444" }]}>
                  Declined
                </Text>
              </View>
            ) : (
              <Pressable
                style={[styles.primaryActionButton, { backgroundColor: "#10B981" }]}
                onPress={() => {
                  setShowDetailsModal(false);
                  if (requestDetails?.group?.id) {
                    router.replace(`/group-chat/${requestDetails.group.id}`);
                  }
                }}
              >
                <Text style={styles.primaryActionText}>Open Chat</Text>
              </Pressable>
            )}
            <Pressable style={styles.modalCloseButton} onPress={() => setShowDetailsModal(false)}>
              <Ionicons name="close" size={20} color={dynamicStyles.text.color} />
            </Pressable>
          </View>
        </View>
      </Modal>
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
  interestCard: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  interestTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  interestSubtitle: {
    fontSize: 12,
  },
  interestPill: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
  },
  interestPillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  interestQuestion: {
    fontSize: 12,
    marginTop: 4,
  },
  requestCard: {
    marginTop: 12,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  requestCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  requestCardTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  matchPercentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
  },
  matchPercentText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  requestCardButton: {
    backgroundColor: "#10B981",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  requestCardButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  detailsModalCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  modalSection: {
    gap: 10,
    alignItems: "center",
  },
  primaryActionButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  secondaryActionButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalCloseButton: {
    position: "absolute",
    right: 8,
    top: 8,
    padding: 6,
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
