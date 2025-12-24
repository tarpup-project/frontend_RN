import { api } from "@/api/client";
import Header from "@/components/Header";
import { Text } from "@/components/Themedtext";
import { ChatHeader } from "@/components/chatComponents/ChatHeader";
import { GroupInfoModal } from "@/components/chatComponents/GroupInfoModal";
import { ImageModal } from "@/components/chatComponents/ImageModal";
import { LinkConfirmModal } from "@/components/chatComponents/LinkConfirmModal";
import { MessageInput } from "@/components/chatComponents/MessageInput";
import { MessageList } from "@/components/chatComponents/MessageList";
import { UrlConstants } from "@/constants/apiUrls";
import { GroupSocketProvider, useGroupSocket } from "@/contexts/SocketProvider";
import { useTheme } from "@/contexts/ThemeContext";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useGroupMessages, useMessageReply } from "@/hooks/useGroupMessages";
import { useGroupDetails } from "@/hooks/useGroups";
import { useNotifications } from "@/hooks/useNotification";
import { useAuthStore } from "@/state/authStore";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    Animated,
    Keyboard,
    KeyboardAvoidingView,
    Linking,
    Platform,
    Pressable,
    StyleSheet,
    View
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

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
  const messageRefs = useRef<Map<string, any>>(new Map());
  const infoButtonRef = useRef<View>(null); // Added back
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const [iconPosition, setIconPosition] = useState({ x: 0, y: 0 });
  const { groupData } = useLocalSearchParams();
  const passedGroupData = groupData ? JSON.parse(groupData as string) : null;

  const {
    data: groupDetails,
    isLoading: groupLoading,
    error: groupError,
  } = useGroupDetails(groupId);
  const finalGroupDetails = passedGroupData || groupDetails;

  const { messages, isLoading, error, sendMessage, markAsRead } =
    useGroupMessages({ groupId, socket: socket && user ? socket : undefined });

  const { refetchNotifications } = useNotifications();

  const { replyingTo, startReply, cancelReply } = useMessageReply();
  const {
    selectedFile,
    isProcessing,
    selectImage,
    selectImageFromCamera,
    removeFile,
    selectFile,
  } = useFileUpload();

  const [message, setMessage] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showImageModal, setShowImageModal] = useState<string | null>(null);
  const [linkToConfirm, setLinkToConfirm] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const isFocused = useIsFocused();

  const dynamicStyles = useMemo(
    () => ({
      container: {
        backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
      },
      text: {
        color: isDark ? "#FFFFFF" : "#000000",
      },
    }),
    [isDark]
  );

  const joinGroup = useCallback(async () => {
    setIsJoining(true);
    try {
      await api.post(UrlConstants.fetchInviteGroupDetails(groupId), {});
    } catch (err) {
      Alert.alert("Error", "Failed to join group");
    } finally {
      setIsJoining(false);
    }
  }, [groupId]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
        if (showGroupInfo) setShowGroupInfo(false);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, [showGroupInfo]);

  useEffect(() => {
    console.log("🖼️ showImageModal state:", showImageModal);
  }, [showImageModal]);

  useEffect(() => {
    markAsRead();
    refetchNotifications();
  }, [markAsRead, refetchNotifications]);

  useFocusEffect(
    useCallback(() => {
      markAsRead();
      refetchNotifications();
    }, [markAsRead, refetchNotifications])
  );

  useEffect(() => {
    if (isFocused) {
      markAsRead();
      refetchNotifications();
    }
  }, [isFocused, markAsRead, refetchNotifications]);

  useEffect(() => {
    console.log("🔍 showGroupInfo state changed:", showGroupInfo);
  }, [showGroupInfo]);

  useEffect(() => {
    if (showGroupInfo) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showGroupInfo, slideAnim, fadeAnim, scaleAnim]);

  const scrollToMessage = useCallback((messageId: string) => {
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
          // Note: This would need a ref to scrollView, but since we moved MessageList,
          // this functionality should be moved to MessageList component
          console.log("Scroll to message:", messageId, pageY);
        }
      );
    }
  }, []);

  const handleSend = useCallback(async () => {
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

    try {
      const success = await sendMessage({
        message: message.trim(),
        file: fileData,
        replyingTo,
      });

      if (success) {
        setMessage("");
        removeFile();
        cancelReply();
      }
    } catch (error) {
      console.error("💥 Send error:", error);
    }
  }, [message, selectedFile, sendMessage, replyingTo, removeFile, cancelReply]);

  const handleJoinGroup = useCallback(async () => {
    await joinGroup();
  }, [joinGroup]);

  const handleToggleDropdown = useCallback(() => {
    setShowDropdown(!showDropdown);
  }, [showDropdown]);

  const navigateToProfile = useCallback(
    (userId: string) => {
      router.push(`/profile/${userId}` as any);
    },
    [router]
  );

  const handleLinkPress = useCallback((url: string) => {
    setLinkToConfirm(url);
  }, []);

  const confirmOpenLink = useCallback(async () => {
    if (linkToConfirm) {
      try {
        await Linking.openURL(linkToConfirm);
      } catch (error) {
        Alert.alert("Error", "Cannot open this link");
      }
      setLinkToConfirm(null);
    }
  }, [linkToConfirm]);

  const handleShowGroupInfo = useCallback(() => {
    console.log("🔍 handleShowGroupInfo called!");
    setIconPosition({ x: 0, y: 100 }); 
    setShowGroupInfo(true);
    console.log("🔍 showGroupInfo set to true"); 
  }, []);

  const loadingState = useMemo(() => {
    // Always return "ready" to avoid loading states
    return "ready";
  }, []);


  // Remove the loading state check - always render the main content
  return (
      <KeyboardAvoidingView
        style={[styles.container, dynamicStyles.container]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
       <Header />    
        {/* Content area - always show group header and messages */}
        <View style={{ flex: 1 }}>
          <ChatHeader
            groupDetails={{
              id: finalGroupDetails?.id || groupId,
              name: finalGroupDetails?.name || passedGroupData?.name || "Group Chat",
              members: finalGroupDetails?.members || passedGroupData?.members || [],
              score: finalGroupDetails?.score || passedGroupData?.score || 0,
              shareLink: finalGroupDetails?.shareLink || passedGroupData?.shareLink || "",
              isJoined: finalGroupDetails?.isJoined !== false,
              isAdmin: finalGroupDetails?.isAdmin || passedGroupData?.isAdmin || false,
              isComplete: finalGroupDetails?.isComplete || passedGroupData?.isComplete || false,
            }}
            showDropdown={showDropdown}
            onToggleDropdown={handleToggleDropdown}
            onShowGroupInfo={handleShowGroupInfo}
            onLeaveSuccess={() => router.back()}
            navigateToProfile={navigateToProfile}
          />

          <MessageList
            messages={messages || []}
            userId={user?.id}
            onReply={startReply}
            onImagePress={setShowImageModal}
            onLinkPress={handleLinkPress}
            scrollToMessage={scrollToMessage}
            messageRefs={messageRefs}
            navigateToProfile={navigateToProfile}
          />

          <GroupInfoModal
            visible={showGroupInfo}
            groupDetails={{
              id: finalGroupDetails?.id || groupId,
              name: finalGroupDetails?.name || passedGroupData?.name || "Group Chat",
              members: finalGroupDetails?.members || passedGroupData?.members || [],
              score: finalGroupDetails?.score || passedGroupData?.score || 0,
              category: finalGroupDetails?.category || passedGroupData?.category || [],
            }}
            iconPosition={iconPosition}
            slideAnim={slideAnim}
            fadeAnim={fadeAnim}
            scaleAnim={scaleAnim}
            onClose={() => setShowGroupInfo(false)}
            navigateToProfile={navigateToProfile}
          />

          <ImageModal
            imageUrl={showImageModal}
            visible={!!showImageModal}
            onClose={() => setShowImageModal(null)}
          />

          <LinkConfirmModal
            url={linkToConfirm}
            visible={!!linkToConfirm}
            onConfirm={confirmOpenLink}
            onCancel={() => setLinkToConfirm(null)}
          />

          {showDropdown && (
            <Pressable
              style={styles.overlay}
              onPress={() => setShowDropdown(false)}
            />
          )}
        </View>
    
        {/* MessageInput - ALWAYS VISIBLE */}
        <MessageInput
          message={message}
          onChangeMessage={setMessage}
          onSend={handleSend}
          onAttachment={() => {}}
          isJoined={finalGroupDetails?.isJoined !== false}
          onJoinGroup={handleJoinGroup}
          isJoining={isJoining}
          selectedFile={selectedFile || null}
          onRemoveFile={removeFile}
          replyingTo={replyingTo || null}
          onCancelReply={cancelReply}
          selectImage={selectImage}
          selectImageFromCamera={selectImageFromCamera}
          selectFile={selectFile}
        />
      </KeyboardAvoidingView>
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
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
});

export default GroupChat;
