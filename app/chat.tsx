import { Text } from "@/components/Themedtext";
import { useTheme } from "@/contexts/ThemeContext";
import { Skeleton } from "@/components/Skeleton";
import { useMatchActions } from "@/hooks/useMatchActions";
import { usePersonalChat } from "@/hooks/usePersonalChat";
import { useAuthStore } from "@/state/authStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Bot, UserRound } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

  const {
    messages,
    isLoading,
    isTyping,
    sendMessage,
    markAsRead,
    clearMessages,
  } = usePersonalChat();

  const { handleMatchAction: processMatchAction, isLoading: isMatchLoading } =
    useMatchActions();

  const quickStartOptions = [
    { icon: "car-outline", text: "I need a ride to downtown" },
    { icon: "home-outline", text: "Looking for a roommate" },
    { icon: "people-outline", text: "Want to join a Study group" },
    { icon: "heart-outline", text: "Find a Date" },
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
      backgroundColor: isDark ? "#FFFFFF" : "#0a0a0a",
    },
    userMessageText: {
      color: isDark ? "#0a0a0a" : "#FFFFFF",
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

      {/* Initial AI Message Skeleton */}
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
    const result = await processMatchAction(matchId, action);

    if (result.status === "ok") {
      if (action !== "decline" && result.groupId) {
        router.push(`/group-chat/${result.groupId}`);
      }
    } else {
      Alert.alert("Error", result.message || "Failed to process action");
    }
  };

  const renderMatchButtons = (matchId: string) => (
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

  const parseMessageForActions = (content: string) => {
    const matchButtonPattern = /<MatchButton[^>]*id="([^"]*)"[^>]*\/>/;
    const match = content.match(matchButtonPattern);

    if (match) {
      const matchId = match[1];
      const textContent = content.replace(matchButtonPattern, "").trim();

      return {
        hasMatchButtons: true,
        matchId,
        textContent,
      };
    }

    return {
      hasMatchButtons: false,
      textContent: content,
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
        {/* AI Avatar - Left side */}
        {!isUser && (
          <View style={styles.avatarContainer}>
            <View style={styles.aiAvatar}>
              <Bot size={16} color="#FFFFFF" />
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
        </View>

        {/* User Avatar - Right side */}
        {isUser && (
          <View style={styles.avatarContainer}>
            <View style={styles.userAvatar}>
              <UserRound size={16} color="#FFFFFF" />
            </View>
          </View>
        )}
      </View>
    );
  };

  // Auto scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isTyping]);

  useEffect(() => {
    markAsRead();
  }, []);

  // Loading State with Skeleton
  if (isLoading) {
    return (
      <View style={[styles.container, dynamicStyles.container]}>
        {/* Header Skeleton */}
        <View style={[styles.header, dynamicStyles.header]}>
          <Skeleton width={120} height={20} />
          <View style={styles.headerActions}>
            <Skeleton width={24} height={24} borderRadius={12} />
            <Skeleton width={24} height={24} borderRadius={12} />
          </View>
        </View>

        {/* Content Skeleton */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          <QuickStartSkeleton />

          {/* Messages Skeleton */}
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <MessageSkeleton key={i} isUser={i % 3 === 0} />
            ))}
        </ScrollView>

        {/* Input Skeleton */}
        <View style={styles.inputSection}>
          <View style={styles.inputContainer}>
            <Skeleton height={50} borderRadius={25} style={{ flex: 1 }} />
            <Skeleton width={50} height={50} borderRadius={25} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, dynamicStyles.container]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      {/* Header */}
      <View style={[styles.header, dynamicStyles.header]}>
        <Text style={[styles.headerTitle, dynamicStyles.text]}>
          Chat with TarpAI
        </Text>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.clearButton}
            onPress={() => {
              Alert.alert(
                "Clear Chat",
                "This will delete all messages. Are you sure?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Clear",
                    style: "destructive",
                    onPress: clearMessages,
                  },
                ]
              );
            }}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </Pressable>
          <Pressable style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color={dynamicStyles.text.color} />
          </Pressable>
        </View>
      </View>

      {/* Messages ScrollView */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
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
                  <Ionicons
                    name="hardware-chip-outline"
                    size={16}
                    color="#FFFFFF"
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
                  Hi! I'm TarpAI, your smart campus connection assistant. I help
                  you find compatible students based on your needs. What would
                  you like help with today?
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
                    <Ionicons
                      name="hardware-chip-outline"
                      size={16}
                      color="#FFFFFF"
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
      </ScrollView>

      {/* Input Section */}
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
          />
          <Pressable
            style={[
              styles.sendButton,
              dynamicStyles.sendButton,
              !message.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!message.trim()}
          >
            <Ionicons
              name="send"
              size={20}
              color={dynamicStyles.sendIcon.color}
            />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

// Keep all your existing styles exactly the same
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
    fontSize: 18,
    fontWeight: "600",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  // AI messages: Left aligned
  aiMessageContainer: {
    justifyContent: "flex-start",
  },
  // User messages: Right aligned
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
    maxWidth: "80%",
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
    paddingBottom: Platform.OS === "ios" ? 24 : 2,
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
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default Chat;
