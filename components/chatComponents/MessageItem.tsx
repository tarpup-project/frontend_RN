
import { CachedMessageImage } from "@/components/CachedMessageImage";
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
  groupId?: string;
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
    file?: {
      data: string;
      name: string;
      size: number;
      ext?: string;
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

  // Helper function to calculate reply reference dimensions based on content
  const getReplyDimensions = (message: string) => {
    const length = message?.length || 0;
    
    if (length <= 20) {
      return { minWidth: "50%", maxWidth: "70%", numberOfLines: 2 };
    } else if (length <= 40) {
      return { minWidth: "60%", maxWidth: "80%", numberOfLines: 2 };
    } else if (length <= 80) {
      return { minWidth: "70%", maxWidth: "90%", numberOfLines: 3 };
    } else {
      return { minWidth: "75%", maxWidth: "95%", numberOfLines: 4 };
    }
  };

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
    replyBackground: {
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
    },
    replyOverlay: {
      backgroundColor: isDark ? "rgba(0, 0, 0, 0.15)" : "rgba(255, 255, 255, 0.3)",
      borderTopRightRadius: 8,
      borderLeftWidth: 2,
      borderLeftColor: "#00D084",
    },
    replyAuthorText: {
      color: isDark ? "#00D084" : "#00A86B",
    },
    replyContentText: {
      color: isDark ? "#d2d0d0ff" : "#f7f3f3ff",
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
                  <CachedMessageImage
                    uri={msg.file.data}
                    messageId={msg.id}
                    groupId={msg.groupId || 'unknown'}
                    style={styles.messageImage}
                    fallbackText="📷"
                    fallbackColor="#666666"
                    onLoad={() => {
                      console.log('📸 Message image loaded:', msg.id);
                    }}
                    onError={() => {
                      console.warn('❌ Failed to load message image:', msg.id);
                    }}
                  />
                </GestureDetector>
              )}

              {/* Unified message container for reply + message */}
              {(msg.replyingTo || msg.text) && (
                <View
                  style={[
                    styles.unifiedMessageBubble,
                    msg.isMe
                      ? dynamicStyles.myMessage
                      : dynamicStyles.theirMessage,
                    msg.file && styles.captionBubble,
                  ]}
                >
                  {msg.replyingTo && (
                    <Pressable
                      style={styles.replyReference}
                      onPress={() => scrollToMessage(msg.replyingTo!.content.id)}
                    >
                      {/* Subtle overlay for reply section */}
                      <View style={[StyleSheet.absoluteFill, dynamicStyles.replyOverlay]} />
                      <View style={styles.replyContent}>
                        <View style={styles.replyTextSection}>
                          <Text
                            style={[styles.replyAuthor, dynamicStyles.replyAuthorText]}
                          >
                            {msg.replyingTo.sender.fname || "Unknown User"}
                          </Text>
                          <Text
                            style={[styles.replyText, dynamicStyles.replyContentText]}
                            numberOfLines={getReplyDimensions(msg.replyingTo.content.message).numberOfLines}
                          >
                            {msg.replyingTo.content.message || "[Message not available]"}
                          </Text>
                        </View>
                        {msg.replyingTo.file && (
                          <CachedMessageImage
                            uri={msg.replyingTo.file.data}
                            messageId={msg.replyingTo.content.id}
                            groupId={msg.groupId || 'unknown'}
                            style={styles.replyImage}
                            fallbackText="📷"
                            fallbackColor="#666666"
                          />
                        )}
                      </View>
                    </Pressable>
                  )}

                  {msg.text && (
                    <View style={styles.messageTextContainer}>
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
    maxWidth: "85%",
    flexShrink: 1,
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
    maxWidth: "100%",
    gap: 0,
    flexShrink: 1,
  },
  messageBubble: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    alignItems: 'flex-start'
  },
  unifiedMessageBubble: {
    borderRadius: 15,
    overflow: 'hidden',
    alignItems: 'flex-start',
    minWidth: "50%",
    maxWidth: "95%",
  },
  messageTextContainer: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  messageBubbleWithReply: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    paddingTop: 8,
  },
  captionBubble: {
    marginTop: 0,
  },
  replyAuthor: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 3,
  },
  replyText: {
    fontSize: 13,
    lineHeight: 18,
    flexWrap: "wrap",
    flexShrink: 1,
    textAlign: "left",
    opacity: 0.9,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  replyImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginLeft: 8,
  },
  myReplyReference: {
   // alignSelf: "flex-end",
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
    textAlign: "left"
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
    paddingLeft: 12,
    paddingRight: 10,
    paddingTop: 8,
    paddingBottom: 6,
    borderLeftWidth: 2,
    borderLeftColor: "#00D084",
    width: "100%",
    position: 'relative',
  },
  replyContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  replyTextSection: {
    flex: 1,
    marginRight: 8,
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
