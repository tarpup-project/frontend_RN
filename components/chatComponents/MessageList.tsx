import { MessageType, UserMessage } from "@/types/groups";
import { timeAgo } from "@/utils/timeUtils";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { ScrollView, StyleSheet } from "react-native";
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


  const contentHeight = useRef(0);
  const layoutHeight = useRef(0);
  const msgListScrollY = useRef(0);
  const isScrolling = useRef(false);

  const smoothScrollToBottom = useCallback(() => {
    if (isScrolling.current) return;

    const maxOffset = contentHeight.current - layoutHeight.current;
    if (maxOffset < 0) return;

    const startY = msgListScrollY.current;
    const distance = maxOffset - startY;

    // If distance is small, just jump
    if (distance < 50) {
      scrollViewRef.current?.scrollTo({ y: maxOffset, animated: true });
      return;
    }

    const duration = 1500; // 1.5 seconds duration (slower than default)
    const startTime = Date.now();
    isScrolling.current = true;

    const animateScroll = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (easeOutQuart)
      const ease = 1 - Math.pow(1 - progress, 4);

      const currentY = startY + (distance * ease);

      scrollViewRef.current?.scrollTo({ y: currentY, animated: false });

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      } else {
        isScrolling.current = false;
      }
    };

    requestAnimationFrame(animateScroll);
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
        onLayout={(e) => {
          layoutHeight.current = e.nativeEvent.layout.height;
        }}
        onContentSizeChange={(w, h) => {
          contentHeight.current = h;
          // Auto-scroll when content size changes (new messages)
          // Only scroll if we were already near bottom or it's the first load
          if (messages.length > 0) {
            // Use a small delay to ensure layout is stable
            setTimeout(() => {
              smoothScrollToBottom();
            }, 100);
          }
        }}
        onScroll={(e) => {
          msgListScrollY.current = e.nativeEvent.contentOffset.y;
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
});