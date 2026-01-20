import { api } from "@/api/client";
import { UrlConstants } from "@/constants/apiUrls";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import React, { useEffect, useState } from "react";
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

interface Friend {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  isFollowing?: boolean;
}

interface NewGroupModalProps {
  visible: boolean;
  onClose: () => void;
  onGroupCreated: (groupData: any) => void;
}

export default function NewGroupModal({ visible, onClose, onGroupCreated }: NewGroupModalProps) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // State
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [groupName, setGroupName] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // Load friends when modal opens or search query changes
  // Load friends when component mounts (background loading)
  useEffect(() => {
    loadFriends(true); // Show loading for initial load

    // Set up periodic refresh every 30 seconds in background
    const interval = setInterval(() => {
      loadFriends(false); // Background refresh without loading state
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Only trigger search filtering when modal is visible and search query changes
  useEffect(() => {
    if (visible && searchQuery) {
      // Filter existing friends instead of making new API call
      // This is handled by filteredFriends computed property
    }
  }, [visible, searchQuery]);

  // Load friends from API with background loading support
  const loadFriends = async (showLoading = false) => {
    try {
      // Only show loading state for initial load or when explicitly requested
      if (showLoading && friends.length === 0) {
        setIsLoading(true);
      }

      console.log('Loading friends for new group...');

      const response = await api.get(UrlConstants.fetchFriendsPrivacy);

      console.log('Friends API Response:', JSON.stringify(response.data, null, 2));

      if (response.data?.status === 'success' && Array.isArray(response.data?.data)) {
        const friendsData = response.data.data.map((item: any) => ({
          id: item.id,
          name: `${item.fname || ''} ${item.lname || ''}`.trim() || 'Unknown',
          username: item.username || `@${(item.fname || '').toLowerCase()}${(item.lname || '').toLowerCase()}`,
          avatar: item.bgUrl,
          isFollowing: false // Endpoint doesn't return this, default to false
        }));

        setFriends(friendsData);
        console.log('Processed friends for group:', friendsData.length);
      } else {
        console.log('No friends data found');
        setFriends([]);
      }
    } catch (error: any) {
      console.error('Error loading friends:', error);
      // Don't clear existing friends on background refresh errors
      if (friends.length === 0) {
        setFriends([]);
      }
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  // Filter friends based on search query
  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (friend.username && friend.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends(prev => {
      const newSet = new Set(prev);
      if (newSet.has(friendId)) {
        newSet.delete(friendId);
      } else {
        newSet.add(friendId);
      }
      return newSet;
    });
  };

  const createGroup = async () => {
    if (selectedFriends.size === 0) {
      toast.error('Please select at least one friend');
      return;
    }

    try {
      setIsCreatingGroup(true);
      console.log('Creating group with:', {
        selectedFriends: Array.from(selectedFriends),
        groupName: groupName || 'New Group'
      });

      // Create group using the groups/chat/create endpoint
      const response = await api.post(UrlConstants.createGroupChat, {
        users: Array.from(selectedFriends),
        groupName: groupName || 'New Group',
        chatType: "group"
      });

      console.log('Group creation response:', JSON.stringify(response.data, null, 2));

      if (response.data?.status === 'success') {
        const groupData = response.data.data;
        console.log('✅ Group created successfully:', groupData);

        toast.success(`Group "${groupName || 'New Group'}" created!`);

        // Pass the created group data to parent component
        onGroupCreated({
          ...groupData,
          selectedFriends: Array.from(selectedFriends),
          chatType: 'group'
        });

        handleClose();
      } else {
        console.error('Failed to create group:', response.data);
        toast.error('Failed to create group');
      }
    } catch (error: any) {
      console.error('Error creating group:', error);
      console.error('Error response:', JSON.stringify(error?.response?.data, null, 2));
      toast.error('Failed to create group. Please try again.');
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleClose = () => {
    // Clear form data but keep friends cached
    setSearchQuery("");
    setGroupName("");
    setSelectedFriends(new Set());
    // Don't clear friends data - keep it cached for next time
    // setFriends([]);
    onClose();
  };

  const selectedCount = selectedFriends.size;

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
                  New Group Chat
                </Text>
                <View style={styles.subtitleContainer}>
                  <Text style={[styles.headerSubtitle, { color: isDark ? "#9AA0A6" : "#666666" }]}>
                    Select friends to add to your group
                  </Text>
                </View>
              </View>
            </View>
            <Pressable style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color={isDark ? "#FFFFFF" : "#000000"} />
            </Pressable>
          </View>

          {/* Group Name Input */}
          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, { color: isDark ? "#FFFFFF" : "#000000" }]}>
              Group Name (Optional)
            </Text>
            <TextInput
              style={[
                styles.groupNameInput,
                {
                  backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5",
                  borderColor: isDark ? "#333333" : "#E0E0E0",
                  color: isDark ? "#FFFFFF" : "#000000"
                }
              ]}
              placeholder="e.g., Study Group, Weekend Squad..."
              placeholderTextColor={isDark ? "#666666" : "#999999"}
              value={groupName}
              onChangeText={setGroupName}
              autoCapitalize="words"
            />
          </View>

          {/* Search Bar */}
          <View style={[styles.searchContainer, { backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5" }]}>
            <Ionicons name="search" size={20} color={isDark ? "#9AA0A6" : "#666666"} />
            <TextInput
              style={[styles.searchInput, { color: isDark ? "#FFFFFF" : "#000000" }]}
              placeholder="Search friends..."
              placeholderTextColor={isDark ? "#9AA0A6" : "#666666"}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
          </View>

          {/* Friends List */}
          <ScrollView style={styles.friendsList} showsVerticalScrollIndicator={false}>
            {isLoading && friends.length === 0 ? (
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
                  {searchQuery ? 'Try a different search term' : 'Add some friends to create groups'}
                </Text>
              </View>
            ) : (
              filteredFriends.map((friend) => {
                const isSelected = selectedFriends.has(friend.id);
                return (
                  <Pressable
                    key={friend.id}
                    style={[
                      styles.friendItem,
                      {
                        backgroundColor: isDark ? "#1A1A1A" : "#F8F9FA",
                        borderColor: isDark ? "#333333" : "#E0E0E0",
                        opacity: isCreatingGroup ? 0.6 : 1
                      }
                    ]}
                    onPress={() => toggleFriendSelection(friend.id)}
                    disabled={isCreatingGroup}
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
                      <View
                        style={[
                          styles.checkbox,
                          {
                            backgroundColor: isSelected ? (isDark ? "#FFFFFF" : "#000000") : "transparent",
                            borderColor: isSelected ? (isDark ? "#FFFFFF" : "#000000") : (isDark ? "#666666" : "#CCCCCC")
                          }
                        ]}
                      >
                        {isSelected && (
                          <Ionicons name="checkmark" size={16} color={isDark ? "#000000" : "#FFFFFF"} />
                        )}
                      </View>
                    </View>
                  </Pressable>
                );
              })
            )}
          </ScrollView>

          {/* Bottom Actions */}
          <View style={[styles.bottomActions, { borderTopColor: isDark ? "#333333" : "#E0E0E0" }]}>
            <Pressable
              style={[
                styles.actionButton,
                styles.cancelButton,
                { borderColor: isDark ? "#666666" : "#CCCCCC" }
              ]}
              onPress={handleClose}
              disabled={isCreatingGroup}
            >
              <Text style={[styles.cancelButtonText, { color: isDark ? "#FFFFFF" : "#000000" }]}>
                Cancel
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.actionButton,
                styles.createButton,
                {
                  backgroundColor: selectedCount > 0 ? (isDark ? "#FFFFFF" : "#000000") : (isDark ? "#333333" : "#E0E0E0"),
                  opacity: isCreatingGroup ? 0.7 : 1
                }
              ]}
              onPress={createGroup}
              disabled={selectedCount === 0 || isCreatingGroup}
            >
              {isCreatingGroup ? (
                <>
                  <ActivityIndicator size="small" color={selectedCount > 0 ? (isDark ? "#000000" : "#FFFFFF") : "#FFFFFF"} />
                  <Text style={[styles.createButtonText, {
                    marginLeft: 8,
                    color: selectedCount > 0 ? (isDark ? "#000000" : "#FFFFFF") : "#FFFFFF"
                  }]}>
                    Creating...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="people" size={16} color={selectedCount > 0 ? (isDark ? "#000000" : "#FFFFFF") : "#FFFFFF"} />
                  <Text style={[styles.createButtonText, {
                    color: selectedCount > 0 ? (isDark ? "#000000" : "#FFFFFF") : "#FFFFFF"
                  }]}>
                    Create Group {selectedCount > 0 && `(${selectedCount})`}
                  </Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Loading Overlay */}
          {isCreatingGroup && (
            <View style={styles.loadingOverlay}>
              <View style={[styles.loadingCard, { backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF" }]}>
                <ActivityIndicator size="large" color={isDark ? "#FFFFFF" : "#000000"} />
                <Text style={[styles.loadingCardText, { color: isDark ? "#FFFFFF" : "#000000" }]}>
                  Creating group...
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
  subtitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  closeButton: {
    position: "absolute",
    top: 8,
    right: 16,
    padding: 4,
    zIndex: 1,
  },
  inputSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  groupNameInput: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
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
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  createButton: {
    backgroundColor: "#000000",
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
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