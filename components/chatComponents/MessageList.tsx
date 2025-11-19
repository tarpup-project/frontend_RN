import { MessageType, UserMessage } from "@/types/groups";
import { timeAgo } from "@/utils/timeUtils";
import React, { useEffect, useMemo, useRef } from "react";
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

  // Memoize the transformed messages to prevent recalculation on every render
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

  // Auto-scroll to end when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Clean up message refs when messages change
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
            scrollToMessage={scrollToMessage}
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