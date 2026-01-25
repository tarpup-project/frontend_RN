import { MessageType, UserMessage } from "@/types/groups";
import { timeAgo } from "@/utils/timeUtils";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import { MessageItem } from "./MessageItem";

interface MessageListProps {
  messages: any[];
  userId: string | undefined;
  onReply: (rawMessage: any) => void;
  onImagePress: (imageUrl: string) => void;
  onLinkPress: (url: string) => void;
  scrollToMessage: (messageId: string) => void;
  messageRefs: React.MutableRefObject<Map<string, any>>;
  navigateToProfile: (userId: string) => void;
  isLoadingMore?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  userId,
  onReply,
  onImagePress,
  onLinkPress,
  scrollToMessage,
  messageRefs,
  navigateToProfile,
  isLoadingMore,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const nativeScrollGesture = Gesture.Native();

  const handleScrollToMessage = useCallback((messageId: string) => {
    console.log("🎯 Attempting to scroll to message:", messageId);

    const messageRef = messageRefs.current.get(messageId);
    if (!messageRef) {
      console.log("❌ Message ref not found for:", messageId);
      return;
    }

    if (!scrollViewRef.current) {
      console.log("❌ ScrollView ref not available");
      return;
    }

    messageRef.measureLayout(
      scrollViewRef.current,
      (x: number, y: number) => {
        console.log("✅ Measured position:", { x, y });
        scrollViewRef.current?.scrollTo({
          y: Math.max(0, y - 100),
          animated: true
        });
      },
      (error: any) => {
        console.log("❌ Measure layout failed:", error);
      }
    );
  }, [messageRefs]);

  const transformedMessages = useMemo(() => {
    return messages.map((msg, index) => {
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
        isMe: userMsg.sender.id === userId,
        avatar: userMsg.sender.bgUrl || memberColors[index % memberColors.length],
        file: userMsg.file,
        replyingTo: userMsg.replyingTo,
        rawMessage: userMsg,
      };
    });
  }, [messages, userId]);


  const hasInitialScrolled = useRef(false);
  const isScrolling = useRef(false);

  const smoothScrollToBottom = useCallback((animated = true) => {
    if (isScrolling.current) return;

    // Use native method for smoother/standard behavior
    scrollViewRef.current?.scrollToEnd({ animated });
  }, []);

  // Removed the basic useEffect that called scrollToEnd
  // Scrolling is now handled in onContentSizeChange

  useEffect(() => {
    const currentMessageIds = new Set(messages.map(msg => msg.content.id));
    const refsToDelete: string[] = [];

    messageRefs.current.forEach((_, id) => {
      if (!currentMessageIds.has(id)) {
        refsToDelete.push(id);
      }
    });

    refsToDelete.forEach(id => messageRefs.current.delete(id));
  }, [messages, messageRefs]);

  return (
    <GestureDetector gesture={nativeScrollGesture}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onLayout={() => {
          // Layout references removed
        }}
        onContentSizeChange={() => {
          // Auto-scroll ONLY on initial load
          if (messages.length > 0 && !hasInitialScrolled.current) {
            hasInitialScrolled.current = true;
            // Use a small delay to ensure layout is stable
            setTimeout(() => {
              smoothScrollToBottom(false); // Immediate scroll for first load
            }, 100);
          }
        }}
        onScroll={() => {
          // Scroll tracking removed
        }}
        scrollEventThrottle={16}
      >
        {transformedMessages.map((msg) => (
          <MessageItem
            key={msg.id}
            msg={msg}
            onReply={onReply}
            onImagePress={(imageUrl) => {
              console.log("🖼️ MessageList onImagePress called:", imageUrl);
              onImagePress(imageUrl);
            }}
            onLinkPress={onLinkPress}
            scrollToMessage={handleScrollToMessage}
            messageRefs={messageRefs}
            navigateToProfile={navigateToProfile}
            scrollGesture={nativeScrollGesture}
          />
        ))}
        {isLoadingMore && (
          <View style={styles.loadingFooter}>
            <ActivityIndicator size="small" color="#888" />
            <Text style={styles.loadingText}>Fetching newer chats...</Text>
          </View>
        )}
      </ScrollView>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  loadingFooter: {
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#888',
  },
});