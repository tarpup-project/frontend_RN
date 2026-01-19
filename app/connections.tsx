import { api } from "@/api/client";
import { Text } from "@/components/Themedtext";
import { UrlConstants } from "@/constants/apiUrls";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
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

interface User {
  id: string;
  fname: string;
  lname: string;
  username?: string;
  bgUrl?: string;
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
  isFriend?: boolean;
  friendStatus?: 'friends' | 'pending' | 'not_friends';
  status?: string; // For friends API
  followerID?: string; // For unfollow action in follow tab
}

interface FollowerData {
  id?: string;
  userID?: string;
  followerID?: string;
  createdAt?: string;
  updatedAt?: string;
  follower: {
    id: string;
    fname: string;
    lname: string;
    bgUrl?: string;
  };
}

interface FriendData {
  id: string;
  status: string;
  userID: string;
  friendID: string;
  locationVisible: boolean;
  createdAt: string;
  updatedAt: string;
  friend: {
    id: string;
    fname: string;
    lname: string;
    bgUrl?: string;
  };
}

export default function ConnectionsScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<TabType>('follow');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [allTabsData, setAllTabsData] = useState<{
    follow: User[];
    friends: User[];
    discover: User[];
  }>({
    follow: [],
    friends: [],
    discover: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [followCounts, setFollowCounts] = useState({ follow: 0, friends: 0, discover: 0 });

  // Load all tabs data on initial load
  useEffect(() => {
    loadAllTabsData();
  }, []);

  // Update displayed users when active tab changes
  useEffect(() => {
    setUsers(allTabsData[activeTab]);
  }, [activeTab, allTabsData]);

  const loadAllTabsData = async () => {
    setIsLoading(true);
    try {
      // Load data for all tabs simultaneously
      const [followersRes, friendsRes, discoverRes] = await Promise.allSettled([
        api.get(UrlConstants.tarpUserFollowers),
        api.get(UrlConstants.tarpFriendsPrivacy),
        api.get(UrlConstants.groupsFriends())
      ]);

      let followData: User[] = [];
      let friendsData: User[] = [];
      let discoverData: User[] = [];

      // Process friends data first to get friend IDs
      let friendIds: Set<string> = new Set();
      if (friendsRes.status === 'fulfilled' && friendsRes.value.data?.status === 'success') {
        const friendsApiData: FriendData[] = friendsRes.value.data.data || [];

        friendsData = friendsApiData
          .filter((item: FriendData) => item.status === 'accepted') // Only accepted friends
          .map((item: FriendData) => ({
            id: item.friend.id,
            fname: item.friend.fname,
            lname: item.friend.lname,
            username: `@${item.friend.fname.toLowerCase()}${item.friend.lname.toLowerCase()}`,
            bgUrl: item.friend.bgUrl,
            isFollowing: false,
            isFriend: true,
            friendStatus: 'friends' as const,
            status: item.status,
            followersCount: 0,
            followingCount: 0
          }));

        // Create a set of friend IDs for quick lookup
        friendIds = new Set(friendsData.map(friend => friend.id));

        console.log('Friends loaded:', friendsData.length);
      }

      // Process followers data and check if they are also friends
      if (followersRes.status === 'fulfilled' && followersRes.value.data?.status === 'success') {
        const followersApiData: FollowerData[] = followersRes.value.data.data || [];

        // Remove duplicates by follower.id and map to User interface
        const uniqueFollowers = followersApiData.reduce((acc: FollowerData[], current) => {
          const exists = acc.find(item => item.follower.id === current.follower.id);
          if (!exists) {
            acc.push(current);
          }
          return acc;
        }, []);

        followData = uniqueFollowers.map((item: FollowerData) => {
          const isAlsoFriend = friendIds.has(item.follower.id);
          return {
            id: item.follower.id,
            fname: item.follower.fname,
            lname: item.follower.lname,
            username: `@${item.follower.fname.toLowerCase()}${item.follower.lname.toLowerCase()}`,
            bgUrl: item.follower.bgUrl,
            isFollowing: true,
            isFriend: isAlsoFriend, // Mark as friend if they exist in friends list
            friendStatus: isAlsoFriend ? 'friends' as const : 'not_friends' as const,
            followersCount: 0,
            followingCount: 0,
            followerID: item.follower.id // Store followerID for unfollow action
          };
        });

        console.log('Followers loaded:', followData.length);
        console.log('Followers who are also friends:', followData.filter(f => f.isFriend).length);
      }

      // Process discover data and filter out users who are in both follow and friends
      if (discoverRes.status === 'fulfilled' && discoverRes.value.data?.status === 'success') {
        const discoverApiData = discoverRes.value.data.data;

        // Create sets of user IDs from follow and friends for filtering and status checking
        const followIds = new Set(followData.map(user => user.id));
        const friendsOnlyIds = new Set(friendsData.map(user => user.id));

        discoverData = Array.isArray(discoverApiData) ? discoverApiData
          .map((item: any) => {
            const userId = item.id || item.user?.id;
            const isInFollow = followIds.has(userId);
            const isInFriends = friendsOnlyIds.has(userId);

            return {
              id: userId,
              fname: item.fname || item.user?.fname || 'User',
              lname: item.lname || item.user?.lname || '',
              username: item.username || `@${(item.fname || item.user?.fname || 'user').toLowerCase()}`,
              bgUrl: item.bgUrl || item.user?.bgUrl,
              isFollowing: isInFollow, // True if user is in follow tab
              isFriend: isInFriends, // True if user is in friends tab
              friendStatus: isInFriends ? 'friends' as const : 'not_friends' as const,
              followersCount: 0,
              followingCount: 0
            };
          })
          .filter((user: User) => {
            const isInFollow = user.isFollowing;
            const isInFriends = user.isFriend;

            // Only show in discover if:
            // - Not in both follow and friends tabs
            // - Can be in follow only, friends only, or neither
            return !(isInFollow && isInFriends);
          }) : [];

        console.log('Discover users loaded (after filtering):', discoverData.length);
        console.log('Users filtered out (in both follow and friends):',
          Array.isArray(discoverApiData) ? discoverApiData.length - discoverData.length : 0);
        console.log('Discover users with follow status:', discoverData.filter(u => u.isFollowing).length);
        console.log('Discover users with friend status:', discoverData.filter(u => u.isFriend).length);
      }

      // Update all tabs data
      const newAllTabsData = {
        follow: followData,
        friends: friendsData,
        discover: discoverData
      };

      setAllTabsData(newAllTabsData);

      // Set initial users to active tab
      setUsers(newAllTabsData[activeTab]);

      // Update counts
      setFollowCounts({
        follow: followData.length,
        friends: friendsData.length,
        discover: discoverData.length
      });

      console.log('All tabs data loaded:', {
        follow: followData.length,
        friends: friendsData.length,
        discover: discoverData.length
      });

    } catch (error) {
      console.error('Error loading all tabs data:', error);
      toast.error('Failed to load connections');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTabData = async (tabToRefresh?: TabType) => {
    // Refresh specific tab or all tabs after user actions
    const tabsToRefresh = tabToRefresh ? [tabToRefresh] : ['follow', 'friends', 'discover'];

    try {
      // If refreshing follow tab, we need friends data for cross-referencing
      let friendIds: Set<string> = new Set();
      if (tabsToRefresh.includes('follow')) {
        try {
          const friendsResponse = await api.get(UrlConstants.tarpFriendsPrivacy);
          if (friendsResponse.data?.status === 'success' && friendsResponse.data?.data) {
            const friendsApiData: FriendData[] = friendsResponse.data.data;
            const acceptedFriends = friendsApiData.filter((item: FriendData) => item.status === 'accepted');
            friendIds = new Set(acceptedFriends.map(friend => friend.friend.id));
          }
        } catch (error) {
          console.error('Error fetching friends for cross-reference:', error);
        }
      }

      for (const tab of tabsToRefresh) {
        let userData: User[] = [];

        switch (tab) {
          case 'follow':
            try {
              const followersResponse = await api.get(UrlConstants.tarpUserFollowers);
              if (followersResponse.data?.status === 'success' && followersResponse.data?.data) {
                const followersData: FollowerData[] = followersResponse.data.data;

                const uniqueFollowers = followersData.reduce((acc: FollowerData[], current) => {
                  const exists = acc.find(item => item.follower.id === current.follower.id);
                  if (!exists) {
                    acc.push(current);
                  }
                  return acc;
                }, []);

                userData = uniqueFollowers.map((item: FollowerData) => {
                  const isAlsoFriend = friendIds.has(item.follower.id);
                  return {
                    id: item.follower.id,
                    fname: item.follower.fname,
                    lname: item.follower.lname,
                    username: `@${item.follower.fname.toLowerCase()}${item.follower.lname.toLowerCase()}`,
                    bgUrl: item.follower.bgUrl,
                    isFollowing: true,
                    isFriend: isAlsoFriend, // Mark as friend if they exist in friends list
                    friendStatus: isAlsoFriend ? 'friends' as const : 'not_friends' as const,
                    followersCount: 0,
                    followingCount: 0,
                    followerID: item.follower.id // Store followerID for unfollow action
                  };
                });
              }
            } catch (error) {
              console.error('Error refreshing followers:', error);
            }
            break;

          case 'friends':
            try {
              const friendsResponse = await api.get(UrlConstants.tarpFriendsPrivacy);
              if (friendsResponse.data?.status === 'success' && friendsResponse.data?.data) {
                const friendsData: FriendData[] = friendsResponse.data.data;

                userData = friendsData
                  .filter((item: FriendData) => item.status === 'accepted')
                  .map((item: FriendData) => ({
                    id: item.friend.id,
                    fname: item.friend.fname,
                    lname: item.friend.lname,
                    username: `@${item.friend.fname.toLowerCase()}${item.friend.lname.toLowerCase()}`,
                    bgUrl: item.friend.bgUrl,
                    isFollowing: false,
                    isFriend: true,
                    friendStatus: 'friends' as const,
                    status: item.status,
                    followersCount: 0,
                    followingCount: 0
                  }));
              }
            } catch (error) {
              console.error('Error refreshing friends:', error);
            }
            break;

          case 'discover':
            try {
              const discoverResponse = await api.get(UrlConstants.groupsFriends());
              if (discoverResponse.data?.status === 'success' && discoverResponse.data?.data) {
                const discoverApiData = discoverResponse.data.data;

                // Get current follow and friends data for filtering and status checking
                const currentFollowData = allTabsData.follow || [];
                const currentFriendsData = allTabsData.friends || [];

                const followIds = new Set(currentFollowData.map(user => user.id));
                const friendsIds = new Set(currentFriendsData.map(user => user.id));

                userData = Array.isArray(discoverApiData) ? discoverApiData
                  .map((item: any) => {
                    const userId = item.id || item.user?.id;
                    const isInFollow = followIds.has(userId);
                    const isInFriends = friendsIds.has(userId);

                    return {
                      id: userId,
                      fname: item.fname || item.user?.fname || 'User',
                      lname: item.lname || item.user?.lname || '',
                      username: item.username || `@${(item.fname || item.user?.fname || 'user').toLowerCase()}`,
                      bgUrl: item.bgUrl || item.user?.bgUrl,
                      isFollowing: isInFollow, // True if user is in follow tab
                      isFriend: isInFriends, // True if user is in friends tab
                      friendStatus: isInFriends ? 'friends' as const : 'not_friends' as const,
                      followersCount: 0,
                      followingCount: 0
                    };
                  })
                  .filter((user: User) => {
                    const isInFollow = user.isFollowing;
                    const isInFriends = user.isFriend;

                    // Only show in discover if not in both follow and friends tabs
                    return !(isInFollow && isInFriends);
                  }) : [];
              }
            } catch (error) {
              console.error('Error refreshing discover users:', error);
            }
            break;
        }

        // Update the specific tab data
        setAllTabsData(prev => ({
          ...prev,
          [tab]: userData
        }));

        // Update counts
        setFollowCounts(prev => ({
          ...prev,
          [tab]: userData.length
        }));

        // If this is the active tab, update displayed users
        if (tab === activeTab) {
          setUsers(userData);
        }
      }
    } catch (error) {
      console.error('Error refreshing tab data:', error);
    }
  };

  const handleFriendAction = async (userId: string, action: 'friend' | 'unfriend') => {
    try {
      // For discover tab, determine action based on current friend status
      let actualAction = action;
      if (activeTab === 'discover') {
        const user = users.find(u => u.id === userId);
        actualAction = user?.isFriend ? 'unfriend' : 'friend';
      }

      console.log(`${actualAction === 'friend' ? 'Adding' : 'Removing'} friend:`, userId, 'Action:', actualAction);

      // Use existing friend toggle endpoint
      await api.post(UrlConstants.tarpToggleFriend, { userID: userId, action: actualAction });

      console.log(`Successfully ${actualAction === 'friend' ? 'added' : 'removed'} friend:`, userId);

      // Update local state immediately for better UX
      if (activeTab === 'friends' && actualAction === 'unfriend') {
        // Remove from list immediately
        setAllTabsData(prev => ({
          ...prev,
          [activeTab]: prev[activeTab].filter(user => user.id !== userId)
        }));

        setUsers(prev => prev.filter(user => user.id !== userId));

        // Update count
        setFollowCounts(prev => ({
          ...prev,
          friends: Math.max(0, prev.friends - 1)
        }));
      } else {
        // Just update status for other tabs or add action
        const updateUserInTab = (tabData: User[]) =>
          tabData.map(user =>
            user.id === userId
              ? {
                ...user,
                isFriend: actualAction === 'friend',
                friendStatus: (actualAction === 'friend' ? 'friends' : 'not_friends') as 'friends' | 'not_friends' | 'pending'
              }
              : user
          );

        setAllTabsData(prev => ({
          ...prev,
          [activeTab]: updateUserInTab(prev[activeTab])
        }));

        setUsers(prev => updateUserInTab(prev));
      }

      toast.success(actualAction === 'friend' ? 'Friend added' : 'Friend removed');

      // Refresh affected tabs after a short delay to ensure consistency
      setTimeout(() => {
        // If we just removed a friend, we might want to refresh discover/follow to update their status there too
        if (actualAction === 'unfriend') {
          refreshTabData('follow');
          refreshTabData('discover');
          // No need to refresh friends tab if we just removed them, unless we want to be 100% sure
        } else {
          refreshTabData('friends');
        }
      }, 500);
    } catch (error) {
      console.error('Error toggling friend:', error);
      toast.error('Failed to update friend status');
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

      // Update local state immediately for better UX
      if (activeTab === 'follow' && actualAction === 'unfollow') {
        // Remove from list immediately
        setAllTabsData(prev => ({
          ...prev,
          [activeTab]: prev[activeTab].filter(user => user.id !== userId)
        }));

        setUsers(prev => prev.filter(user => user.id !== userId));

        // Update count
        setFollowCounts(prev => ({
          ...prev,
          follow: Math.max(0, prev.follow - 1)
        }));
      } else {
        // Just update status
        const updateUserInTab = (tabData: User[]) =>
          tabData.map(user =>
            user.id === userId
              ? { ...user, isFollowing: actualAction === 'follow' }
              : user
          );

        setAllTabsData(prev => ({
          ...prev,
          [activeTab]: updateUserInTab(prev[activeTab])
        }));

        setUsers(prev => updateUserInTab(prev));
      }

      toast.success(actualAction === 'follow' ? 'Following' : 'Unfollowed');

      // Refresh affected tabs after a short delay
      setTimeout(() => {
        // If we just unfollowed, we might want to refresh discover to update status
        if (actualAction === 'unfollow') {
          refreshTabData('discover');
          // No need to refresh follow tab if we just removed them
        } else {
          refreshTabData('follow');
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
                    : [styles.friendButton, { borderColor: isDark ? "#666666" : "#CCCCCC" }]
                ]}
                onPress={() => handleFriendAction(item.id, item.isFriend ? 'unfriend' : 'friend')}
              >
                <Ionicons
                  name="heart"
                  size={14}
                  color={item.isFriend ? (isDark ? "#0a0a0a" : "#FFFFFF") : (isDark ? "#CCCCCC" : "#666666")}
                />
                <Text style={[
                  styles.actionButtonText,
                  { color: item.isFriend ? (isDark ? "#0a0a0a" : "#FFFFFF") : (isDark ? "#CCCCCC" : "#666666") }
                ]}>
                  {item.isFriend ? 'Friends' : 'Friend'}
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

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const fullName = `${user.fname} ${user.lname}`.toLowerCase();
    const username = user.username?.toLowerCase() || '';
    return fullName.includes(searchQuery.toLowerCase()) || username.includes(searchQuery.toLowerCase());
  });

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
                {followCounts.follow}
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
                {followCounts.friends}
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
                {followCounts.discover}
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
            data={filteredUsers}
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