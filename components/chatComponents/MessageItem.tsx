
import { CachedImage } from "@/components/CachedImage";
import { CachedMessageImage } from "@/components/CachedMessageImage";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Hyperlink from "react-native-hyperlink";
import Animated, {
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from "react-native-reanimated";

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

  // Animation values for swipe-to-reply
  const translateX = useSharedValue(0);
  const replyIconOpacity = useSharedValue(0);
  const replyIconScale = useSharedValue(0.7);

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
    .activeOffsetX(msg.isMe ? [-20, 10000] : [-10000, 20]) // Only allow swipe in correct direction
    .failOffsetY([-30, 30]) // Prevent vertical scrolling interference
    .onUpdate((event) => {
      const { translationX } = event;

      // Define max swipe distance and direction
      const maxSwipe = 70;
      const isCorrectDirection = msg.isMe ? translationX < 0 : translationX > 0;

      if (isCorrectDirection) {
        // Smooth constraint with resistance at the end
        let clampedTranslation;
        const absTranslation = Math.abs(translationX);

        if (absTranslation <= maxSwipe) {
          clampedTranslation = translationX;
        } else {
          // Add resistance beyond max swipe
          const resistance = 0.3;
          const excess = absTranslation - maxSwipe;
          const resistedExcess = excess * resistance;
          clampedTranslation = msg.isMe
            ? -(maxSwipe + resistedExcess)
            : (maxSwipe + resistedExcess);
        }

        translateX.value = clampedTranslation;

        // Smooth icon animation based on progress
        const progress = Math.min(Math.abs(clampedTranslation) / maxSwipe, 1);
        replyIconOpacity.value = interpolate(
          progress,
          [0, 0.2, 0.8, 1],
          [0, 0.3, 0.9, 1],
          Extrapolate.CLAMP
        );
        replyIconScale.value = interpolate(
          progress,
          [0, 0.5, 1],
          [0.7, 1, 1.1],
          Extrapolate.CLAMP
        );
      } else {
        // Prevent movement in wrong direction
        translateX.value = 0;
        replyIconOpacity.value = 0;
        replyIconScale.value = 0.7;
      }
    })
    .onEnd((event) => {
      const { translationX, velocityX } = event;
      const swipeThreshold = 50;
      const velocityThreshold = 200;

      // Check if swipe meets the threshold for triggering reply
      const absTranslation = Math.abs(translationX);
      const absVelocity = Math.abs(velocityX);
      const isCorrectDirection = msg.isMe ? translationX < 0 : translationX > 0;

      const shouldTriggerReply =
        isCorrectDirection &&
        (absTranslation > swipeThreshold || absVelocity > velocityThreshold) &&
        msg.rawMessage &&
        onReply;

      if (shouldTriggerReply) {
        // Trigger reply action
        runOnJS(onReply)(msg.rawMessage);
      }

      // Smooth return to original position without bounce
      translateX.value = withTiming(0, { duration: 200 });
      replyIconOpacity.value = withTiming(0, { duration: 200 });
      replyIconScale.value = withTiming(0.7, { duration: 200 });
    });

  // Animated styles for the message container
  const animatedMessageStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  // Animated styles for the reply icon
  const animatedReplyIconStyle = useAnimatedStyle(() => {
    return {
      opacity: replyIconOpacity.value,
      transform: [{ scale: replyIconScale.value }],
    };
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
        <View style={styles.swipeContainer}>
          {/* Reply icon that appears during swipe */}
          <Animated.View
            style={[
              styles.replyIconContainer,
              msg.isMe ? styles.replyIconLeft : styles.replyIconRight,
              animatedReplyIconStyle
            ]}
          >
            <View style={[
              styles.replyIconBackground,
              { backgroundColor: isDark ? "#333" : "#E5E5E5" }
            ]}>
              <Ionicons
                name="arrow-undo-outline"
                size={20}
                color={isDark ? "#00D084" : "#00A86B"}
              />
            </View>
          </Animated.View>

          {/* Animated message content */}
          <Animated.View style={[styles.messageContainer, animatedMessageStyle]}>
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

              {/* Avatar removed for cleaner message UI */}

              <View style={styles.messageContent}>
                {!msg.isMe && (
                  <Text style={[styles.senderName, dynamicStyles.subtitle]}>
                    {msg.sender}
                  </Text>
                )}

                {/* Unified message container for image, reply + message */}
                {(msg.file || msg.replyingTo || msg.text) && (
                  <View
                    style={[
                      styles.unifiedMessageBubble,
                      // When there's an image with text, constrain width to image
                      msg.file && msg.text && styles.imageConstrainedBubble,
                      msg.isMe
                        ? dynamicStyles.myMessage
                        : dynamicStyles.theirMessage,
                    ]}
                  >
                    {/* 1. Reply Reference (Moved to Top) */}
                    {msg.replyingTo && (
                      <Pressable
                        style={[
                          styles.replyReference,
                          // msg.file && styles.replyReferenceWithImage, // No longer needed as reply is top
                        ]}
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

                    {/* 2. Message Image (Moved to Middle) */}
                    {msg.file && (
                      <GestureDetector
                        gesture={Gesture.Tap().onEnd(() => {
                          runOnJS(onImagePress)(msg.file!.data);
                        })}
                      >
                        <View collapsable={false}>
                          <CachedMessageImage
                            uri={msg.file.data}
                            messageId={msg.id}
                            groupId={msg.groupId || 'unknown'}
                            style={[
                              styles.messageImage,
                              styles.messageImageInBubble,
                              // If replying to something, remove top radius so it sits flush under reply
                              msg.replyingTo && { borderTopLeftRadius: 0, borderTopRightRadius: 0 },
                            ]}
                            fallbackText="📷"
                            fallbackColor="#666666"
                            onLoad={() => {
                              console.log('📸 Message image loaded:', msg.id);
                            }}
                            onError={() => {
                              console.warn('❌ Failed to load message image:', msg.id);
                            }}
                          />
                        </View>
                      </GestureDetector>
                    )}

                    {/* 3. Message Text (Bottom) */}
                    {msg.text && (
                      <View style={[
                        styles.messageTextContainer,
                        msg.file && styles.messageTextWithImage,
                      ]}>
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
          </Animated.View>
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
    width: "100%", // Take full width of the bubble
  },
  messageBubbleWithReply: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    paddingTop: 8,
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
  messageImageInBubble: {
    borderRadius: 0,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    marginBottom: 0,
  },
  messageTextWithImage: {
    paddingTop: 0,
  },
  replyReferenceWithImage: {
    paddingTop: 0,
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
  imageConstrainedBubble: {
    maxWidth: 200, // Match the image width
    minWidth: 200, // Ensure consistent width
  },
  swipeContainer: {
    position: 'relative',
  },
  messageContainer: {
    width: '100%',
  },
  replyIconContainer: {
    position: 'absolute',
    top: '50%',
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
  },
  replyIconLeft: {
    left: 10,
    transform: [{ translateY: -20 }],
  },
  replyIconRight: {
    right: 10,
    transform: [{ translateY: -20 }],
  },
  replyIconBackground: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
