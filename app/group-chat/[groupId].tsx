import { Text } from "@/components/Themedtext";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useColorScheme,
  View,
} from "react-native";

const GroupChat = () => {
  const theme = useColorScheme() || "light";
  const isDark = theme === "dark";
  const router = useRouter();
  const { groupId } = useLocalSearchParams();
  const [message, setMessage] = useState("");

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

  // Mock group data - replace with API call later
  const groupData: any = {
    "1": {
      name: "Downtown Ride Group",
      members: 4,
      rating: "92%",
      avatarColors: ["#FF6B9D", "#4A90E2", "#9C27B0"],
    },
    "2": {
      name: "Organic Chemistry Study Circle",
      members: 2,
      rating: "88%",
      avatarColors: ["#FF6B9D", "#4A90E2"],
    },
    "3": {
      name: "Spring Housing Group",
      members: 4,
      rating: "95%",
      avatarColors: ["#FF6B9D", "#4A90E2", "#9C27B0"],
    },
    "4": {
      name: "Friday Night Basketball",
      members: 8,
      rating: "95%",
      avatarColors: ["#FF6B9D", "#4A90E2", "#9C27B0", "#00D084"],
    },
    "5": {
      name: "Campus Events Squad",
      members: 6,
      rating: "91%",
      avatarColors: ["#FF6B9D", "#4A90E2", "#9C27B0"],
    },
  };

  const group = groupData[groupId as string];

  // Mock messages - replace with API call later
  const messages = [
    {
      id: 1,
      sender: "Sarah M.",
      text: "I can drive! Planning to leave around 7 PM from the campus entrance",
      time: "4s min ago",
      isMe: false,
      avatar: "#FF6B9D",
    },
    {
      id: 2,
      sender: "You",
      text: "Perfect! I need a ride back around 11 PM, is that okay?",
      time: "Just now",
      isMe: true,
    },
    {
      id: 3,
      sender: "Lisa K.",
      text: "I need a ride back too! Can split gas money",
      time: "3s min ago",
      isMe: false,
      avatar: "#4A90E2",
    },
    {
      id: 4,
      sender: "Mike R.",
      text: "Sounds good! I'll pick everyone up at 7. Meet at the student union?",
      time: "3s min ago",
      isMe: false,
      avatar: "#9C27B0",
    },
    {
      id: 5,
      sender: "You",
      text: "Works for me! See you there 👍",
      time: "2s min ago",
      isMe: true,
    },
  ];

  const handleBack = () => {
    router.back();
  };

  const handleSend = () => {
    if (message.trim()) {
      console.log("Send message:", message);
      setMessage("");
    }
  };

  const handleGroupInfo = () => {
    console.log("Open group info");
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, dynamicStyles.container]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, dynamicStyles.header]}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={dynamicStyles.text.color}
          />
        </Pressable>

        <Pressable style={styles.headerInfo} onPress={handleGroupInfo}>
          <View style={styles.avatarsContainer}>
            {group?.avatarColors
              .slice(0, 3)
              .map((color: string, index: number) => (
                <View
                  key={index}
                  style={[
                    styles.headerAvatar,
                    { backgroundColor: color },
                    index > 0 && { marginLeft: -8 },
                  ]}
                />
              ))}
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.groupName, dynamicStyles.text]}>
              {group?.name}
            </Text>
            <View style={styles.headerSubtitle}>
              <Text style={[styles.membersCount, dynamicStyles.subtitle]}>
                {group?.members} members
              </Text>
              <View style={styles.dot} />
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={[styles.ratingText, dynamicStyles.subtitle]}>
                  {group?.rating}
                </Text>
              </View>
            </View>
          </View>
        </Pressable>

        <Pressable style={styles.infoButton} onPress={handleGroupInfo}>
          <Ionicons
            name="information-circle-outline"
            size={24}
            color={dynamicStyles.text.color}
          />
        </Pressable>
      </View>

      {/* Messages */}
      <ScrollView
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[styles.messageRow, msg.isMe && styles.myMessageRow]}
          >
            {!msg.isMe && (
              <View
                style={[styles.messageAvatar, { backgroundColor: msg.avatar }]}
              />
            )}
            <View
              style={[
                styles.messageBubble,
                msg.isMe ? dynamicStyles.myMessage : dynamicStyles.theirMessage,
              ]}
            >
              {!msg.isMe && (
                <Text style={[styles.senderName, dynamicStyles.subtitle]}>
                  {msg.sender}
                </Text>
              )}
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
              <Text style={[styles.messageTime, dynamicStyles.subtitle]}>
                {msg.time}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Input Section */}
      <View style={styles.inputSection}>
        <Pressable style={styles.attachButton}>
          <Ionicons
            name="add-circle-outline"
            size={24}
            color={dynamicStyles.text.color}
          />
        </Pressable>
        <TextInput
          style={[styles.input, dynamicStyles.input]}
          placeholder="Type a message..."
          placeholderTextColor={isDark ? "#666666" : "#999999"}
          value={message}
          onChangeText={setMessage}
          multiline
        />
        <Pressable
          style={[styles.sendButton, dynamicStyles.sendButton]}
          onPress={handleSend}
        >
          <Ionicons
            name="send"
            size={20}
            color={dynamicStyles.sendIcon.color}
          />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#000000",
  },
  headerText: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  headerSubtitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  membersCount: {
    fontSize: 12,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#999999",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
  },
  infoButton: {
    padding: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  messageRow: {
    flexDirection: "row",
    gap: 8,
    maxWidth: "80%",
  },
  myMessageRow: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: "100%",
  },
  senderName: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 10,
    alignSelf: "flex-end",
  },
  inputSection: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 16,
    gap: 8,
  },
  attachButton: {
    padding: 4,
    paddingBottom: 12,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default GroupChat;
