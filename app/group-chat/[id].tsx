import { api } from "@/api/client";
import { ChatHeader } from "@/components/chatComponents/ChatHeader";
import { GroupInfoModal } from "@/components/chatComponents/GroupInfoModal";
import { ImageModal } from "@/components/chatComponents/ImageModal";
import { LinkConfirmModal } from "@/components/chatComponents/LinkConfirmModal";
import { MessageInput } from "@/components/chatComponents/MessageInput";
import { MessageList } from "@/components/chatComponents/MessageList";
import { CreatingChatLoader } from "@/components/CreatingChatLoader";
import Header from "@/components/Header";
import { NetworkStatusBanner } from "@/components/NetworkStatusBanner";
import { Text } from "@/components/Themedtext";
import { UrlConstants } from "@/constants/apiUrls";
import { useSocket } from "@/contexts/SocketProvider";
import { useTheme } from "@/contexts/ThemeContext";
import { useGroupMessages, useMessageReply, useSendGroupMessage } from "@/hooks/useEnhancedGroupMessages";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useGroupDetails } from "@/hooks/useGroups";
import { useNotifications } from "@/hooks/useNotification";
import { useSocketConnection } from "@/hooks/useSocketConnection";
import { useAuthStore } from "@/state/authStore";
import { useNotificationStore } from "@/state/notificationStore";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useKeepAwake } from "expo-keep-awake";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Updates from "expo-updates";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  AppState,
  Keyboard,
  KeyboardAvoidingView, Linking, Platform,
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
      <GroupChatContent groupId={id as string} />
    </GestureHandlerRootView>
  );
};

const GroupChatContent = ({ groupId }: { groupId: string }) => {
  const { isDark } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const { user, isAuthenticated } = useAuthStore();
  const { socket } = useSocket();
  const messageRefs = useRef<Map<string, any>>(new Map());
  const infoButtonRef = useRef<View>(null); // Added back
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const [iconPosition, setIconPosition] = useState({ x: 0, y: 0 });
  const { groupData } = useLocalSearchParams();
  const passedGroupData = groupData ? JSON.parse(groupData as string) : null;
  
  // Background timer for auto-navigation
  const appState = useRef(AppState.currentState);
  const backgroundTime = useRef<number | null>(null);

  const {
    data: groupDetails,
    isLoading: groupLoading,
    error: groupError,
    refetch: refetchGroupDetails,
  } = useGroupDetails(groupId);
  const finalGroupDetails = passedGroupData || groupDetails;


  const {
    messages,
    isLoading,
    error,
    refetch,
    isRefetching,
    joinGroupRoom
  } = useGroupMessages(groupId, socket);

  // Log caching behavior
  useEffect(() => {
    // Check initial caching state
    if (messages.length > 0) {
      console.log('📱 Group chat loaded with', messages.length, 'cached messages');
    } else {
      console.log('⏳ No cached messages found on mount');
    }
  }, []); // Run only on mount to check initial state

  useEffect(() => {
    if (messages.length > 0) {
      console.log('📱 Group chat messages updated:', messages.length);
    }
  }, [messages.length]);

  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      console.log('⚡ Messages loaded instantly from cache!');
    }
  }, [isLoading, messages.length]);

  // useGroupSocketSubscription(groupId, socket); // Logic merged into useGroupMessages

  const { sendMessage, isSending } = useSendGroupMessage(groupId);

  // Derived state
  const isCached = !isLoading && messages.length > 0;

  const uniqueMessages = useMemo(() => {
    // 1) Dedup by id, keep latest
    const byId = new Map<string, any>();
    for (const msg of messages) {
      const id = String(msg?.content?.id || '');
      if (!id) continue;
      const prev = byId.get(id);
      const curTime = msg?.createdAt ? new Date(msg.createdAt).getTime() : 0;
      const prevTime = prev?.createdAt ? new Date(prev.createdAt).getTime() : 0;
      if (!prev || curTime >= prevTime) {
        byId.set(id, msg);
      }
    }
    const idDeduped = Array.from(byId.values());

    // 2) Dedup by normalized text + time bucket (1s), keep latest
    const byComposite = new Map<string, any>();
    for (const msg of idDeduped) {
      const text = String(msg?.content?.message || '').trim().toLowerCase();
      const ms = msg?.createdAt ? new Date(msg.createdAt).getTime() : 0;
      const bucket = Math.floor(ms / 1000);
      const key = `${text}|${bucket}`;
      const prev = byComposite.get(key);
      const prevTime = prev?.createdAt ? new Date(prev.createdAt).getTime() : 0;
      if (!prev || ms >= prevTime) {
        byComposite.set(key, msg);
      }
    }

    const out = Array.from(byComposite.values());
    out.sort((a, b) => {
      const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return aTime - bTime;
    });
    return out;
  }, [messages]);

  // Helper functions
  const markAsRead = useCallback(() => {
    // Mark as read locally
    if (groupId) {
      const { markGroupAsRead } = require('@/state/readReceiptsStore').useReadReceiptsStore.getState();
      markGroupAsRead(groupId);
    }

    // Also sync with server if online
    if (socket && groupId && user) {
      // Assuming 'markGroupRead' event based on standard patterns
      // If exact event name is different, we might need to adjust
      socket.emit('markGroupRead', { groupId, userId: user.id });
    }
  }, [socket, groupId, user]);

  const retryConnection = useCallback(() => {
    console.log('🔄 Retrying connection and syncing recent messages');
    joinGroupRoom(); // This will sync recent messages based on last_message_at
    refetch(); // Fallback API call if needed
  }, [joinGroupRoom, refetch]);

  useEffect(() => {
    const gestureEnabled = !(isLoading && messages.length === 0);
    navigation.setOptions({ gestureEnabled });
  }, [navigation, isLoading, messages.length]);
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (isLoading && messages.length === 0) {
        e.preventDefault();
      }
    });
    return unsubscribe;
  }, [navigation, isLoading, messages.length]);

  const { refetchNotifications } = useNotifications();
  const { setActiveGroupId } = useNotificationStore();
  const { isNetworkConnected, isSocketConnected, isOnline } = useSocketConnection();

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

  // Optimistic update on entry and Mark as Read on API on exit (cleanup)
  useEffect(() => {
    // 1. Optimistic Update on Entry
    // Immediately reduce global notification count
    const unreadCount = finalGroupDetails?.unread || 0;
    if (unreadCount > 0) {
      console.log(`📉 Optimistically reducing global unread count by ${unreadCount}`);
      // Decrement the global count
      // We don't have a direct "decrement by N" action, so we use setNotifications
      const { groupNotifications, setNotifications } = require('@/state/notificationStore').useNotificationStore.getState();
      const newCount = Math.max(0, groupNotifications - unreadCount);
      setNotifications({ groupNotifications: newCount });
    }

    // 2. Mark as Read on Exit (Cleanup)
    return () => {
      console.log('👋 Leaving chat, marking as read on server');
      markAsRead();
      // Also update local store timestamp to ensure it stays "read" in the list
      const { markGroupAsRead } = require('@/state/readReceiptsStore').useReadReceiptsStore.getState();
      if (groupId) {
        markGroupAsRead(groupId);
      }
    };
  }, [groupId]); // Only run on mount/unmount for this group ID

  // Keep screen awake while in chat
  useKeepAwake();

  useFocusEffect(
    useCallback(() => {
      setActiveGroupId(groupId);
      refetchNotifications();

      return () => {
        setActiveGroupId(null);
      };
    }, [refetchNotifications, groupId, setActiveGroupId])
  );

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) {
        Updates.reloadAsync().catch((e) => console.warn("Failed to reload app:", e));
      }
    }, [isAuthenticated])
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextState === "active"
      ) {
        // App has come to the foreground
        if (backgroundTime.current) {
          const timeInBackground = Date.now() - backgroundTime.current;
          console.log(`📱 Group chat: App foregrounded after ${timeInBackground}ms`);

          // If backgrounded for more than 40 seconds, navigate back to groups
          if (timeInBackground > 30000) {
            console.log("🔄 App was in background for >40s. Navigating to groups...");
            router.replace("/(tabs)/groups");
          }
        }
        backgroundTime.current = null;
        
        // Existing logic
        retryConnection();
        refetchNotifications();
      } else if (nextState.match(/inactive|background/)) {
        // App has gone to the background
        console.log("📱 Group chat: App backgrounded");
        backgroundTime.current = Date.now();
      }

      appState.current = nextState;
    });

    return () => {
      subscription.remove();
    };
  }, [retryConnection, refetchNotifications, router]);

  // Reconnect socket when coming online - handled by SocketProvider now
  // const { isConnected } = useNetworkStatus();
  // useEffect(() => {
  //   if (isConnected && socket && !socket.connected) {
  //     console.log('🌐 Network back online, reconnecting socket...');
  //     socket.connect();
  //     retryConnection(); // Refetch messages
  //   }
  // }, [isConnected, socket, retryConnection]);


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
      const messageToSend = message.trim();

      // Optimistically clear input to prevent lag
      setMessage("");
      removeFile();
      cancelReply();

      await sendMessage({
        message: messageToSend,
        file: fileData,
        replyingTo,
      });
    } catch (error) {
      console.error("💥 Send error:", error);
      // Optional: Restore message on critical error if needed
      // setMessage(messageToSend); 
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
      console.log("Navigating to profile with details:", userId);
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

  const handleRefresh = useCallback(async () => {
    try {
      await refetchGroupDetails();
    } catch (error) {
      console.error('Failed to refresh group details:', error);
    }
  }, [refetchGroupDetails]);

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
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <Header />
      <NetworkStatusBanner />
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
          isCached={isCached}
          isRefreshing={isRefetching}
          onRefresh={handleRefresh}
        />

        {isLoading && messages.length === 0 ? (
          <CreatingChatLoader
            name={finalGroupDetails?.name || passedGroupData?.name || "Group Chat"}
            titleText=""
            prefixText="Your chat with "
            suffixText=" is getting prepared..."
            showTitle={false}
          />
        ) : (
          <MessageList
            messages={uniqueMessages}
            userId={user?.id}
            onReply={startReply}
            onImagePress={setShowImageModal}
            onLinkPress={handleLinkPress}
            scrollToMessage={scrollToMessage}
            messageRefs={messageRefs}
            navigateToProfile={navigateToProfile}
            isLoadingMore={false}
            keyboardVisible={keyboardVisible}
          />
        )}

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
        onAttachment={() => { }}
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
        isSending={isSending}
        isComplete={finalGroupDetails?.isComplete || passedGroupData?.isComplete || false}
        isDisabled={!isSocketConnected || (isLoading && messages.length === 0)}
      />

      {/* Loading Overlay - Only show when sending messages */}
      {isSending && (
        <View style={styles.loadingOverlay} pointerEvents="auto" />
      )}
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
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    zIndex: 1000,
  },
});

export default GroupChat;