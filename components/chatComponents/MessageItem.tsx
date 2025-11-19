import { useTheme } from "@/contexts/ThemeContext";
import { Reply } from "lucide-react-native";
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
                <Reply
                  size={18}
                  color={dynamicStyles.subtitle.color}
                  strokeWidth={2.5}
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

            <View
              style={[
                styles.messageBubble,
                msg.isMe ? dynamicStyles.myMessage : dynamicStyles.theirMessage,
              ]}
            >
              {msg.replyingTo && (
                <Pressable
                  style={styles.replyReference}
                  onPress={() => scrollToMessage(msg.replyingTo!.content.id)}
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
                <GestureDetector
                  gesture={Gesture.Tap().onEnd(() => {
                    runOnJS(onImagePress)(msg.file!.data);
                  })}
                >
                  <View>
                    <Image
                      source={{ uri: msg.file.data }}
                      style={styles.messageImage}
                    />
                  </View>
                </GestureDetector>
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

            {!msg.isMe && (
              <Pressable
                onPress={() => onReply(msg.rawMessage)}
                style={styles.replyButton}
              >
                <Reply
                  size={18}
                  color={dynamicStyles.subtitle.color}
                  strokeWidth={2.5}
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
