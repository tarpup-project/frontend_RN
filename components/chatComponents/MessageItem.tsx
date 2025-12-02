
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Hyperlink from "react-native-hyperlink";
import { runOnJS } from "react-native-reanimated";

interface MessageData {
  id: string;
  sender: string;
  text: string;
  time: string;
  isMe: boolean;
  isAlert?: boolean;
  avatar: string;
  file?: {
    data: string;
    name: string;
    size: number;
  };
  replyingTo?: {
    content: {
      id: string;
      message: string;
    };
    sender: {
      fname: string;
    };
  };
  rawMessage?: any;
}

interface MessageItemProps {
  msg: MessageData;
  onReply: (rawMessage: any) => void;
  onImagePress: (imageUrl: string) => void;
  onLinkPress: (url: string) => void;
  scrollToMessage: (messageId: string) => void;
  messageRefs: React.MutableRefObject<Map<string, any>>;
  navigateToProfile: (userId: string) => void;
  scrollGesture: any;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  msg,
  onReply,
  onImagePress,
  onLinkPress,
  scrollToMessage,
  messageRefs,
  navigateToProfile,
  scrollGesture,
}) => {
  const { isDark } = useTheme();

  const dynamicStyles = {
    myMessage: {
      backgroundColor: isDark ? "#262626" : "#262626",
    },
    myMessageText: {
      color: isDark ? "#FFFFFF" : "#FFFFFF",
    },
    theirMessage: {
      backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5",
    },
    theirMessageText: {
      color: isDark ? "#FFFFFF" : "#000000",
    },
    subtitle: {
      color: isDark ? "#CCCCCC" : "#666666",
    },
  };

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

  if (msg.isAlert) {
    return (
      <View
        ref={(ref) => {
          if (ref) {
            messageRefs.current.set(msg.id, ref);
          } else {
            messageRefs.current.delete(msg.id);
          }
        }}
        style={styles.messageWrapper}
      >
        <View style={styles.alertContainer}>
          <Text style={[styles.alertText, dynamicStyles.subtitle]}>
            {msg.text}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      ref={(ref) => {
        if (ref) {
          messageRefs.current.set(msg.id, ref);
        } else {
          messageRefs.current.delete(msg.id);
        }
      }}
      style={styles.messageWrapper}
    >
      <GestureDetector gesture={swipeGesture}>
        <View>
          <View style={[styles.messageRow, msg.isMe && styles.myMessageRow]}>
            {msg.isMe && (
              <Pressable
                onPress={() => onReply(msg.rawMessage)}
                style={styles.replyButton}
              >
                <Ionicons
                  name="arrow-undo-outline"
                  size={18}
                  color={dynamicStyles.subtitle.color}
                  style={{ opacity: 0.8 }}
                />
              </Pressable>
            )}

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

            <View style={styles.messageContent}>
              {msg.replyingTo && (
                <Pressable
                  style={[
                    styles.replyReference,
                    msg.isMe
                      ? dynamicStyles.myMessage
                      : dynamicStyles.theirMessage,
                    msg.isMe && styles.myReplyReference,
                  ]}
                  onPress={() => scrollToMessage(msg.replyingTo!.content.id)}
                >
                  <View style={styles.replyContent}>
                    <Text
                      style={[
                        styles.replyAuthor,
                        msg.isMe
                          ? dynamicStyles.myMessageText
                          : dynamicStyles.theirMessageText,
                      ]}
                    >
                      {msg.replyingTo.sender.fname}
                    </Text>
                    <Text
                      style={[styles.replyText, dynamicStyles.subtitle]}
                      numberOfLines={2}
                    >
                      {msg.replyingTo.content.message}
                    </Text>
                  </View>
                </Pressable>
              )}

              {!msg.isMe && (
                <Text style={[styles.senderName, dynamicStyles.subtitle]}>
                  {msg.sender}
                </Text>
              )}

              {msg.file && (
                <GestureDetector
                  gesture={Gesture.Tap().onEnd(() => {
                    runOnJS(onImagePress)(msg.file!.data);
                  })}
                >
                  <Image
                    source={{ uri: msg.file.data }}
                    style={styles.messageImage}
                  />
                </GestureDetector>
              )}

              {msg.text && (
                <View
                  style={[
                    styles.messageBubble,
                    msg.isMe
                      ? dynamicStyles.myMessage
                      : dynamicStyles.theirMessage,
                    msg.file && styles.captionBubble,
                  ]}
                >
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

            {!msg.isMe && (
              <Pressable
                onPress={() => onReply(msg.rawMessage)}
                style={styles.replyButton}
              >
                <Ionicons
                  name="arrow-undo-outline"
                  size={18}
                  color={dynamicStyles.subtitle.color}
                  style={{ opacity: 0.8 }}
                />
              </Pressable>
            )}
          </View>

          <Text
            style={[
              styles.messageTimeBelow,
              dynamicStyles.subtitle,
              msg.isMe && styles.myMessageTime,
            ]}
          >
            {msg.time}
          </Text>
        </View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  messageWrapper: {
    marginVertical: 4,
  },
  messageRow: {
    flexDirection: "row",
    gap: 8,
    maxWidth: "65%",
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
  avatarText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  messageContent: {
    width: "80%",
    gap: 6,
  },
  messageBubble: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    alignSelf: "flex-start",
  },
  captionBubble: {
    marginTop: 0,
  },
  replyContent: {
    flex: 1,
  },
  replyAuthor: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 2,
  },
  replyText: {
    fontSize: 12,
    lineHeight: 16,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  myReplyReference: {
    alignSelf: "flex-end",
  },
  senderName: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    marginLeft: 4,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 10,
    alignSelf: "flex-end",
    marginTop: 4,
  },
  messageTimeBelow: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  myMessageTime: {
    alignSelf: "flex-end",
  },
  replyReference: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#007AFF",
    borderRadius: 8,
  },
  replyButton: {
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingBottom: 12,
  },
  myReplyButton: {
    marginLeft: "auto",
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
});
