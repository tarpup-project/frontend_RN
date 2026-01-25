import { api } from "@/api/client";
import { Text } from "@/components/Themedtext";
import { UrlConstants } from "@/constants/apiUrls";
import { useTheme } from "@/contexts/ThemeContext";
import { useFilteredConnections, User } from "@/hooks/useConnections";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";

type TabType = 'follow' | 'friends' | 'discover';

export default function ConnectionsScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabType>('follow');
  const [searchQuery, setSearchQuery] = useState('');

  // Use the cached connections data
  const {
    users,
    counts,
    isLoading,
    hasError,
    refetchAll,
    refetchTab
  } = useFilteredConnections(activeTab, searchQuery);

  // Preload all connections data on mount for instant tab switching
  useEffect(() => {
    console.log('📱 Connections screen mounted - data will be cached for instant access');
    console.log('📊 Current counts:', counts);
    console.log('📋 Current users for', activeTab, ':', users.length);
  }, []);

  // Log when tab changes to show instant switching
  useEffect(() => {
    console.log('🔄 Tab changed to:', activeTab);
    console.log('📋 Users loaded instantly:', users.length);
  }, [activeTab]);

  // Handle errors
  useEffect(() => {
    if (hasError) {
      console.error('❌ Error loading connections data:', hasError);
      toast.error('Failed to load connections');
    }
  }, [hasError]);

  const handleFriendAction = async (userId: string, action: 'friend' | 'unfriend') => {
    // Snapshot previous data for rollback
    const previousPending = queryClient.getQueryData(['connections', 'pending']);
    const previousFriends = queryClient.getQueryData(['connections', 'friends']);

    try {
      // For discover tab, determine action based on current friend status
      let actualAction = action;
      if (activeTab === 'discover') {
        const user = users.find(u => u.id === userId);
        actualAction = user?.isFriend ? 'unfriend' : 'friend';
      }

      console.log(`${actualAction === 'friend' ? 'Adding' : 'Removing'} friend:`, userId, 'Action:', actualAction);

      // Optimistic Update
      if (actualAction === 'friend') {
        // Add to pending
        queryClient.setQueryData(['connections', 'pending'], (old: string[] = []) => {
          return [...old, userId];
        });
      } else {
        // Remove from pending
        queryClient.setQueryData(['connections', 'pending'], (old: string[] = []) => {
          return old.filter(id => id !== userId);
        });
        // Optimistically remove from friends list if unfriending
        queryClient.setQueryData(['connections', 'friends'], (old: User[] = []) => {
          return old.filter(u => u.id !== userId);
        });
      }

      // Use existing friend toggle endpoint
      await api.post(UrlConstants.tarpToggleFriend, { userID: userId, action: actualAction });

      console.log(`Successfully ${actualAction === 'friend' ? 'added' : 'removed'} friend:`, userId);

      toast.success(actualAction === 'friend' ? 'Friend added' : 'Friend removed');

      // Refresh affected tabs after a short delay to ensure consistency
      setTimeout(() => {
        if (actualAction === 'unfriend') {
          refetchTab('follow');
          refetchTab('discover');
          refetchTab('friends'); // Refresh to remove from friends list
        } else {
          refetchTab('friends');
          refetchTab('follow'); // Update friend status in follow tab
          refetchTab('discover'); // Update friend status in discover tab
        }
      }, 500);
    } catch (error) {
      console.error('Error toggling friend:', error);
      toast.error('Failed to update friend status');

      // Rollback on error
      if (previousPending) {
        queryClient.setQueryData(['connections', 'pending'], previousPending);
      }
      if (previousFriends) {
        queryClient.setQueryData(['connections', 'friends'], previousFriends);
      }
    }
  };

  const handleFollowAction = async (userId: string, action: 'follow' | 'unfollow') => {
    try {
      // Find the user to get the correct ID for the API call and determine action
      const user = users.find(u => u.id === userId);
      let apiUserId = userId;
      let actualAction = action;

      // For discover tab, determine action based on current follow status
      if (activeTab === 'discover') {
        actualAction = user?.isFollowing ? 'unfollow' : 'follow';
      }

      // For follow tab (unfollow action), use the followerID instead of user.id
      if (activeTab === 'follow' && actualAction === 'unfollow' && user?.followerID) {
        apiUserId = user.followerID;
      }

      console.log(`${actualAction === 'follow' ? 'Following' : 'Unfollowing'} user:`, apiUserId, 'Action:', actualAction);

      // Use existing follow toggle endpoint
      await api.post(UrlConstants.tarpToggleFollow, { userID: apiUserId, action: actualAction });

      console.log(`Successfully ${actualAction === 'follow' ? 'followed' : 'unfollowed'} user:`, apiUserId);

      toast.success(actualAction === 'follow' ? 'Following' : 'Unfollowed');

      // Refresh affected tabs after a short delay
      setTimeout(() => {
        if (actualAction === 'unfollow') {
          refetchTab('discover'); // Update status in discover
          refetchTab('follow'); // Remove from follow list
        } else {
          refetchTab('follow'); // Add to follow list
          refetchTab('discover'); // Update status in discover
        }
      }, 500);
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Failed to update follow status');
    }
  };

  const renderUserItem = ({ item }: { item: User }) => {
    const fullName = `${item.fname} ${item.lname}`.trim();
    const username = item.username || `@${item.fname.toLowerCase()}${item.lname.toLowerCase()}`;

    return (
      <View style={[styles.userCard, { backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF" }]}>
        {/* Avatar */}
        <View style={styles.userInfo}>
          {item.bgUrl ? (
            <ExpoImage
              source={{ uri: item.bgUrl }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]}>
              <Text style={styles.avatarText}>
                {item.fname[0]?.toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>
              {fullName}
            </Text>
            <Text style={[styles.userHandle, { color: isDark ? "#9AA0A6" : "#666666" }]}>
              {username}
            </Text>
            <View style={styles.statsRow}>
              <Text style={[styles.statsText, { color: isDark ? "#9AA0A6" : "#666666" }]}>
                {item.followersCount || 0} • {item.followingCount || 0}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {activeTab === 'friends' ? (
            // Friends tab - only show Remove button
            <Pressable
              style={[styles.removeButton, { borderColor: "#EF4444" }]}
              onPress={() => handleFriendAction(item.id, 'unfriend')}
            >
              <Ionicons
                name="person-remove-outline"
                size={14}
                color="#EF4444"
              />
              <Text style={[styles.removeButtonText, { color: "#EF4444" }]}>
                Remove
              </Text>
            </Pressable>
          ) : (
            // Follow and Discover tabs - show both buttons in column
            <View style={styles.buttonColumn}>
              {/* Friend Button */}
              <Pressable
                style={[
                  styles.actionButton,
                  item.isFriend
                    ? [styles.friendsButton, { backgroundColor: isDark ? "#FFFFFF" : "#0a0a0a" }]
                    : (item.friendStatus === 'pending'
                      ? [styles.friendButton, { borderColor: isDark ? "#666666" : "#CCCCCC", opacity: 0.7 }]
                      : [styles.friendButton, { borderColor: isDark ? "#666666" : "#CCCCCC" }])
                ]}
                disabled={item.friendStatus === 'pending'}
                onPress={() => handleFriendAction(item.id, item.isFriend ? 'unfriend' : 'friend')}
              >
                <Ionicons
                  name={item.friendStatus === 'pending' ? "time-outline" : "heart"}
                  size={14}
                  color={item.isFriend ? (isDark ? "#0a0a0a" : "#FFFFFF") : (isDark ? "#CCCCCC" : "#666666")}
                />
                <Text style={[
                  styles.actionButtonText,
                  { color: item.isFriend ? (isDark ? "#0a0a0a" : "#FFFFFF") : (isDark ? "#CCCCCC" : "#666666") }
                ]}>
                  {item.friendStatus === 'pending' ? 'Pending' : (item.isFriend ? 'Friends' : 'Friend')}
                </Text>
              </Pressable>

              {/* Unfollow Button */}
              <Pressable
                style={[styles.unfollowButton, { borderColor: isDark ? "#666666" : "#CCCCCC" }]}
                onPress={() => handleFollowAction(item.id, item.isFollowing ? 'unfollow' : 'follow')}
              >
                <Ionicons
                  name="person-remove-outline"
                  size={14}
                  color={isDark ? "#CCCCCC" : "#666666"}
                />
                <Text style={[styles.unfollowText, { color: isDark ? "#CCCCCC" : "#666666" }]}>
                  {item.isFollowing ? 'Unfollow' : 'Follow'}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#0a0a0a" : "#F8F9FA" }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF" }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.headerTitle, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>
              Connections
            </Text>
            <Text style={[styles.headerSubtitle, { color: isDark ? "#9AA0A6" : "#666666" }]}>
              Follow friends and discover new people
            </Text>
          </View>
          <Pressable
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={24} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
          </Pressable>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: isDark ? "#1A1A1A" : "#F3F4F6" }]}>
          <Ionicons name="search" size={20} color={isDark ? "#9AA0A6" : "#666666"} />
          <TextInput
            style={[styles.searchInput, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}
            placeholder="Search users..."
            placeholderTextColor={isDark ? "#666666" : "#999999"}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Tabs */}
        <View style={[styles.tabsContainer, { backgroundColor: isDark ? "#1A1A1A" : "#F3F4F6" }]}>
          <Pressable
            style={[
              styles.tab,
              activeTab === 'follow' && [styles.activeTab, { backgroundColor: isDark ? "#FFFFFF" : "#0a0a0a" }]
            ]}
            onPress={() => setActiveTab('follow')}
          >
            <Ionicons
              name="person"
              size={16}
              color={activeTab === 'follow' ? (isDark ? "#0a0a0a" : "#FFFFFF") : (isDark ? "#9AA0A6" : "#666666")}
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'follow' ? (isDark ? "#0a0a0a" : "#FFFFFF") : (isDark ? "#9AA0A6" : "#666666") }
            ]}>
              Follow
            </Text>
            <View style={[
              styles.tabBadge,
              { backgroundColor: activeTab === 'follow' ? (isDark ? "#666666" : "#CCCCCC") : (isDark ? "#333333" : "#E5E7EB") }
            ]}>
              <Text style={[
                styles.tabBadgeText,
                { color: activeTab === 'follow' ? "#FFFFFF" : (isDark ? "#9AA0A6" : "#666666") }
              ]}>
                {counts.follow}
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={[
              styles.tab,
              activeTab === 'friends' && [styles.activeTab, { backgroundColor: isDark ? "#FFFFFF" : "#0a0a0a" }]
            ]}
            onPress={() => setActiveTab('friends')}
          >
            <Ionicons
              name="heart"
              size={16}
              color={activeTab === 'friends' ? (isDark ? "#0a0a0a" : "#FFFFFF") : (isDark ? "#9AA0A6" : "#666666")}
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'friends' ? (isDark ? "#0a0a0a" : "#FFFFFF") : (isDark ? "#9AA0A6" : "#666666") }
            ]}>
              Friends
            </Text>
            <View style={[
              styles.tabBadge,
              { backgroundColor: activeTab === 'friends' ? (isDark ? "#666666" : "#CCCCCC") : (isDark ? "#333333" : "#E5E7EB") }
            ]}>
              <Text style={[
                styles.tabBadgeText,
                { color: activeTab === 'friends' ? "#FFFFFF" : (isDark ? "#9AA0A6" : "#666666") }
              ]}>
                {counts.friends}
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={[
              styles.tab,
              activeTab === 'discover' && [styles.activeTab, { backgroundColor: isDark ? "#FFFFFF" : "#0a0a0a" }]
            ]}
            onPress={() => setActiveTab('discover')}
          >
            <Ionicons
              name="compass"
              size={16}
              color={activeTab === 'discover' ? (isDark ? "#0a0a0a" : "#FFFFFF") : (isDark ? "#9AA0A6" : "#666666")}
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'discover' ? (isDark ? "#0a0a0a" : "#FFFFFF") : (isDark ? "#9AA0A6" : "#666666") }
            ]}>
              Discover
            </Text>
            <View style={[
              styles.tabBadge,
              { backgroundColor: activeTab === 'discover' ? (isDark ? "#666666" : "#CCCCCC") : (isDark ? "#333333" : "#E5E7EB") }
            ]}>
              <Text style={[
                styles.tabBadgeText,
                { color: activeTab === 'discover' ? "#FFFFFF" : (isDark ? "#9AA0A6" : "#666666") }
              ]}>
                {counts.discover}
              </Text>
            </View>
          </Pressable>
        </View>
      </View>

      {/* Users List */}
      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={isDark ? "#FFFFFF" : "#0a0a0a"} />
            <Text style={[styles.loadingText, { color: isDark ? "#9AA0A6" : "#666666" }]}>
              Loading connections...
            </Text>
          </View>
        ) : (
          <FlatList
            data={users}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="people-outline"
                  size={48}
                  color={isDark ? "#666666" : "#CCCCCC"}
                />
                <Text style={[styles.emptyText, { color: isDark ? "#9AA0A6" : "#666666" }]}>
                  No connections found
                </Text>
                <Text style={[styles.emptySubtext, { color: isDark ? "#666666" : "#999999" }]}>
                  {searchQuery ? 'Try a different search term' : 'Start connecting with people'}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    // backgroundColor set dynamically
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 20,
    gap: 12,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  defaultAvatar: {
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  userHandle: {
    fontSize: 14,
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
  },
  statsText: {
    fontSize: 12,
  },
  actionButtons: {
    alignItems: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    minWidth: 80,
    justifyContent: 'center',
    marginBottom: 4,
  },
  friendsButton: {
    // backgroundColor set dynamically
  },
  friendButton: {
    borderWidth: 1,
  },
  unfollowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    minWidth: 80,
    justifyContent: 'center',
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  unfollowText: {
    fontSize: 11,
    fontWeight: '600',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    minWidth: 80,
    justifyContent: 'center',
    borderWidth: 1,
  },
  removeButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  buttonColumn: {
    alignItems: 'flex-end',
    gap: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});