import { api } from "@/api/client";
import { UrlConstants } from "@/constants/apiUrls";
import { useTheme } from "@/contexts/ThemeContext";
import { Friend, useFilteredFriends } from "@/hooks/useFriends";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";

interface NewChatModalProps {
  visible: boolean;
  onClose: () => void;
  onChatCreated: (chatData: any) => void;
}

export default function NewChatModal({ visible, onClose, onChatCreated }: NewChatModalProps) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  // Use optimized friends hook
  const { friends: filteredFriends, isLoading, hasData } = useFilteredFriends(searchQuery);

  const createPersonalChat = async (friend: Friend) => {
    try {
      setIsCreatingChat(true);
      console.log('Creating personal chat with:', friend);

      // Create personal chat using the groups/chat/create endpoint
      const response = await api.post(UrlConstants.createGroupChat, {
        users: [friend.id],
        groupName: `Chat with ${friend.name}`,
        chatType: "personal"
      });

      console.log('Chat creation response:', JSON.stringify(response.data, null, 2));

      if (response.data?.status === 'success') {
        const chatData = response.data.data;
        console.log('✅ Personal chat created successfully:', chatData);

        toast.success(`Chat with ${friend.name} created!`);

        // Pass the created chat data to parent component
        onChatCreated({
          ...chatData,
          friend: friend,
          chatType: 'personal'
        });

        handleClose();
      } else {
        console.error('Failed to create chat:', response.data);
        toast.error('Failed to create chat');
      }
    } catch (error: any) {
      console.error('Error creating personal chat:', error);
      console.error('Error response:', JSON.stringify(error?.response?.data, null, 2));
      toast.error('Failed to create chat. Please try again.');
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleSelectFriend = (friend: Friend) => {
    console.log('Selected friend for chat:', friend);
    createPersonalChat(friend);
  };

  const handleClose = () => {
    // Only clear search query, friends data stays cached
    setSearchQuery("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      {visible && (
        <View style={[styles.container, { backgroundColor: isDark ? "#000000" : "#FFFFFF" }]}>
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
            <View style={styles.headerContent}>
              <View style={styles.headerTextContainer}>
                <Text style={[styles.headerTitle, { color: isDark ? "#FFFFFF" : "#000000" }]}>
                  New Chat
                </Text>
                <Text style={[styles.headerSubtitle, { color: isDark ? "#9AA0A6" : "#666666" }]}>
                  Select a friend or follower to start chatting
                </Text>
              </View>
            </View>
            <Pressable style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color={isDark ? "#FFFFFF" : "#000000"} />
            </Pressable>
          </View>

          {/* Search Bar */}
          <View style={[styles.searchContainer, { backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5" }]}>
            <Ionicons name="search" size={20} color={isDark ? "#9AA0A6" : "#666666"} />
            <TextInput
              style={[styles.searchInput, { color: isDark ? "#FFFFFF" : "#000000" }]}
              placeholder="Search friends and followers..."
              placeholderTextColor={isDark ? "#9AA0A6" : "#666666"}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
          </View>

          {/* Friends List */}
          <ScrollView style={styles.friendsList} showsVerticalScrollIndicator={false}>
            {isLoading && !hasData ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={isDark ? "#FFFFFF" : "#000000"} />
                <Text style={[styles.loadingText, { color: isDark ? "#9AA0A6" : "#666666" }]}>
                  Loading friends...
                </Text>
              </View>
            ) : filteredFriends.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color={isDark ? "#666666" : "#999999"} />
                <Text style={[styles.emptyText, { color: isDark ? "#666666" : "#999999" }]}>
                  {searchQuery ? 'No friends found' : 'No friends available'}
                </Text>
                <Text style={[styles.emptySubtext, { color: isDark ? "#666666" : "#999999" }]}>
                  {searchQuery ? 'Try a different search term' : 'Add some friends to start chatting'}
                </Text>
              </View>
            ) : (
              filteredFriends.map((friend) => (
                <Pressable
                  key={friend.id}
                  style={[
                    styles.friendItem,
                    {
                      backgroundColor: isDark ? "#1A1A1A" : "#F8F9FA",
                      borderColor: isDark ? "#333333" : "#E0E0E0",
                      opacity: isCreatingChat ? 0.6 : 1
                    }
                  ]}
                  onPress={() => handleSelectFriend(friend)}
                  disabled={isCreatingChat}
                >
                  <View style={styles.friendInfo}>
                    <View style={[styles.avatar, { backgroundColor: isDark ? "#2A2A2A" : "#E0E0E0" }]}>
                      {friend.avatar ? (
                        <ExpoImage
                          source={{ uri: friend.avatar }}
                          style={styles.avatarImage}
                          contentFit="cover"
                        />
                      ) : (
                        <Text style={[styles.avatarText, { color: isDark ? "#FFFFFF" : "#000000" }]}>
                          {friend.name.charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={styles.friendDetails}>
                      <Text style={[styles.friendName, { color: isDark ? "#FFFFFF" : "#000000" }]}>
                        {friend.name}
                      </Text>
                      <Text style={[styles.friendUsername, { color: isDark ? "#9AA0A6" : "#666666" }]}>
                        {friend.username}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.friendActions}>
                    {friend.isFollowing && (
                      <View style={[styles.followingBadge, { backgroundColor: isDark ? "#2A2A2A" : "#F0F0F0" }]}>
                        <Text style={[styles.followingText, { color: isDark ? "#FFFFFF" : "#000000" }]}>
                          Following
                        </Text>
                      </View>
                    )}
                    {isCreatingChat ? (
                      <ActivityIndicator size="small" color={isDark ? "#9AA0A6" : "#666666"} />
                    ) : (
                      <Ionicons name="chatbubble-outline" size={24} color={isDark ? "#9AA0A6" : "#666666"} />
                    )}
                  </View>
                </Pressable>
              ))
            )}
          </ScrollView>

          {/* Loading Overlay */}
          {isCreatingChat && (
            <View style={styles.loadingOverlay}>
              <View style={[styles.loadingCard, { backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF" }]}>
                <ActivityIndicator size="large" color={isDark ? "#FFFFFF" : "#000000"} />
                <Text style={[styles.loadingCardText, { color: isDark ? "#FFFFFF" : "#000000" }]}>
                  Creating chat...
                </Text>
              </View>
            </View>
          )}
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    position: "relative",
  },
  headerContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 4,
  },
  closeButton: {
    position: "absolute",
    top: 8,
    right: 16,
    padding: 4,
    zIndex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  friendsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 8,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
  },
  friendItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  friendInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "600",
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  friendUsername: {
    fontSize: 14,
  },
  friendActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  followingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  followingText: {
    fontSize: 12,
    fontWeight: "500",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingCardText: {
    fontSize: 16,
    fontWeight: "500",
  },
});