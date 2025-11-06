// import { useTheme } from "@/app/contexts/ThemeContext";
// import Header from "@/components/Header";
// import PreviewModeBanner from "@/components/PreviewModeBanner";
// import { Text } from "@/components/Themedtext";
// import { Ionicons } from "@expo/vector-icons";
// import { router, useLocalSearchParams } from "expo-router";
// import {
//   BookOpen,
//   Car,
//   Gamepad2,
//   Gift,
//   Zap,
//   Heart,
//   Home,
//   PartyPopper,
//   ShoppingBag,
// } from "lucide-react-native";
// import { Pressable, ScrollView, StyleSheet, View } from "react-native";

// const CategoryMatches = () => {
//   const { categoryId } = useLocalSearchParams();
//   const { isDark } = useTheme();

//   const dynamicStyles = {
//     container: {
//       backgroundColor: isDark ? "#000000" : "#FFFFFF",
//     },
//     text: {
//       color: isDark ? "#FFFFFF" : "#000000",
//     },
//     subtitle: {
//       color: isDark ? "#CCCCCC" : "#666666",
//     },
//     card: {
//       backgroundColor: isDark ? "#000000" : "#FFFFFF",
//       borderColor: isDark ? "#333333" : "#E0E0E0",
//     },
//     badge: {
//       backgroundColor: isDark ? "#1a1a1a" : "#f0f0f0",
//     },
//   };

//   const categoryMap: any = {
//     "1": {
//       name: "Rides",
//       icon: Car,
//       color: "#eff6ff",
//       iconColor: "#3b82f6",
//     },
//     "2": {
//       name: "Roommates",
//       icon: Home,
//       color: "#D5F5E3",
//       iconColor: "#10b981",
//     },
//     "3": {
//       name: "Marketplace",
//       icon: ShoppingBag,
//       color: "#faf5ff",
//       iconColor: "#a275fa",
//     },
//     "4": {
//       name: "Sports and Games",
//       icon: Gamepad2,
//       color: "#fff7ed",
//       iconColor: "#f3917c",
//     },
//     "5": {
//       name: "Dating",
//       icon: Heart,
//       color: "#fcf2f8",
//       iconColor: "#f3917c",
//     },
//     "6": {
//       name: "Study Groups",
//       icon: BookOpen,
//       color: "#eef2fe",
//       iconColor: "#f3917c",
//     },
//     "7": {
//       name: "Giveaways",
//       icon: Gift,
//       color: "#f0fdfa",
//       iconColor: "#55ab9f",
//     },
//     "8": {
//       name: "Party",
//       icon: PartyPopper,
//       color: "#ebfcf5",
//       iconColor: "#55ab9f",
//     },
//   };

//   const category = categoryMap[categoryId as string];
//   const IconComponent = category?.icon;

//   const matches = [
//     {
//       id: 1,
//       name: "John",
//       partner: "James",
//       destination: "Shreveport",
//       time: "2 minutes ago",
//       isNew: true,
//     },
//     {
//       id: 2,
//       name: "Sarah",
//       partner: "Lisa",
//       destination: "Baton Rouge",
//       time: "8 minutes ago",
//       isNew: false,
//     },
//     {
//       id: 3,
//       name: "Mike",
//       partner: "David",
//       destination: "New Orleans",
//       time: "15 minutes ago",
//       isNew: false,
//     },
//     {
//       id: 4,
//       name: "Anna",
//       partner: "Emma",
//       destination: "Lafayette",
//       time: "2h minutes ago",
//       isNew: false,
//     },
//     {
//       id: 5,
//       name: "Chris",
//       partner: "Alex",
//       destination: "Monroe",
//       time: "3h minutes ago",
//       isNew: false,
//     },
//     {
//       id: 6,
//       name: "Jessica",
//       partner: "Kevin",
//       destination: "Alexandria",
//       time: "5h minutes ago",
//       isNew: false,
//     },
//   ];

//   return (
//     <View style={[styles.container, dynamicStyles.container]}>
//       <View style={{ gap: 12 }}>
//         <Header />
//         <PreviewModeBanner />
//       </View>
//       {/* Header */}
//       <View style={styles.header}>
//         <Pressable onPress={() => router.back()} style={styles.backButton}>
//           <Ionicons
//             name="arrow-back"
//             size={24}
//             color={dynamicStyles.text.color}
//           />
//           <Text style={[styles.backText, dynamicStyles.text]}>Back</Text>
//         </Pressable>
//       </View>

//       {/* Category Title */}
//       <View style={styles.titleSection}>
//         <View style={styles.titleContent}>
//           <Text style={[styles.categoryTitle, dynamicStyles.text]}>
//             {category?.name}
//           </Text>
//           <Text style={[styles.matchCount, dynamicStyles.subtitle]}>
//             {matches.length} recent matches
//           </Text>
//         </View>
//       </View>

//       {/* Matches List */}
//       <ScrollView style={styles.matchesList}>
//         {matches.map((match) => (
//           <Pressable
//             key={match.id}
//             style={[styles.matchCard, dynamicStyles.card]}
//             onPress={() => console.log(`Navigate to match ${match.id}`)}
//           >
//             <View style={styles.matchHeader}>
//               <View style={styles.namesRow}>
//                 <Text style={[styles.matchName, dynamicStyles.text]}>
//                   {match.name}
//                 </Text>
//                 <Zap color="#008000" size={12} />
//                 <Text style={[styles.matchName, dynamicStyles.text]}>
//                   {match.partner}
//                 </Text>
//                 {match.isNew && (
//                   <View style={styles.newBadge}>
//                     <Text style={styles.newBadgeText}>NEW</Text>
//                   </View>
//                 )}
//               </View>
//             </View>
//             <View style={styles.matchDetails}>
//               <Ionicons
//                 name="location-outline"
//                 size={14}
//                 color={dynamicStyles.subtitle.color}
//               />
//               <Text style={[styles.destination, dynamicStyles.text]}>
//                 to {match.destination}
//               </Text>
//             </View>
//             <View style={styles.matchFooter}>
//               <Ionicons
//                 name="time-outline"
//                 size={14}
//                 color={dynamicStyles.subtitle.color}
//               />
//               <Text style={[styles.timeText, dynamicStyles.subtitle]}>
//                 {match.time}
//               </Text>
//             </View>
//           </Pressable>
//         ))}
//       </ScrollView>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   header: {
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//   },
//   backButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//   },
//   backText: {
//     fontSize: 16,
//   },
//   titleSection: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 16,
//     paddingVertical: 16,
//     gap: 12,
//   },
//   categoryIcon: {
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   titleContent: {
//     flex: 1,
//   },
//   categoryTitle: {
//     fontSize: 24,
//     fontWeight: "bold",
//     marginBottom: 4,
//   },
//   matchCount: {
//     fontSize: 14,
//   },
//   matchesList: {
//     flex: 1,
//     paddingHorizontal: 16,
//   },
//   matchCard: {
//     padding: 16,
//     borderRadius: 12,
//     borderWidth: 1,
//     marginBottom: 12,
//     gap: 8,
//   },
//   matchHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   namesRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//   },
//   matchName: {
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   newBadge: {
//     backgroundColor: "#f3917c",
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     borderRadius: 6,
//   },
//   newBadgeText: {
//     color: "#FFFFFF",
//     fontSize: 10,
//     fontWeight: "bold",
//   },
//   matchDetails: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 4,
//   },
//   destination: {
//     fontSize: 14,
//   },
//   matchFooter: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 4,
//   },
//   timeText: {
//     fontSize: 12,
//   },
// });

// export default CategoryMatches;




import { useTheme } from "@/app/contexts/ThemeContext";
import { Text } from "@/components/Themedtext";
import { useMatchActions } from "@/hooks/useMatchActions";
import { usePersonalChat } from "@/hooks/usePersonalChat";
import { useAuthStore } from "@/state/authStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

const Chat = () => {
  const { isDark } = useTheme();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);
  const { user } = useAuthStore();

  const {
    messages,
    isLoading,
    isTyping,
    sendMessage,
    markAsRead,
    clearMessages,
  } = usePersonalChat();

  const { handleMatchAction: processMatchAction, isLoading: isMatchLoading } =
    useMatchActions();

  const quickStartOptions = [
    { icon: "car-outline", text: "I need a ride to downtown" },
    { icon: "home-outline", text: "Looking for a roommate" },
    { icon: "people-outline", text: "Want to join a Study group" },
    { icon: "heart-outline", text: "Find a Date" },
    { icon: "book-outline", text: "Need to Sell My textbooks" },
  ];

  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? "#000000" : "#FFFFFF",
    },
    header: {
      backgroundColor: isDark ? "#000000" : "#FFFFFF",
      borderBottomColor: isDark ? "#333333" : "#E0E0E0",
    },
    text: {
      color: isDark ? "#FFFFFF" : "#000000",
    },
    subtitle: {
      color: isDark ? "#CCCCCC" : "#666666",
    },
    quickStartButton: {
      backgroundColor: isDark ? "#000000" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    userMessage: {
      backgroundColor: isDark ? "#FFFFFF" : "#000000",
    },
    userMessageText: {
      color: isDark ? "#000000" : "#FFFFFF",
    },
    aiMessageContainer: {
      backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5",
    },
    matchButton: {
      backgroundColor: isDark ? "#000000" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
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
  };

  const handleClose = () => {
    markAsRead();
    router.back();
  };

  const handleQuickStartPress = (text: string) => {
    sendMessage(text);
  };

  const handleSend = () => {
    if (message.trim()) {
      sendMessage(message.trim());
      setMessage("");
    }
  };

  const onMatchAction = async (
    matchId: string,
    action: "private" | "public" | "decline"
  ) => {
    const result = await processMatchAction(matchId, action);

    if (result.status === "ok") {
      if (action !== "decline" && result.groupId) {
        router.push(`/group-chat/${result.groupId}`);
      }
    } else {
      Alert.alert("Error", result.message || "Failed to process action");
    }
  };

  const renderMatchButtons = (matchId: string) => (
    <View style={styles.matchButtonsContainer}>
      <View style={styles.matchButtonRow}>
        <Pressable
          style={[
            styles.matchButton,
            dynamicStyles.matchButton,
            { backgroundColor: "#3B82F6" },
          ]}
          onPress={() => onMatchAction(matchId, "private")}
          disabled={isMatchLoading}
        >
          <Text style={[styles.matchButtonText, { color: "#FFFFFF" }]}>
            Private Chat
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.matchButton,
            dynamicStyles.matchButton,
            { backgroundColor: "#10B981" },
          ]}
          onPress={() => onMatchAction(matchId, "public")}
          disabled={isMatchLoading}
        >
          <Text style={[styles.matchButtonText, { color: "#FFFFFF" }]}>
            Create Group
          </Text>
        </Pressable>
      </View>
      <Pressable
        style={[
          styles.matchButton,
          dynamicStyles.matchButton,
          { borderColor: "#EF4444" },
        ]}
        onPress={() => onMatchAction(matchId, "decline")}
        disabled={isMatchLoading}
      >
        <Text style={[styles.matchButtonText, { color: "#EF4444" }]}>
          Decline
        </Text>
      </Pressable>
    </View>
  );

  const parseMessageForActions = (content: string) => {
    const matchButtonPattern = /<MatchButton[^>]*id="([^"]*)"[^>]*\/>/;
    const match = content.match(matchButtonPattern);

    if (match) {
      const matchId = match[1];
      const textContent = content.replace(matchButtonPattern, "").trim();

      return {
        hasMatchButtons: true,
        matchId,
        textContent,
      };
    }

    return {
      hasMatchButtons: false,
      textContent: content,
    };
  };

  const renderMessage = (msg: any, index: number) => {
    const isUser = msg.sender === "user";
    const messageData = parseMessageForActions(msg.content);

    return (
      <View
        key={msg.id || index}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.aiMessageContainer,
        ]}
      >
        {!isUser && (
          <View style={styles.aiAvatarContainer}>
            <View style={styles.aiAvatar}>
              <Ionicons name="sparkles" size={16} color="#FFFFFF" />
            </View>
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isUser
              ? [styles.userMessage, dynamicStyles.userMessage]
              : dynamicStyles.aiMessageContainer,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser ? dynamicStyles.userMessageText : dynamicStyles.text,
            ]}
          >
            {messageData.textContent}
          </Text>

          {messageData.hasMatchButtons &&
            messageData.matchId &&
            renderMatchButtons(messageData.matchId)}
        </View>
      </View>
    );
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, isTyping]);

  useEffect(() => {
    markAsRead();
  }, []);

  if (isLoading) {
    return (
      <View
        style={[styles.container, dynamicStyles.container, styles.centered]}
      >
        <ActivityIndicator size="large" color={dynamicStyles.text.color} />
        <Text style={[styles.loadingText, dynamicStyles.text]}>
          Loading chat...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, dynamicStyles.container]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, dynamicStyles.header]}>
        <Text style={[styles.headerTitle, dynamicStyles.text]}>
          Chat with TarpAI
        </Text>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.clearButton}
            onPress={() => {
              Alert.alert(
                "Clear Chat",
                "This will delete all messages. Are you sure?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Clear",
                    style: "destructive",
                    onPress: clearMessages,
                  },
                ]
              );
            }}
          >
            <Ionicons
              name="trash-outline"
              size={20}
              color={dynamicStyles.text.color}
            />
          </Pressable>
          <Pressable style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color={dynamicStyles.text.color} />
          </Pressable>
        </View>
      </View>

      {/* Messages ScrollView */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 ? (
          <View style={styles.quickStartSection}>
            <Text style={[styles.sectionTitle, dynamicStyles.text]}>
              Quick Start
            </Text>
            <View style={styles.quickStartGrid}>
              {quickStartOptions.map((option, index) => (
                <Pressable
                  key={index}
                  style={[
                    styles.quickStartButton,
                    dynamicStyles.quickStartButton,
                  ]}
                  onPress={() => handleQuickStartPress(option.text)}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={14}
                    color={dynamicStyles.text.color}
                  />
                  <Text style={[styles.quickStartText, dynamicStyles.text]}>
                    {option.text}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.aiMessageSection}>
              <View style={styles.aiAvatarContainer}>
                <View style={styles.aiAvatar}>
                  <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                </View>
              </View>
              <View
                style={[
                  styles.aiMessageContainer,
                  dynamicStyles.aiMessageContainer,
                ]}
              >
                <Text style={[styles.aiMessageText, dynamicStyles.text]}>
                  Hi! I'm TarpAI, your smart campus connection assistant. I help
                  you find compatible students based on your needs. What would
                  you like help with today?
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <>
            {messages.map(renderMessage)}
            {isTyping && (
              <View style={styles.typingContainer}>
                <View style={styles.aiAvatarContainer}>
                  <View style={styles.aiAvatar}>
                    <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                  </View>
                </View>
                <View
                  style={[
                    styles.typingBubble,
                    dynamicStyles.aiMessageContainer,
                  ]}
                >
                  <ActivityIndicator
                    size="small"
                    color={dynamicStyles.text.color}
                  />
                  <Text style={[styles.typingText, dynamicStyles.subtitle]}>
                    TarpAI is typing...
                  </Text>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Input Section - Now properly positioned */}
      <View style={styles.inputSection}>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, dynamicStyles.input]}
            placeholder="Tell TarpAI what you need..."
            placeholderTextColor={isDark ? "#666666" : "#999999"}
            value={message}
            onChangeText={setMessage}
            multiline
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
            returnKeyType="send"
          />
          <Pressable
            style={[
              styles.sendButton, 
              dynamicStyles.sendButton,
              !message.trim() && styles.sendButtonDisabled
            ]}
            onPress={handleSend}
            disabled={!message.trim()}
          >
            <Ionicons
              name="send"
              size={20}
              color={dynamicStyles.sendIcon.color}
            />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  clearButton: {
    padding: 8,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 20, // Reduced padding since input is no longer absolute
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
  },
  quickStartSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  quickStartGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 16,
  },
  quickStartButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: "48%",
    flexBasis: "48%",
  },
  quickStartText: {
    fontSize: 11,
    flex: 1,
  },
  aiMessageSection: {
    flexDirection: "row",
    gap: 8,
  },
  aiAvatarContainer: {
    paddingTop: 4,
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#6B46C1",
    justifyContent: "center",
    alignItems: "center",
  },
  aiMessageContainer: {
    padding: 12,
    borderRadius: 12,
    flex: 1,
  },
  aiMessageText: {
    fontSize: 12,
    lineHeight: 18,
  },
  messageContainer: {
    marginVertical: 8,
    flexDirection: "row",
    gap: 8,
  },
  userMessageContainer: {
    justifyContent: "flex-end",
    flexDirection: "row-reverse",
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 12,
  },
  userMessage: {
    alignSelf: "flex-end",
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  matchButtonsContainer: {
    marginTop: 12,
    gap: 8,
  },
  matchButtonRow: {
    flexDirection: "row",
    gap: 8,
  },
  matchButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    flex: 1,
  },
  matchButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  typingContainer: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 8,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  typingText: {
    fontSize: 12,
    fontStyle: "italic",
  },
  inputSection: {
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 24, // Safe area for iPhone
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 50,
    maxHeight: 100,
    borderRadius: 25,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default Chat;