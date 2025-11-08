import {
  GroupSocketProvider,
  useGroupSocket,
} from "@/app/contexts/SocketProvider";
import { useTheme } from "@/app/contexts/ThemeContext";
import { Skeleton } from "@/components/Skeleton";
import { Text } from "@/components/Themedtext";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useGroupMessages, useMessageReply } from "@/hooks/useGroupMessages";
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedGestureHandler, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import { useGroupActions, useGroupDetails } from "@/hooks/useGroups";
import { useAuthStore } from "@/state/authStore";
import { MessageType, UserMessage } from "@/types/groups";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActionSheetIOS,
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
import Hyperlink from "react-native-hyperlink";

const GroupChat = () => {
  const { id } = useLocalSearchParams();

  if (!id) {
    return <ErrorScreen message="Group not found" />;
  }

  return (
    <GroupSocketProvider groupId={id as string}>
      <GroupChatContent groupId={id as string} />
    </GroupSocketProvider>
  );
};

const replyIconStyle = useAnimatedStyle(() => ({
  opacity: translateX.value > 20 ? 1 : 0,
  transform: [{ translateX: translateX.value - 60 }],
}));

const GroupChatContent = ({ groupId }: { groupId: string }) => {
  const { isDark } = useTheme();
  const router = useRouter();
  const { user } = useAuthStore();
  const { socket } = useGroupSocket();
  const scrollViewRef = useRef<ScrollView>(null);

  console.log("Socket and user status:", { socket: !!socket, user: !!user });

  const {
    data: groupDetails,
    isLoading: groupLoading,
    error: groupError,
  } = useGroupDetails(groupId);
  console.log("1. Group details hook result:", {
    groupDetails,
    groupLoading,
    groupError,
  });
  const { messages, isLoading, error, sendMessage, markAsRead } =
    useGroupMessages({ groupId, socket: socket && user ? socket : undefined });
  console.log("2. Group messages hook result:", { messages, isLoading, error });
  const { replyingTo, startReply, cancelReply } = useMessageReply();
  console.log("3. Message reply hook result:", { replyingTo });
  const { selectedFile, selectImage, selectImageFromCamera, removeFile } =
    useFileUpload();
  console.log("4. File upload hook result:", { selectedFile });
  const { joinGroup } = useGroupActions();
  console.log("5. Group actions hook result:", "loaded");

  const [message, setMessage] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
    },
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
    myMessage: {
      backgroundColor: isDark ? "#FFFFFF" : "#000000",
    },
    myMessageText: {
      color: isDark ? "#000000" : "#FFFFFF",
    },
    theirMessage: {
      backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5",
    },
    theirMessageText: {
      color: isDark ? "#FFFFFF" : "#000000",
    },
    input: {
      backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5",
      borderColor: isDark ? "#333333" : "#E0E0E0",
      color: isDark ? "#FFFFFF" : "#000000",
    },
    sendButton: {
      backgroundColor: isDark ? "#FFFFFF" : "#000000",
    },
    sendIcon: {
      color: isDark ? "#000000" : "#FFFFFF",
    },
    replyPreview: {
      backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
  };

  // Mark messages as read when entering
  useEffect(() => {
    markAsRead();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Transform real messages to match your UI format
  const transformedMessages = messages.map((msg, index) => {
    if (msg.messageType === MessageType.ALERT) {
      return {
        id: msg.content.id,
        sender: "System",
        text: msg.content.message,
        time: msg.createdAt ? formatTimeAgo(msg.createdAt) : "",
        isMe: false,
        isAlert: true,
        avatar: "#666666",
      };
    }

    const userMsg = msg as UserMessage;
    const memberColors = [
      "#FF6B9D",
      "#4A90E2",
      "#9C27B0",
      "#00D084",
      "#FFB347",
    ];

    return {
      id: msg.content.id,
      sender: userMsg.sender.fname,
      text: userMsg.content.message,
      time: userMsg.createdAt ? formatTimeAgo(userMsg.createdAt) : "Sending...",
      isMe: userMsg.sender.id === user?.id,
      avatar: userMsg.sender.bgUrl || memberColors[index % memberColors.length],
      file: userMsg.file,
      replyingTo: userMsg.replyingTo,
      rawMessage: userMsg, // Keep original for reply functionality
    };
  });

  // Handle sending message
  const handleSend = async () => {
    if (!message.trim() && !selectedFile) return;

    const success = await sendMessage({
      message: message.trim(),
      file: selectedFile || undefined,
      replyingTo,
    });

    if (success) {
      setMessage("");
      removeFile();
      cancelReply();
    }
  };

  // Handle attachment selection
  const handleAttachment = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Take Photo", "Choose from Library"],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) selectImageFromCamera();
          if (buttonIndex === 2) selectImage();
        }
      );
    } else {
      Alert.alert("Select Image", "Choose an option", [
        { text: "Cancel", style: "cancel" },
        { text: "Take Photo", onPress: selectImageFromCamera },
        { text: "Choose from Library", onPress: selectImage },
      ]);
    }
  };

  // Handle join group
  const handleJoinGroup = async () => {
    setIsJoining(true);
    try {
      await joinGroup(groupId);
    } catch (err) {
      Alert.alert("Error", "Failed to join group");
    } finally {
      setIsJoining(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleGroupInfo = () => {
    console.log("Open group info");
  };

  const MessageSkeleton = ({ isMe }: { isMe: boolean }) => (
    <View style={[styles.messageRow, isMe && styles.myMessageRow]}>
      {!isMe && <Skeleton width={32} height={32} borderRadius={16} />}
      <View style={[styles.messageBubble, { padding: 12 }]}>
        {!isMe && (
          <Skeleton width={60} height={12} style={{ marginBottom: 4 }} />
        )}
        <Skeleton
          width={Math.random() * 100 + 100}
          height={14}
          style={{ marginBottom: 4 }}
        />
        <Skeleton width={40} height={10} />
      </View>
    </View>
  );

  if (groupLoading || isLoading) {
    return (
      <View style={[styles.container, dynamicStyles.container]}>
        {/* Header Skeleton */}
        <View style={[styles.header, dynamicStyles.header]}>
          <Skeleton width={24} height={24} borderRadius={12} />
          <View style={styles.headerInfo}>
            <View style={styles.avatarsContainer}>
              <Skeleton width={32} height={32} borderRadius={16} />
              <Skeleton
                width={32}
                height={32}
                borderRadius={16}
                style={{ marginLeft: -8 }}
              />
            </View>
            <View style={styles.headerText}>
              <Skeleton width={120} height={16} style={{ marginBottom: 4 }} />
              <Skeleton width={80} height={12} />
            </View>
          </View>
          <Skeleton width={24} height={24} borderRadius={12} />
        </View>

        {/* Messages Skeleton */}
        <View style={styles.messagesContainer}>
          <View style={styles.messagesContent}>
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <MessageSkeleton key={i} isMe={i % 3 === 0} />
              ))}
          </View>
        </View>

        {/* Input Skeleton */}
        <View style={styles.inputSection}>
          <Skeleton width={24} height={24} borderRadius={12} />
          <Skeleton height={44} borderRadius={22} style={{ flex: 1 }} />
          <Skeleton width={44} height={44} borderRadius={22} />
        </View>
      </View>
    );
  }

  if (!socket || !user) {
    return (
      <View
        style={[
          styles.container,
          dynamicStyles.container,
          styles.centerContainer,
        ]}
      >
        <ActivityIndicator size="large" color={dynamicStyles.text.color} />
        <Text style={[{ marginTop: 12, fontSize: 16 }, dynamicStyles.text]}>
          Connecting...
        </Text>
      </View>
    );
  }

  if (groupError || error) {
    return (
      <ErrorScreen
        message={String(groupError || error || "Failed to load chat")}
      />
    );
  }

  if (!groupDetails) {
    return <ErrorScreen message="Group not found" />;
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, dynamicStyles.container]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      {/* Header with Real Group Data */}
      <View style={[styles.header, dynamicStyles.header]}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={dynamicStyles.text.color}
          />
        </Pressable>

        <Pressable style={styles.headerInfo} onPress={handleGroupInfo}>
          <View style={styles.avatarsContainer}>
            {groupDetails.members.slice(0, 3).map((member, index) => {
              const colors = ["#FF6B9D", "#4A90E2", "#9C27B0", "#00D084"];
              return (
                <View
                  key={member.id}
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
                    <Text style={styles.avatarText}>{member.fname[0]}</Text>
                  )}
                </View>
              );
            })}
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.groupName, dynamicStyles.text]}>
              {groupDetails.name}
            </Text>
            <View style={styles.headerSubtitle}>
              <Text style={[styles.membersCount, dynamicStyles.subtitle]}>
                {groupDetails.members.length} members
              </Text>
              <View style={styles.dot} />
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={[styles.ratingText, dynamicStyles.subtitle]}>
                  {groupDetails.score}%
                </Text>
              </View>
            </View>
          </View>
        </Pressable>

        <Pressable style={styles.infoButton} onPress={handleGroupInfo}>
          <Ionicons
            name="information-circle-outline"
            size={24}
            color={dynamicStyles.text.color}
          />
        </Pressable>
      </View>

      {/* Reply Preview */}
      {replyingTo && (
        <View style={[styles.replyPreview, dynamicStyles.replyPreview]}>
          <View style={styles.replyBar} />
          <View style={styles.replyContent}>
            <Text style={[styles.replyAuthor, dynamicStyles.text]}>
              Replying to {replyingTo.sender.fname}
            </Text>
            <Text
              style={[styles.replyText, dynamicStyles.subtitle]}
              numberOfLines={1}
            >
              {replyingTo.content.message}
            </Text>
          </View>
          {replyingTo.file && (
            <Image
              source={{ uri: replyingTo.file.data }}
              style={styles.replyImage}
            />
          )}
          <Pressable onPress={cancelReply} style={styles.cancelReply}>
            <Ionicons
              name="close"
              size={20}
              color={dynamicStyles.subtitle.color}
            />
          </Pressable>
        </View>
      )}

      {/* File Preview */}
      {selectedFile && (
        <View style={[styles.filePreview, dynamicStyles.replyPreview]}>
          <Image
            source={{ uri: selectedFile.data }}
            style={styles.previewImage}
          />
          <View style={styles.fileInfo}>
            <Text
              style={[styles.fileName, dynamicStyles.text]}
              numberOfLines={1}
            >
              {selectedFile.name}
            </Text>
            <Text style={[styles.fileSize, dynamicStyles.subtitle]}>
              {formatFileSize(selectedFile.size)}
            </Text>
          </View>
          <Pressable onPress={removeFile} style={styles.removeFile}>
            <Ionicons name="close-circle" size={24} color="#FF3B30" />
          </Pressable>
        </View>
      )}

      {/* Real-time Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {transformedMessages.map((msg) => (
          <View key={msg.id}>
            {msg.isAlert ? (
              <View style={styles.alertContainer}>
                <Text style={[styles.alertText, dynamicStyles.subtitle]}>
                  {msg.text}
                </Text>
              </View>
            ) : (
              <PanGestureHandler onGestureEvent={gestureHandler}>
  <Animated.View style={[animatedStyle]}>
    <Pressable
      style={[styles.messageRow, msg.isMe && styles.myMessageRow]}
      onLongPress={() => !msg.isMe && msg.rawMessage && startReply(msg.rawMessage)}
    >
                {!msg.isMe && (
                  <View style={styles.messageAvatarContainer}>
                    {typeof msg.avatar === "string" &&
                    msg.avatar.startsWith("http") ? (
                      <Image
                        source={{ uri: msg.avatar }}
                        style={styles.messageAvatarImage}
                      />
                    ) : (
                      <View
                        style={[
                          styles.messageAvatar,
                          { backgroundColor: msg.avatar },
                        ]}
                      >
                        <Text style={styles.avatarText}>{msg.sender[0]}</Text>
                      </View>
                    )}
                  </View>
                )}
                <View
                  style={[
                    styles.messageBubble,
                    msg.isMe
                      ? dynamicStyles.myMessage
                      : dynamicStyles.theirMessage,
                  ]}
                >
                  {/* Reply reference */}
                  {msg.replyingTo && (
                    <View style={styles.replyReference}>
                      <View style={styles.replyBar} />
                      <Text
                        style={[styles.replyRefText, dynamicStyles.subtitle]}
                        numberOfLines={1}
                      >
                        {msg.replyingTo.sender.fname}:{" "}
                        {msg.replyingTo.content.message}
                      </Text>
                    </View>
                  )}

                  {!msg.isMe && (
                    <Text style={[styles.senderName, dynamicStyles.subtitle]}>
                      {msg.sender}
                    </Text>
                  )}

                  {/* File attachment */}
                  {msg.file && (
                    <Image
                      source={{ uri: msg.file.data }}
                      style={styles.messageImage}
                    />
                  )}

                  {msg.text && (
                    <View>
                      <Hyperlink
                        linkDefault={true}
                        linkStyle={{
                          color: msg.isMe ? "#87CEEB" : "#007AFF",
                          textDecorationLine: "underline",
                        }}
                        linkText={(url) => {
                          if (url.length > 30) {
                            return url.substring(0, 30) + "...";
                          }
                          return url;
                        }}
                      >
                        <Text
                          style={[
                            styles.messageText,
                            msg.isMe
                              ? dynamicStyles.myMessageText
                              : dynamicStyles.theirMessageText,
                          ]}
                        >
                          {msg.text}
                        </Text>
                      </Hyperlink>
                    </View>
                  )}
                  <Text style={[styles.messageTime, dynamicStyles.subtitle]}>
                    {msg.time}
                    </Pressable>
  </Animated.View>
</PanGestureHandler>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Input Section */}
      <View style={styles.inputSection}>
        <Pressable style={styles.attachButton} onPress={handleAttachment}>
          <Ionicons
            name="camera-outline"
            size={24}
            color={dynamicStyles.text.color}
          />
        </Pressable>
        <TextInput
          style={[styles.input, dynamicStyles.input]}
          placeholder="Type a message..."
          placeholderTextColor={isDark ? "#666666" : "#999999"}
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={1000}
        />

        {groupDetails.isJoined === false ? (
          <Pressable
            style={[styles.sendButton, dynamicStyles.sendButton]}
            onPress={handleJoinGroup}
            disabled={isJoining}
          >
            {isJoining ? (
              <ActivityIndicator
                size="small"
                color={dynamicStyles.sendIcon.color}
              />
            ) : (
              <Text
                style={[
                  { fontSize: 12, fontWeight: "600" },
                  dynamicStyles.sendIcon,
                ]}
              >
                Join
              </Text>
            )}
          </Pressable>
        ) : (
          <Pressable
            style={[
              styles.sendButton,
              dynamicStyles.sendButton,
              !message.trim() && !selectedFile && { opacity: 0.5 },
            ]}
            onPress={handleSend}
            disabled={!message.trim() && !selectedFile}
          >
            <Ionicons
              name="send"
              size={20}
              color={dynamicStyles.sendIcon.color}
            />
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

// Error Screen Component
const ErrorScreen = ({ message }: { message: string }) => {
  const { isDark } = useTheme();
  const router = useRouter();

  return (
    <View
      style={[
        styles.container,
        styles.centerContainer,
        { backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF" },
      ]}
    >
      <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
      <Text
        style={[
          {
            fontSize: 16,
            color: isDark ? "#FFFFFF" : "#000000",
            marginTop: 12,
          },
        ]}
      >
        {message}
      </Text>
      <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
        <Text style={{ color: "#007AFF" }}>Go Back</Text>
      </Pressable>
    </View>
  );
};

// Utility function
const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMs = now.getTime() - date.getTime();

  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return date.toLocaleDateString();
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
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
    fontSize: 16,
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
  infoButton: {
    padding: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  messageRow: {
    flexDirection: "row",
    gap: 8,
    maxWidth: "80%",
  },
  myMessageRow: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  messageAvatarContainer: {
    alignSelf: "flex-end",
    marginBottom: 4,
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  messageAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: "100%",
  },
  senderName: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 10,
    alignSelf: "flex-end",
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  replyReference: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    padding: 8,
    backgroundColor: "rgba(128, 128, 128, 0.1)",
    borderRadius: 8,
  },
  replyBar: {
    width: 3,
    height: 30,
    backgroundColor: "#007AFF",
    marginRight: 8,
    borderRadius: 1.5,
  },
  replyRefText: {
    fontSize: 12,
    flex: 1,
  },
  // Reply preview styles
  replyPreview: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderTopWidth: 1,
  },
  replyContent: {
    flex: 1,
  },
  replyAuthor: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  replyText: {
    fontSize: 14,
  },
  replyImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginLeft: 8,
  },
  cancelReply: {
    padding: 4,
  },
  replyIcon: {
    position: 'absolute',
    right: 10,
    alignSelf: 'center',
    zIndex: -1,
  }
  // File preview styles
  filePreview: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderTopWidth: 1,
  },
  previewImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "500",
  },
  fileSize: {
    fontSize: 12,
    marginTop: 2,
  },
  removeFile: {
    padding: 4,
  },
  // Alert message styles
  alertContainer: {
    alignItems: "center",
    marginVertical: 8,
  },
  alertText: {
    fontSize: 12,
    backgroundColor: "rgba(128, 128, 128, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    textAlign: "center",
  },
  inputSection: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 16,
    gap: 8,
  },
  attachButton: {
    padding: 4,
    paddingBottom: 12,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default GroupChat;
