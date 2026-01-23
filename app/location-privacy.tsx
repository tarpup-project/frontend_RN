import { api } from "@/api/client";
import { UrlConstants } from "@/constants/apiUrls";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";

const { width: screenWidth } = Dimensions.get('window');

interface Friend {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  canSeeLocation: boolean;
  friendshipId?: string; // Add this to track the friendship record
}

export default function LocationPrivacyScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // State
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(0);
  const [hiddenCount, setHiddenCount] = useState(0);
  const [processingFriends, setProcessingFriends] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load friends on mount
  useEffect(() => {
    loadFriends();
  }, []);

  // Update counts when friends change
  useEffect(() => {
    const visible = friends.filter(f => f.canSeeLocation).length;
    const hidden = friends.filter(f => !f.canSeeLocation).length;
    setVisibleCount(visible);
    setHiddenCount(hidden);
  }, [friends]);

  const loadFriends = async () => {
    try {
      setIsLoading(true);
      console.log('Loading friends from privacy endpoint...');

      const response = await api.get(UrlConstants.fetchFriendsPrivacy);

      console.log('Friends Privacy API Response:', JSON.stringify(response, null, 2));

      if (response.data?.status === 'success' && Array.isArray(response.data?.data)) {
        const friendsData = response.data.data.map((item: any) => ({
          id: item.id,
          name: `${item.fname || ''} ${item.lname || ''}`.trim() || 'Unknown',
          username: item.username || `@${(item.fname || '').toLowerCase()}${(item.lname || '').toLowerCase()}`,
          avatar: item.bgUrl,
          canSeeLocation: item.isLocationVisible ?? true,
          friendshipId: item.id // Keep mostly for tracking, even if structure flat
        }));

        setFriends(friendsData);
        console.log('Processed friends with privacy settings:', friendsData);
        console.log('Friends loaded:', friendsData.length);
      } else {
        console.log('No friends data found or invalid response structure');
        setFriends([]);
      }
    } catch (error: any) {
      console.error('Error loading friends:', error);
      console.log('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      toast.error('Failed to load friends');
      setFriends([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Manual refresh function
  const refreshFriendsList = async () => {
    console.log('Manually refreshing friends list...');
    await loadFriends();
    toast.success('Friends list refreshed');
  };

  // Filter friends based on search query
  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (friend.username && friend.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleFriendVisibility = async (friendId: string) => {
    if (processingFriends.has(friendId)) return; // Prevent double-clicks

    const friend = friends.find(f => f.id === friendId);
    if (!friend) return;

    const newVisibility = !friend.canSeeLocation;

    try {
      setProcessingFriends(prev => new Set(prev).add(friendId));
      console.log(`Toggling location privacy for friend ${friendId} to ${newVisibility ? 'visible' : 'invisible'}`);

      const response = await api.post(UrlConstants.friendLocationPrivacy, {
        userID: friendId,
        action: newVisibility // Boolean: true or false
      });

      console.log('Location privacy toggle response:', JSON.stringify(response.data, null, 2));

      if (response.data?.status === 'success') {
        // Update local state only after successful API call
        setFriends(prev => prev.map(f =>
          f.id === friendId
            ? { ...f, canSeeLocation: newVisibility }
            : f
        ));

        toast.success(`${friend.name} can ${newVisibility ? 'now' : 'no longer'} see your location`);
        console.log(`Successfully updated location privacy for ${friend.name}`);
      } else {
        console.error('Failed to update location privacy:', response.data);
        toast.error('Failed to update privacy setting');
      }
    } catch (error: any) {
      console.error('Error toggling location privacy:', error);
      console.error('Error response:', JSON.stringify(error?.response?.data, null, 2));
      toast.error('Failed to update privacy setting');
    } finally {
      setProcessingFriends(prev => {
        const newSet = new Set(prev);
        newSet.delete(friendId);
        return newSet;
      });
    }
  };

  const showAll = async () => {
    if (bulkProcessing) return;

    try {
      setBulkProcessing(true);
      console.log('Setting all friends to visible');

      // Update all friends to visible
      const updatePromises = friends.map(async (friend) => {
        if (!friend.canSeeLocation) { // Only update if currently hidden
          try {
            const response = await api.post(UrlConstants.friendLocationPrivacy, {
              userID: friend.id,
              action: true // Boolean true for visible
            });

            console.log(`Updated ${friend.name} to visible:`, response.data?.status === 'success');
            return { friendId: friend.id, success: response.data?.status === 'success' };
          } catch (error) {
            console.error(`Failed to update ${friend.name}:`, error);
            return { friendId: friend.id, success: false };
          }
        }
        return { friendId: friend.id, success: true }; // Already visible
      });

      const results = await Promise.all(updatePromises);
      const successCount = results.filter(r => r.success).length;

      if (successCount === friends.length) {
        setFriends(prev => prev.map(friend => ({ ...friend, canSeeLocation: true })));
        toast.success('All friends can now see your location');
      } else {
        toast.error(`Updated ${successCount}/${friends.length} friends`);
      }
    } catch (error) {
      console.error('Error in showAll:', error);
      toast.error('Failed to update all friends');
    } finally {
      setBulkProcessing(false);
    }
  };

  const hideAll = async () => {
    if (bulkProcessing) return;

    try {
      setBulkProcessing(true);
      console.log('Setting all friends to hidden');

      // Update all friends to hidden
      const updatePromises = friends.map(async (friend) => {
        if (friend.canSeeLocation) { // Only update if currently visible
          try {
            const response = await api.post(UrlConstants.friendLocationPrivacy, {
              userID: friend.id,
              action: false // Boolean false for invisible
            });

            console.log(`Updated ${friend.name} to hidden:`, response.data?.status === 'success');
            return { friendId: friend.id, success: response.data?.status === 'success' };
          } catch (error) {
            console.error(`Failed to update ${friend.name}:`, error);
            return { friendId: friend.id, success: false };
          }
        }
        return { friendId: friend.id, success: true }; // Already hidden
      });

      const results = await Promise.all(updatePromises);
      const successCount = results.filter(r => r.success).length;

      if (successCount === friends.length) {
        setFriends(prev => prev.map(friend => ({ ...friend, canSeeLocation: false })));
        toast.success('All friends are now hidden from your location');
      } else {
        toast.error(`Updated ${successCount}/${friends.length} friends`);
      }
    } catch (error) {
      console.error('Error in hideAll:', error);
      toast.error('Failed to update all friends');
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      console.log('Saving privacy settings and refreshing friends list...');

      // Refresh the friends list to get the latest privacy settings from server
      await loadFriends();

      toast.success('Privacy settings saved and refreshed');
      console.log('Privacy settings saved successfully');

      // Navigate back after successful save and refresh
      router.back();
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#000000" : "#FFFFFF" }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeft}>
          <Ionicons name="shield-checkmark-outline" size={24} color={isDark ? "#FFFFFF" : "#000000"} />
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: isDark ? "#FFFFFF" : "#000000" }]}>
              Location Privacy Settings
            </Text>
            <Text style={[styles.headerSubtitle, { color: isDark ? "#9AA0A6" : "#666" }]}>
              Choose which friends can see your location
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            style={[styles.refreshButton, { opacity: isLoading ? 0.6 : 1 }]}
            onPress={refreshFriendsList}
            disabled={isLoading}
          >
            <Ionicons name="refresh" size={20} color={isDark ? "#FFFFFF" : "#000000"} />
          </Pressable>
          <Pressable style={styles.closeButton} onPress={handleBack}>
            <Ionicons name="close" size={24} color={isDark ? "#FFFFFF" : "#000000"} />
          </Pressable>
        </View>
      </View>

      {/* Stats Row */}
      <View style={[styles.statsContainer, { borderBottomColor: isDark ? "#333" : "#E0E0E0" }]}>
        <View style={styles.statItem}>
          <Ionicons name="eye-outline" size={16} color="#4CAF50" />
          <Text style={[styles.statText, { color: isDark ? "#FFFFFF" : "#000000" }]}>
            Visible to: {visibleCount}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="eye-off-outline" size={16} color="#9AA0A6" />
          <Text style={[styles.statText, { color: isDark ? "#FFFFFF" : "#000000" }]}>
            Hidden from: {hiddenCount}
          </Text>
        </View>
        <View style={styles.actionButtons}>
          <Pressable
            style={[
              styles.actionBtn,
              { backgroundColor: isDark ? "#2A2A2A" : "#F5F5F5" },
              bulkProcessing && { opacity: 0.6 }
            ]}
            onPress={showAll}
            disabled={bulkProcessing}
          >
            <Text style={[styles.actionBtnText, { color: isDark ? "#FFFFFF" : "#000000" }]}>
              {bulkProcessing ? "..." : "Show All"}
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.actionBtn,
              { backgroundColor: isDark ? "#2A2A2A" : "#F5F5F5" },
              bulkProcessing && { opacity: 0.6 }
            ]}
            onPress={hideAll}
            disabled={bulkProcessing}
          >
            <Text style={[styles.actionBtnText, { color: isDark ? "#FFFFFF" : "#000000" }]}>
              {bulkProcessing ? "..." : "Hide All"}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5" }]}>
        <Ionicons name="search" size={20} color={isDark ? "#9AA0A6" : "#666"} />
        <TextInput
          style={[styles.searchInput, { color: isDark ? "#FFFFFF" : "#000000" }]}
          placeholder="Search friends..."
          placeholderTextColor={isDark ? "#9AA0A6" : "#666"}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Friends List */}
      <ScrollView style={styles.friendsList} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={isDark ? "#FFFFFF" : "#000000"} />
            <Text style={[styles.loadingText, { color: isDark ? "#9AA0A6" : "#666" }]}>
              Loading friends...
            </Text>
          </View>
        ) : filteredFriends.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={isDark ? "#666" : "#999"} />
            <Text style={[styles.emptyText, { color: isDark ? "#666" : "#999" }]}>
              {searchQuery ? 'No friends found' : 'No friends available'}
            </Text>
          </View>
        ) : (
          filteredFriends.map((friend) => (
            <View key={friend.id} style={[styles.friendItem, { borderBottomColor: isDark ? "#333" : "#F0F0F0" }]}>
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
                  <View style={styles.statusContainer}>
                    <Ionicons
                      name={friend.canSeeLocation ? "eye-outline" : "eye-off-outline"}
                      size={14}
                      color={friend.canSeeLocation ? "#4CAF50" : "#9AA0A6"}
                    />
                    <Text style={[styles.statusText, { color: friend.canSeeLocation ? "#4CAF50" : "#9AA0A6" }]}>
                      {friend.canSeeLocation ? "Can see location" : "Cannot see location"}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.switchContainer}>
                {processingFriends.has(friend.id) ? (
                  <ActivityIndicator size="small" color={isDark ? "#FFFFFF" : "#000000"} />
                ) : (
                  <Switch
                    value={friend.canSeeLocation}
                    onValueChange={() => toggleFriendVisibility(friend.id)}
                    trackColor={{ false: isDark ? "#333" : "#E0E0E0", true: "#4CAF50" }}
                    thumbColor={friend.canSeeLocation ? "#FFFFFF" : (isDark ? "#666" : "#FFFFFF")}
                    disabled={processingFriends.has(friend.id) || bulkProcessing}
                  />
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: isDark ? "#333" : "#E0E0E0" }]}>
        <View style={styles.footerInfo}>
          <Ionicons name="information-circle-outline" size={16} color={isDark ? "#9AA0A6" : "#666"} />
          <Text style={[styles.footerText, { color: isDark ? "#9AA0A6" : "#666" }]}>
            Privacy settings apply when you share your location
          </Text>
        </View>
        <View style={styles.footerButtons}>
          <Pressable style={[styles.cancelButton, { borderColor: isDark ? "#333" : "#E0E0E0" }]} onPress={handleBack}>
            <Text style={[styles.cancelButtonText, { color: isDark ? "#FFFFFF" : "#000000" }]}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[
              styles.saveButton,
              (isSaving || isLoading) && { opacity: 0.6 }
            ]}
            onPress={handleSave}
            disabled={isSaving || isLoading}
          >
            {isSaving ? (
              <>
                <ActivityIndicator size={16} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Saving...</Text>
              </>
            ) : (
              <>
                <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save Settings</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  refreshButton: {
    padding: 4,
  },
  closeButton: {
    padding: 4,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 20,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 10,
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    marginLeft: "auto",
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionBtnText: {
    fontSize: 10,
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginVertical: 16,
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
    paddingHorizontal: 20,
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
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
  },
  friendItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
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
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  switchContainer: {
    width: 50,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 16,
  },
  footerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  footerText: {
    fontSize: 12,
    flex: 1,
  },
  footerButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#000000",
    gap: 6,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});