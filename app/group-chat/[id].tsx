import Header from "@/components/Header";
import { Skeleton } from "@/components/Skeleton";
import { Text } from "@/components/Themedtext";
import { GroupSocketProvider, useGroupSocket } from "@/contexts/SocketProvider";
import { useTheme } from "@/contexts/ThemeContext";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useGroupMessages, useMessageReply } from "@/hooks/useGroupMessages";
import { useGroupActions, useGroupDetails } from "@/hooks/useGroups";
import { useAuthStore } from "@/state/authStore";
import { MessageType, UserMessage } from "@/types/groups";
import { formatFileSize, timeAgo } from "@/utils/timeUtils";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Paperclip, Reply, Send, Share2, Users, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Hyperlink from "react-native-hyperlink";
import { runOnJS } from "react-native-reanimated";
import { toast } from "sonner-native";

const GroupChat = () => {
  const { id } = useLocalSearchParams();

  if (!id) {
    return <ErrorScreen message="Group not found" />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GroupSocketProvider groupId={id as string}>
        <GroupChatContent groupId={id as string} />
      </GroupSocketProvider>
    </GestureHandlerRootView>
  );
};

const GroupChatContent = ({ groupId }: { groupId: string }) => {
  const { isDark } = useTheme();
  const router = useRouter();
  const { user } = useAuthStore();
  const { socket } = useGroupSocket();
  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);
  const messageRefs = useRef<Map<string, any>>(new Map());
  const slideAnim = useRef(new Animated.Value(300)).current;
  const {
    leaveGroup,
    reportGroup,
    markAsCompleted,
    shareGroup,
    isLeaving,
    isReporting,
    isMarkingComplete,
  } = useGroupActions();

  const {
    data: groupDetails,
    isLoading: groupLoading,
    error: groupError,
  } = useGroupDetails(groupId);

  const { messages, isLoading, error, sendMessage, markAsRead } =
    useGroupMessages({ groupId, socket: socket && user ? socket : undefined });

  const { replyingTo, startReply, cancelReply } = useMessageReply();
  const {
    selectedFile,
    selectImage,
    selectImageFromCamera,
    removeFile,
    selectFile,
  } = useFileUpload();
  const { joinGroup } = useGroupActions();

  const [message, setMessage] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [reportReason, setReportReason] = useState("spam");
  const [reportDetails, setReportDetails] = useState("");
  const [showImageModal, setShowImageModal] = useState<string | null>(null);
  const [linkToConfirm, setLinkToConfirm] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const nativeScrollGesture = Gesture.Native();

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
    dropdown: {
      backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    modal: {
      backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
    },
  };

  useEffect(() => {
    markAsRead();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  useEffect(() => {
    if (showGroupInfo) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showGroupInfo]);

  const scrollToMessage = (messageId: string) => {
    const messageRef = messageRefs.current.get(messageId);
    if (messageRef) {
      messageRef.measure(
        (
          x: number,
          y: number,
          width: number,
          height: number,
          pageX: number,
          pageY: number
        ) => {
          scrollViewRef.current?.scrollTo({ y: pageY - 200, animated: true });
        }
      );
    }
  };

  const transformedMessages = messages.map((msg, index) => {
    if (msg.messageType === MessageType.ALERT) {
      return {
        id: msg.content.id,
        sender: "System",
        text: msg.content.message,
        time: msg.createdAt ? timeAgo(msg.createdAt) : "",
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
      time: userMsg.createdAt ? timeAgo(userMsg.createdAt) : "Sending...",
      isMe: userMsg.sender.id === user?.id,
      avatar: userMsg.sender.bgUrl || memberColors[index % memberColors.length],
      file: userMsg.file,
      replyingTo: userMsg.replyingTo,
      rawMessage: userMsg,
    };
  });

  const handleSend = async () => {
    if (!message.trim() && !selectedFile) {
      console.log("❌ No message or file to send");
      return;
    }

    const fileData = selectedFile
      ? {
          data: selectedFile.data,
          name: selectedFile.name,
          ext: selectedFile.ext || selectedFile.name.split(".").pop() || "",
          size: selectedFile.size,
        }
      : undefined;

    console.log("📋 FileData prepared:", fileData);

    try {
      const success = await sendMessage({
        message: message.trim(),
        file: fileData,
        replyingTo,
      });

      console.log("✅ Send result:", success);

      if (success) {
        setMessage("");
        removeFile();
        cancelReply();
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error("💥 Send error:", error);
    }
  };

  const handleAttachment = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            "Cancel",
            "Take Photo",
            "Choose from Library",
            "Choose File",
          ],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) selectImageFromCamera();
          if (buttonIndex === 2) selectImage();
          if (buttonIndex === 3) selectFile();
        }
      );
    } else {
      Alert.alert("Select File", "Choose an option", [
        { text: "Cancel", style: "cancel" },
        { text: "Take Photo", onPress: selectImageFromCamera },
        { text: "Choose from Library", onPress: selectImage },
        { text: "Choose File", onPress: selectFile },
      ]);
    }
  };

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
    setShowDropdown(!showDropdown);
  };

  const navigateToProfile = (userId: string) => {
    router.push(`/profile/${userId}` as any);
  };

  const handleLinkPress = (url: string) => {
    setLinkToConfirm(url);
  };

  const confirmOpenLink = async () => {
    if (linkToConfirm) {
      try {
        await Linking.openURL(linkToConfirm);
      } catch (error) {
        Alert.alert("Error", "Cannot open this link");
      }
      setLinkToConfirm(null);
    }
  };

  const handleShareGroup = async () => {
    setShowDropdown(false);
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
        <Header />
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

        <View style={styles.messagesContainer}>
          <View style={styles.messagesContent}>
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <MessageSkeleton key={i} isMe={i % 3 === 0} />
              ))}
          </View>
        </View>

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
        <Header />
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
      <Header />

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
                      <Text style={styles.avatarText}>{member.fname[0]}</Text>
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

        <View style={styles.infoButtonContainer}>
          <Pressable style={styles.infoButton} onPress={handleGroupInfo}>
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
              <X size={20} color="#FF3B30" />
            )}
          </Pressable>

          {showDropdown && (
            <View style={[styles.dropdown, dynamicStyles.dropdown]}>
              {console.log("=== DEBUGGING SHARE LINK ===")}
              {console.log("groupDetails:", groupDetails)}
              {console.log("shareLink exists:", !!groupDetails?.shareLink)}
              {console.log("shareLink value:", groupDetails?.shareLink)}
              {console.log("=== END DEBUG ===")}
              <Pressable
                style={styles.dropdownItem}
                onPress={() => {
                  setShowDropdown(false);
                  setShowGroupInfo(true);
                }}
              >
                <Users size={16} color={dynamicStyles.text.color} />
                <Text style={[styles.dropdownText, dynamicStyles.text]}>
                  More Info
                </Text>
              </Pressable>

              {groupDetails.isJoined !== false && (
                <Pressable
                  style={styles.dropdownItem}
                  onPress={() => {
                    setShowDropdown(false);
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
                <Pressable
                  style={styles.dropdownItem}
                  onPress={handleShareGroup}
                >
                  <Share2 size={16} color={dynamicStyles.text.color} />
                  <Text style={[styles.dropdownText, dynamicStyles.text]}>
                    Share Group
                  </Text>
                </Pressable>
              )}

              {groupDetails.isAdmin && !groupDetails.isComplete && (
                <Pressable
                  style={styles.dropdownItem}
                  onPress={() => {
                    setShowDropdown(false);
                    Alert.alert(
                      "Mark as Completed",
                      `Are you sure you want to mark "${groupDetails.name}" as completed?`,
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Mark Complete",
                          onPress: async () => {
                            const success = await markAsCompleted(
                              groupDetails.id
                            );
                            if (success) {
                              router.back();
                            }
                          },
                        },
                      ]
                    );
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
                    setShowDropdown(false);
                    Alert.alert(
                      "Leave Group",
                      `Are you sure you want to leave "${groupDetails.name}"?`,
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Leave",
                          style: "destructive",
                          onPress: () => {
                            leaveGroup(groupDetails.id).then((success) => {
                              if (success) {
                                router.back();
                              }
                            });
                          },
                        },
                      ]
                    );
                  }}
                  disabled={isLeaving}
                >
                  <X size={16} color="#FF3B30" />
                  <Text style={[styles.dropdownText, { color: "#FF3B30" }]}>
                    {isLeaving ? "Leaving..." : "Leave Group"}
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </View>

      <GestureDetector gesture={nativeScrollGesture}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {transformedMessages.map((msg) => (
            <MessageItemWithSwipe
              key={msg.id}
              msg={msg}
              onReply={startReply}
              onImagePress={setShowImageModal}
              onLinkPress={handleLinkPress}
              scrollToMessage={scrollToMessage}
              messageRefs={messageRefs}
              dynamicStyles={dynamicStyles}
              navigateToProfile={navigateToProfile}
              scrollGesture={nativeScrollGesture}
            />
          ))}
        </ScrollView>
      </GestureDetector>

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
            <X size={20} color={dynamicStyles.subtitle.color} />
          </Pressable>
        </View>
      )}

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
            <X size={24} color="#FF3B30" />
          </Pressable>
        </View>
      )}

      <View style={styles.inputSection}>
        <Pressable style={styles.attachButton} onPress={handleAttachment}>
          <Paperclip size={24} color={dynamicStyles.text.color} />
        </Pressable>
        <TextInput
          ref={textInputRef}
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
            <Send size={20} color={dynamicStyles.sendIcon.color} />
          </Pressable>
        )}
      </View>

      {showGroupInfo && (
        <Animated.View
          style={[
            styles.groupInfoSlideModal,
            dynamicStyles.modal,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <View style={styles.groupInfoHeader}>
            <Text style={[styles.groupInfoTitle, dynamicStyles.text]}>
              Group Info
            </Text>
            <Pressable onPress={() => setShowGroupInfo(false)}>
              <X size={24} color={dynamicStyles.text.color} />
            </Pressable>
          </View>

          <ScrollView style={styles.groupInfoContent}>
            <View style={styles.groupInfoSection}>
              <View style={styles.groupInfoTop}>
                <View
                  style={[
                    styles.groupCategoryIcon,
                    {
                      backgroundColor:
                        groupDetails.category?.[0]?.bgColorHex || "#007AFF",
                    },
                  ]}
                >
                  <Ionicons name="star" size={20} color="#FFFFFF" />
                </View>
                <Text style={[styles.groupInfoName, dynamicStyles.text]}>
                  {groupDetails.name}
                </Text>
                <View style={styles.compatibilityBadge}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={styles.compatibilityText}>
                    {groupDetails.score}% compatibility
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.groupInfoSection}>
              <Text style={[styles.groupInfoLabel, dynamicStyles.text]}>
                Description
              </Text>
              <Text style={[styles.groupInfoValue, dynamicStyles.subtitle]}>
                {groupDetails.description || "No description available"}
              </Text>
            </View>

            <View style={styles.groupInfoSection}>
              <Text style={[styles.groupInfoLabel, dynamicStyles.text]}>
                Members ({groupDetails.members.length})
              </Text>
              {groupDetails.members.map((member, index) => {
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
                      setShowGroupInfo(false);
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
              })}
            </View>
          </ScrollView>
        </Animated.View>
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
                <X size={24} color={dynamicStyles.text.color} />
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
                onPress={async () => {
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
                }}
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
        visible={!!showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(null)}
      >
        <View style={styles.imageModalOverlay}>
          <Pressable
            style={styles.imageModalBackground}
            onPress={() => setShowImageModal(null)}
          >
            <View style={styles.imageModalContent}>
              <Pressable
                style={styles.closeButton}
                onPress={() => setShowImageModal(null)}
              >
                <X size={28} color="#FFFFFF" />
              </Pressable>

              {showImageModal && (
                <Image
                  source={{ uri: showImageModal }}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
              )}
            </View>
          </Pressable>
        </View>
      </Modal>

      <Modal
        visible={!!linkToConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLinkToConfirm(null)}
      >
        <View style={styles.centeredModalContainer}>
          <View style={[styles.linkModal, dynamicStyles.modal]}>
            <Text style={[styles.linkModalTitle, dynamicStyles.text]}>
              Open Link?
            </Text>
            <Text
              style={[styles.linkModalUrl, dynamicStyles.subtitle]}
              numberOfLines={2}
            >
              {linkToConfirm}
            </Text>
            <View style={styles.linkModalButtons}>
              <Pressable
                style={[styles.linkModalButton, styles.linkModalCancel]}
                onPress={() => setLinkToConfirm(null)}
              >
                <Text style={styles.linkModalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.linkModalButton, styles.linkModalOpen]}
                onPress={confirmOpenLink}
              >
                <Text style={styles.linkModalOpenText}>Open</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {showDropdown && (
        <Pressable
          style={styles.overlay}
          onPress={() => setShowDropdown(false)}
        />
      )}
    </KeyboardAvoidingView>
  );
};

const MessageItemWithSwipe = ({
  msg,
  onReply,
  scrollGesture,
  onImagePress,
  onLinkPress,
  scrollToMessage,
  messageRefs,
  dynamicStyles,
  navigateToProfile,
}: any) => {
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-25, 25])
    .simultaneousWithExternalGesture(scrollGesture)
    .onEnd((event) => {
      const { translationX, velocityX, translationY } = event;

      if (
        translationX > 60 &&
        velocityX > 300 &&
        Math.abs(translationY) < 30 &&
        msg.rawMessage &&
        onReply
      ) {
        runOnJS(onReply)(msg.rawMessage);
      }
    });

  return (
    <View
      ref={(ref) => messageRefs.current.set(msg.id, ref)}
      style={styles.messageWrapper}
    >
      {msg.isAlert ? (
        <View style={styles.alertContainer}>
          <Text style={[styles.alertText, dynamicStyles.subtitle]}>
            {msg.text}
          </Text>
        </View>
      ) : (
        <GestureDetector gesture={swipeGesture}>
          <View style={[styles.messageRow, msg.isMe && styles.myMessageRow]}>
            {!msg.isMe && (
              <Pressable
                onPress={() => {
                  if (msg.rawMessage?.sender?.id) {
                    navigateToProfile(msg.rawMessage.sender.id);
                  }
                }}
                style={styles.messageAvatarContainer}
              >
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
              </Pressable>
            )}

            <View
              style={[
                styles.messageBubble,
                msg.isMe ? dynamicStyles.myMessage : dynamicStyles.theirMessage,
              ]}
            >
              {msg.replyingTo && (
                <Pressable
                  style={styles.replyReference}
                  onPress={() => scrollToMessage(msg.replyingTo.content.id)}
                >
                  <View style={styles.replyBar} />
                  <Text
                    style={[styles.replyRefText, dynamicStyles.subtitle]}
                    numberOfLines={1}
                  >
                    {msg.replyingTo.sender.fname}:{" "}
                    {msg.replyingTo.content.message}
                  </Text>
                </Pressable>
              )}

              {!msg.isMe && (
                <Text style={[styles.senderName, dynamicStyles.subtitle]}>
                  {msg.sender}
                </Text>
              )}

              {msg.file && (
                <Pressable onPress={() => onImagePress(msg.file.data)}>
                  <Image
                    source={{ uri: msg.file.data }}
                    style={styles.messageImage}
                  />
                </Pressable>
              )}

              {msg.text && (
                <View>
                  <Hyperlink
                    linkDefault={false}
                    onPress={(url) => onLinkPress(url)}
                    linkStyle={{
                      color: msg.isMe ? "#87CEEB" : "#007AFF",
                      textDecorationLine: "underline",
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
            </View>

            <Text style={[styles.messageTime, dynamicStyles.subtitle]}>
              {msg.time}
            </Text>

            <Pressable
              onPress={() => onReply(msg.rawMessage)}
              style={styles.replyButton}
            >
              <Reply
                size={18}
                color={dynamicStyles.subtitle.color}
                style={{ opacity: 0.8 }}
              />
            </Pressable>
          </View>
        </GestureDetector>
      )}
    </View>
  );
};

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
    fontSize: 8,
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
    fontSize: 14,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  messageWrapper: {
    marginVertical: 4,
  },
  messageRow: {
    flexDirection: "row",
    gap: 8,
    maxWidth: "85%",
    alignItems: "flex-end",
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
    alignSelf: "flex-start",
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
    marginTop: 4,
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
  replyButton: {
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingBottom: 12,
  },
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
  centeredModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageModalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageModalContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 1,
    padding: 8,
  },
  fullImage: {
    width: "90%",
    height: "90%",
    maxWidth: 500,
    maxHeight: 500,
  },
  linkModal: {
    borderRadius: 12,
    padding: 20,
    minWidth: 280,
    maxWidth: "90%",
  },
  linkModalTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  linkModalUrl: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
  },
  linkModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  linkModalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  linkModalCancel: {
    backgroundColor: "#F5F5F5",
  },
  linkModalOpen: {
    backgroundColor: "#007AFF",
  },
  linkModalCancelText: {
    color: "#000000",
    fontWeight: "500",
  },
  linkModalOpenText: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  groupInfoSlideModal: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 300,
    height: "100%",
    zIndex: 1000,
  },
  groupInfoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  groupInfoTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  groupInfoContent: {
    flex: 1,
    padding: 20,
  },
  groupInfoSection: {
    marginBottom: 20,
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
    fontSize: 16,
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
    color: "#FFD700",
  },
  groupInfoLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  groupInfoValue: {
    fontSize: 14,
    lineHeight: 20,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
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
    fontSize: 14,
    fontWeight: "500",
  },
  memberRole: {
    fontSize: 12,
    marginTop: 2,
  },
  reportModal: {
    borderRadius: 12,
    padding: 20,
    maxWidth: "90%",
    width: 320,
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  reportSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
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
    padding: 12,
  },
  pickerText: {
    fontSize: 16,
  },
  reportTextInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  reportButtons: {
    flexDirection: "row",
    gap: 12,
  },
  reportButton: {
    flex: 1,
    padding: 12,
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
  },
});

export default GroupChat;
