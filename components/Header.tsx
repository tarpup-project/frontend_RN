  import AuthModal from "@/components/AuthModal";
import { Text } from "@/components/Themedtext";
import { useTheme } from "@/contexts/ThemeContext";
import { useFriendRequests } from "@/hooks/useFriendRequests";
import { useNotifications } from "@/hooks/useNotification";
import { usePendingMatches } from "@/hooks/usePendingMatches";
import { useAuthStore } from "@/state/authStore";
import { useNotificationStore } from "@/state/notificationStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Image, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Friend {
  id: string;
  fname: string;
  lname: string | null;
  bgUrl: string | null;
}

interface FriendRequest {
  id: string;
  status: string;
  userID: string;
  friendID: string;
  locationVisible: boolean;
  createdAt: string;
  updatedAt: string;
  friend: Friend;
}

interface PendingMatch {
  id: string;
  categoryID: string;
  userID: string;
  matchedUserID: string;
  compatibility: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  matchedUser?: {
    id: string;
    fname: string;
    lname: string | null;
    bgUrl: string | null;
  };
  category?: {
    id: string;
    name: string;
    icon: string;
    bgColor: string;
    iconColor: string;
  };
}

  const Header = () => {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { isDark, toggleTheme } = useTheme();
    const { isAuthenticated } = useAuthStore();
    const { personalNotifications, clearNotifications } = useNotificationStore();
    const { groupNotifications, personalNotifications: apiPersonalNotifications } = useNotifications();
    const { friendRequests, acceptFriendRequest, declineFriendRequest, isLoading: friendRequestsLoading, processingRequests } = useFriendRequests();
    const { pendingMatches, markMatchAsViewed, dismissMatch, isLoading: pendingMatchesLoading } = usePendingMatches();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showNotificationPanel, setShowNotificationPanel] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<string | null>(null);

    const pulseAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;

    // Calculate total notifications from API (including friend requests and pending matches)
    const totalNotifications = groupNotifications + apiPersonalNotifications + friendRequests.length + pendingMatches.length;

    // Debug logging
    useEffect(() => {
      console.log("Header: Friend requests updated:", friendRequests.length);
      console.log("Header: Pending matches updated:", pendingMatches.length);
      console.log("Header: Total notifications:", totalNotifications);
    }, [friendRequests, pendingMatches, totalNotifications]);

    useEffect(() => { 
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.95,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }, []);

    const handleNotificationPress = () => {
      if (!isAuthenticated) {
        setShowAuthModal(true);
      } else {
        setShowNotificationPanel(true);
        // Slide in animation
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    };

    const handleCloseNotificationPanel = () => {
      // Slide out animation
      Animated.timing(slideAnim, {
        toValue: Dimensions.get('window').width,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowNotificationPanel(false);
        setSelectedNotification(null); // Clear selection when panel closes
      });
    };

    const handleNotificationClick = (notificationId: string) => {
      if (selectedNotification === notificationId) {
        setSelectedNotification(null); // Deselect if already selected
      } else {
        setSelectedNotification(notificationId); // Select the notification
      }
    };

    const handleChatPress = () => {
      if (!isAuthenticated) {
        setShowAuthModal(true);
      } else {
        clearNotifications('personal');
        router.push("/chat");
      }
    };

    const handleThemeToggle = () => {
      toggleTheme();
    };

    const dynamicStyles = {
      container: {
        backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
        borderBottomColor: isDark ? "#333333" : "#E0E0E0",
      },
      title: {
        color: isDark ? "#FFFFFF" : "#0a0a0a",
      },
      icon: {
        color: isDark ? "#FFFFFF" : "#0a0a0a",
      },
      chatButton: {
        backgroundColor: isDark ? "#FFFFFF" : "#0a0a0a",
      },
      chatText: {
        color: isDark ? "#0a0a0a" : "#FFFFFF",
      },
    };

    return (
      <>
        <StatusBar style={isDark ? "light" : "dark"} />
        <View
          style={[
            styles.container,
            dynamicStyles.container,
            { paddingTop: insets.top + 12 },
          ]}
        >
          {/* Left side - Notification Bell and Theme Toggle */}
          <View style={styles.leftContainer}>
            <Pressable 
              style={styles.notificationButton} 
              onPress={handleNotificationPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons 
                name="notifications-outline" 
                size={24} 
                color={isAuthenticated ? dynamicStyles.icon.color : "#999999"} 
              />
              {isAuthenticated && totalNotifications > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {totalNotifications > 99 ? '99+' : totalNotifications.toString()}
                  </Text>
                </View>
              )}
            </Pressable>
            
            <Pressable style={styles.iconButton} onPress={handleThemeToggle} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              {isDark ? (
                <Ionicons name="moon" size={20} color={dynamicStyles.icon.color} />
              ) : (
                <Ionicons name="sunny" size={20} color={dynamicStyles.icon.color} />
              )}
            </Pressable>
          </View>

          {/* Center - Empty space */}
          <View style={styles.titleContainer}>
          </View>

          {/* Right side - Chat Button Only */}
          <View style={styles.iconsContainer}>
            <Pressable
                style={[styles.chatButton, dynamicStyles.chatButton]}
                onPress={handleChatPress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}              
              >
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <View style={styles.chatContent}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={18}
                    color={dynamicStyles.chatText.color}
                  />
                  <Text style={[styles.chatText, dynamicStyles.chatText]}>
                    Chat
                  </Text>
                </View>
                {personalNotifications > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {personalNotifications > 99 ? '99+' : personalNotifications}
                    </Text>
                  </View>
                )}
                </Animated.View>
                </Pressable>
          </View>
        </View>
        <AuthModal
          visible={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />

        {/* Notification Panel */}
        <Modal
          visible={showNotificationPanel}
          transparent={true}
          animationType="none"
          onRequestClose={handleCloseNotificationPanel}
        >
          <View style={styles.modalOverlay}>
            <Pressable 
              style={styles.modalBackdrop} 
              onPress={handleCloseNotificationPanel}
            />
            <Animated.View 
              style={[
                styles.notificationPanel,
                { 
                  backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
                  transform: [{ translateX: slideAnim }]
                }
              ]}
            >
              {/* Panel Header */}
              <View style={[styles.panelHeader, { paddingTop: insets.top + 12 }]}>
                <View style={styles.panelHeaderContent}>
                  <View style={styles.panelTitleRow}>
                    <View style={[styles.bellIconContainer, { backgroundColor: isDark ? "#333333" : "#F3F4F6" }]}>
                      <Ionicons name="notifications" size={20} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
                    </View>
                    <View>
                      <Text style={[styles.panelTitle, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>
                        Notifications
                      </Text>
                      <Text style={[styles.panelSubtitle, { color: isDark ? "#CCCCCC" : "#666666" }]}>
                        {totalNotifications} unread notification{totalNotifications !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                  <Pressable 
                    style={styles.closeButton} 
                    onPress={handleCloseNotificationPanel}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close" size={24} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
                  </Pressable>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <Pressable style={styles.actionButton}>
                    <Ionicons name="checkmark-done" size={16} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
                    <Text style={[styles.actionButtonText, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>
                      Mark all read
                    </Text>
                  </Pressable>
                  <Pressable style={styles.actionButton}>
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    <Text style={[styles.actionButtonText, { color: "#EF4444" }]}>
                      Clear all
                    </Text>
                  </Pressable>
                </View>

                {/* Filter Tabs */}
                <View style={styles.filterTabs}>
                  <View style={[styles.filterTab, styles.activeTab, { backgroundColor: isDark ? "#FFFFFF" : "#0a0a0a" }]}>
                    <Text style={[styles.filterTabText, styles.activeTabText, { color: isDark ? "#0a0a0a" : "#FFFFFF" }]}>
                      All
                    </Text>
                    <View style={[styles.tabBadge, { backgroundColor: isDark ? "#666666" : "#CCCCCC" }]}>
                      <Text style={[styles.tabBadgeText, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>
                        {totalNotifications + 4} {/* +4 for sample static notifications */}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.filterTab, { backgroundColor: isDark ? "#333333" : "#F3F4F6" }]}>
                    <Text style={[styles.filterTabText, { color: isDark ? "#CCCCCC" : "#666666" }]}>
                      Unread
                    </Text>
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{totalNotifications}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Notifications List */}
              <ScrollView style={styles.notificationsList} showsVerticalScrollIndicator={false}>
                {/* Friend Requests from API */}
                {friendRequestsLoading ? (
                  <View style={[styles.notificationItem, { borderBottomColor: isDark ? "#333333" : "#E5E7EB" }]}>
                    <View style={styles.notificationContent}>
                      <View style={[styles.notificationAvatar, styles.avatarPlaceholder, { backgroundColor: "#E5E7EB" }]}>
                        <Text style={[styles.avatarText, { color: "#9CA3AF" }]}>...</Text>
                      </View>
                      <View style={styles.notificationText}>
                        <Text style={[styles.notificationTitle, { color: isDark ? "#CCCCCC" : "#666666" }]}>
                          Loading friend requests...
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  friendRequests.map((request) => {
                    console.log("Rendering friend request:", request.friend.fname, request.friend.lname);
                    return (
                    <Pressable 
                      key={request.id}
                      style={[styles.notificationItem, { borderBottomColor: isDark ? "#333333" : "#E5E7EB" }]}
                      onPress={() => handleNotificationClick(`friend-request-${request.id}`)}
                    >
                      <View style={styles.notificationContent}>
                        {request.friend.bgUrl ? (
                          <Image 
                            source={{ uri: request.friend.bgUrl }}
                            style={styles.notificationAvatar}
                          />
                        ) : (
                          <View style={[styles.notificationAvatar, styles.avatarPlaceholder, { backgroundColor: "#4F46E5" }]}>
                            <Text style={styles.avatarText}>
                              {request.friend.fname[0]}{request.friend.lname ? request.friend.lname[0] : ''}
                            </Text>
                          </View>
                        )}
                        <View style={styles.notificationText}>
                          <View style={styles.notificationHeader}>
                            <Text style={[styles.notificationTitle, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>
                              New Friend Request
                            </Text>
                            <View style={styles.notificationHeaderRight}>
                              <View style={styles.unreadDot} />
                            </View>
                          </View>
                          <Text style={[styles.notificationMessage, { color: isDark ? "#CCCCCC" : "#666666" }]}>
                            {request.friend.fname} {request.friend.lname || ''} wants to be friends
                          </Text>
                          <Text style={[styles.notificationTime, { color: isDark ? "#999999" : "#999999" }]}>
                            {moment(request.createdAt).fromNow()}
                          </Text>
                          <View style={styles.notificationActions}>
                            <Pressable 
                              style={[
                                styles.acceptButton, 
                                { backgroundColor: isDark ? "#FFFFFF" : "#0a0a0a" },
                                processingRequests.has(request.id) && { opacity: 0.6 }
                              ]}
                              onPress={() => acceptFriendRequest(request.id)}
                              disabled={processingRequests.has(request.id)}
                            >
                              <Text style={[styles.acceptButtonText, { color: isDark ? "#0a0a0a" : "#FFFFFF" }]}>
                                {processingRequests.has(request.id) ? "..." : "Accept"}
                              </Text>
                            </Pressable>
                            <Pressable 
                              style={[
                                styles.declineButton,
                                processingRequests.has(request.id) && { opacity: 0.6 }
                              ]}
                              onPress={() => declineFriendRequest(request.id)}
                              disabled={processingRequests.has(request.id)}
                            >
                              <Text style={[styles.declineButtonText, { color: isDark ? "#CCCCCC" : "#666666" }]}>
                                {processingRequests.has(request.id) ? "..." : "Decline"}
                              </Text>
                            </Pressable>
                          </View>
                        </View>
                        {selectedNotification === `friend-request-${request.id}` && (
                          <View style={styles.verticalActions}>
                            <Pressable 
                              style={[
                                styles.verticalActionButton, 
                                { backgroundColor: isDark ? "#1F2937" : "#F3F4F6" },
                                processingRequests.has(request.id) && { opacity: 0.6 }
                              ]}
                              onPress={() => acceptFriendRequest(request.id)}
                              disabled={processingRequests.has(request.id)}
                            >
                              <Ionicons name="checkmark" size={18} color="#10B981" />
                            </Pressable>
                            <Pressable 
                              style={[
                                styles.verticalActionButton, 
                                { backgroundColor: isDark ? "#1F2937" : "#F3F4F6" },
                                processingRequests.has(request.id) && { opacity: 0.6 }
                              ]}
                              onPress={() => declineFriendRequest(request.id)}
                              disabled={processingRequests.has(request.id)}
                            >
                              <Ionicons name="trash-outline" size={18} color="#EF4444" />
                            </Pressable>
                          </View>
                        )}
                      </View>
                    </Pressable>
                    );
                  })
                )}

                {/* Show message when no friend requests */}
                {!friendRequestsLoading && friendRequests.length === 0 && (
                  <View style={[styles.notificationItem, { borderBottomColor: isDark ? "#333333" : "#E5E7EB" }]}>
                    <View style={styles.notificationContent}>
                      <View style={[styles.notificationAvatar, styles.avatarPlaceholder, { backgroundColor: "#E5E7EB" }]}>
                        <Ionicons name="people-outline" size={20} color="#9CA3AF" />
                      </View>
                      <View style={styles.notificationText}>
                        <Text style={[styles.notificationTitle, { color: isDark ? "#CCCCCC" : "#666666" }]}>
                          No friend requests
                        </Text>
                        <Text style={[styles.notificationMessage, { color: isDark ? "#999999" : "#999999" }]}>
                          You don't have any pending friend requests
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Pending Matches from API */}
                {pendingMatchesLoading ? (
                  <View style={[styles.notificationItem, { borderBottomColor: isDark ? "#333333" : "#E5E7EB" }]}>
                    <View style={styles.notificationContent}>
                      <View style={[styles.notificationAvatar, styles.avatarPlaceholder, { backgroundColor: "#E5E7EB" }]}>
                        <Text style={[styles.avatarText, { color: "#9CA3AF" }]}>...</Text>
                      </View>
                      <View style={styles.notificationText}>
                        <Text style={[styles.notificationTitle, { color: isDark ? "#CCCCCC" : "#666666" }]}>
                          Loading matches...
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  pendingMatches.map((match) => {
                    console.log("Rendering pending match:", JSON.stringify(match, null, 2));
                    return (
                    <Pressable 
                      key={match.id}
                      style={[styles.notificationItem, { borderBottomColor: isDark ? "#333333" : "#E5E7EB" }]}
                      onPress={() => handleNotificationClick(`pending-match-${match.id}`)}
                    >
                      <View style={styles.notificationContent}>
                        {match.matchedUser?.bgUrl ? (
                          <Image 
                            source={{ uri: match.matchedUser.bgUrl }}
                            style={styles.notificationAvatar}
                          />
                        ) : (
                          <View style={[styles.notificationAvatar, styles.avatarPlaceholder, { backgroundColor: "#EF4444" }]}>
                            <Text style={styles.avatarText}>
                              {match.matchedUser?.fname?.[0] || 'M'}{match.matchedUser?.lname?.[0] || ''}
                            </Text>
                          </View>
                        )}
                        <View style={styles.notificationText}>
                          <View style={styles.notificationHeader}>
                            <Text style={[styles.notificationTitle, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>
                              New Match Found!
                            </Text>
                            <View style={styles.notificationHeaderRight}>
                              <View style={styles.unreadDot} />
                            </View>
                          </View>
                          <Text style={[styles.notificationMessage, { color: isDark ? "#CCCCCC" : "#666666" }]}>
                            You matched with {match.matchedUser?.fname || 'Someone'} {match.matchedUser?.lname || ''} for {match.category?.name || 'Activity'} ({match.compatibility}% compatible)
                          </Text>
                          <Text style={[styles.notificationTime, { color: isDark ? "#999999" : "#999999" }]}>
                            {moment(match.createdAt).fromNow()}
                          </Text>
                        </View>
                        {selectedNotification === `pending-match-${match.id}` && (
                          <View style={styles.verticalActions}>
                            <Pressable 
                              style={[styles.verticalActionButton, { backgroundColor: isDark ? "#1F2937" : "#F3F4F6" }]}
                              onPress={() => markMatchAsViewed(match.id)}
                            >
                              <Ionicons name="checkmark" size={18} color="#10B981" />
                            </Pressable>
                            <Pressable 
                              style={[styles.verticalActionButton, { backgroundColor: isDark ? "#1F2937" : "#F3F4F6" }]}
                              onPress={() => dismissMatch(match.id)}
                            >
                              <Ionicons name="trash-outline" size={18} color="#EF4444" />
                            </Pressable>
                          </View>
                        )}
                      </View>
                    </Pressable>
                    );
                  })
                )}

                {/* Show message when no pending matches */}
                {!pendingMatchesLoading && pendingMatches.length === 0 && (
                  <View style={[styles.notificationItem, { borderBottomColor: isDark ? "#333333" : "#E5E7EB" }]}>
                    <View style={styles.notificationContent}>
                      <View style={[styles.notificationAvatar, styles.avatarPlaceholder, { backgroundColor: "#E5E7EB" }]}>
                        <Ionicons name="heart-outline" size={20} color="#9CA3AF" />
                      </View>
                      <View style={styles.notificationText}>
                        <Text style={[styles.notificationTitle, { color: isDark ? "#CCCCCC" : "#666666" }]}>
                          No new matches
                        </Text>
                        <Text style={[styles.notificationMessage, { color: isDark ? "#999999" : "#999999" }]}>
                          You don't have any pending matches
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Sample Static Notifications */}
                <Pressable 
                  style={[styles.notificationItem, { borderBottomColor: isDark ? "#333333" : "#E5E7EB" }]}
                  onPress={() => handleNotificationClick('new-match')}
                >
                  <View style={styles.notificationContent}>
                    <Image 
                      source={{ uri: 'https://via.placeholder.com/40x40/EF4444/FFFFFF?text=MC' }}
                      style={styles.notificationAvatar}
                    />
                    <View style={styles.notificationText}>
                      <View style={styles.notificationHeader}>
                        <Text style={[styles.notificationTitle, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>
                          New Match Found!
                        </Text>
                        <View style={styles.notificationHeaderRight}>
                          <View style={styles.unreadDot} />
                        </View>
                      </View>
                      <Text style={[styles.notificationMessage, { color: isDark ? "#CCCCCC" : "#666666" }]}>
                        You matched with Mike Chen for Rides (89% compatible)
                      </Text>
                      <Text style={[styles.notificationTime, { color: isDark ? "#999999" : "#999999" }]}>
                        12m ago
                      </Text>
                    </View>
                    {selectedNotification === 'new-match' && (
                      <View style={styles.verticalActions}>
                        <Pressable style={[styles.verticalActionButton, { backgroundColor: isDark ? "#1F2937" : "#F3F4F6" }]}>
                          <Ionicons name="checkmark" size={18} color="#10B981" />
                        </Pressable>
                        <Pressable style={[styles.verticalActionButton, { backgroundColor: isDark ? "#1F2937" : "#F3F4F6" }]}>
                          <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        </Pressable>
                      </View>
                    )}
                  </View>
                </Pressable>

                <Pressable 
                  style={[styles.notificationItem, { borderBottomColor: isDark ? "#333333" : "#E5E7EB" }]}
                  onPress={() => handleNotificationClick('new-follower')}
                >
                  <View style={styles.notificationContent}>
                    <Image 
                      source={{ uri: 'https://via.placeholder.com/40x40/10B981/FFFFFF?text=ED' }}
                      style={styles.notificationAvatar}
                    />
                    <View style={styles.notificationText}>
                      <View style={styles.notificationHeader}>
                        <Text style={[styles.notificationTitle, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>
                          New Follower
                        </Text>
                        <View style={styles.notificationHeaderRight}>
                          <View style={styles.unreadDot} />
                        </View>
                      </View>
                      <Text style={[styles.notificationMessage, { color: isDark ? "#CCCCCC" : "#666666" }]}>
                        Emma Davis started following you
                      </Text>
                      <Text style={[styles.notificationTime, { color: isDark ? "#999999" : "#999999" }]}>
                        1h ago
                      </Text>
                    </View>
                    {selectedNotification === 'new-follower' && (
                      <View style={styles.verticalActions}>
                        <Pressable style={[styles.verticalActionButton, { backgroundColor: isDark ? "#1F2937" : "#F3F4F6" }]}>
                          <Ionicons name="checkmark" size={18} color="#10B981" />
                        </Pressable>
                        <Pressable style={[styles.verticalActionButton, { backgroundColor: isDark ? "#1F2937" : "#F3F4F6" }]}>
                          <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        </Pressable>
                      </View>
                    )}
                  </View>
                </Pressable>

                <Pressable 
                  style={[styles.notificationItem, { borderBottomColor: isDark ? "#333333" : "#E5E7EB" }]}
                  onPress={() => handleNotificationClick('post-liked')}
                >
                  <View style={styles.notificationContent}>
                    <Image 
                      source={{ uri: 'https://via.placeholder.com/40x40/F59E0B/FFFFFF?text=AR' }}
                      style={styles.notificationAvatar}
                    />
                    <View style={styles.notificationText}>
                      <View style={styles.notificationHeader}>
                        <Text style={[styles.notificationTitle, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>
                          Post Liked
                        </Text>
                        <View style={styles.notificationHeaderRight}>
                          {/* No unread dot for read notifications */}
                        </View>
                      </View>
                      <Text style={[styles.notificationMessage, { color: isDark ? "#CCCCCC" : "#666666" }]}>
                        Alex Rivera liked your Tarp
                      </Text>
                      <Text style={[styles.notificationTime, { color: isDark ? "#999999" : "#999999" }]}>
                        2h ago
                      </Text>
                    </View>
                    {selectedNotification === 'post-liked' && (
                      <View style={styles.verticalActions}>
                        <Pressable style={[styles.verticalActionButton, { backgroundColor: isDark ? "#1F2937" : "#F3F4F6" }]}>
                          <Ionicons name="checkmark" size={18} color="#10B981" />
                        </Pressable>
                        <Pressable style={[styles.verticalActionButton, { backgroundColor: isDark ? "#1F2937" : "#F3F4F6" }]}>
                          <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        </Pressable>
                      </View>
                    )}
                  </View>
                </Pressable>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>
      </>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    leftContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    titleContainer: {
      flex: 2,
      justifyContent: "center",
    },
    iconsContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flex: 1,
      justifyContent: "flex-end",
    },
    notificationButton: {
      padding: 8,
      position: "relative",
    },
    notificationBadge: {
      position: "absolute",
      top: 2,
      right: 2,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: "#EF4444",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 4,
    },
    notificationBadgeText: {
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: "700",
    },
    iconButton: {
      padding: 8,
    },
    chatButton: {
      borderRadius: 20,
      paddingVertical: 8,
      paddingHorizontal: 14,
      position: "relative",
    },
    chatContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    chatText: {
      fontSize: 13,
      fontWeight: "600",
    },
    badge: {
      position: "absolute",
      top: -14,
      right: -17,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: "#EF4444",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 4,
    },

    badgeText: {
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: "700",
    },
    // Notification Panel Styles
    modalOverlay: {
      flex: 1,
      flexDirection: "row",
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    notificationPanel: {
      width: Dimensions.get('window').width * 0.85,
      maxWidth: 400,
      height: "100%",
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
      elevation: 10,
      shadowColor: "#000",
      shadowOffset: { width: -2, height: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
    },
    panelHeader: {
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: "#E5E7EB",
    },
    panelHeaderContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 16,
    },
    panelTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    bellIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    panelTitle: {
      fontSize: 18,
      fontWeight: "700",
    },
    panelSubtitle: {
      fontSize: 14,
      marginTop: 2,
    },
    closeButton: {
      padding: 4,
    },
    actionButtons: {
      flexDirection: "row",
      gap: 16,
      marginBottom: 16,
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: "500",
    },
    filterTabs: {
      flexDirection: "row",
      gap: 8,
    },
    filterTab: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      gap: 8,
    },
    activeTab: {
      // backgroundColor set dynamically
    },
    filterTabText: {
      fontSize: 14,
      fontWeight: "500",
    },
    activeTabText: {
      fontWeight: "600",
    },
    tabBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      minWidth: 20,
      alignItems: "center",
    },
    tabBadgeText: {
      fontSize: 12,
      fontWeight: "600",
    },
    unreadBadge: {
      backgroundColor: "#0a0a0a",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      minWidth: 20,
      alignItems: "center",
    },
    unreadBadgeText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "600",
    },
    notificationsList: {
      flex: 1,
    },
    notificationItem: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
    },
    notificationContent: {
      flexDirection: "row",
      gap: 12,
    },
    notificationAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    avatarPlaceholder: {
      justifyContent: "center",
      alignItems: "center",
    },
    avatarText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "700",
    },
    notificationText: {
      flex: 1,
    },
    notificationHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    notificationHeaderRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    notificationTitle: {
      fontSize: 14,
      fontWeight: "600",
      flex: 1,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#3B82F6",
    },
    verticalActions: {
      flexDirection: "column",
      gap: 8,
      marginLeft: 12,
      alignItems: "center",
    },
    verticalActionButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    notificationMessage: {
      fontSize: 13,
      lineHeight: 18,
      marginBottom: 8,
    },
    notificationTime: {
      fontSize: 12,
      marginBottom: 8,
    },
    notificationActions: {
      flexDirection: "row",
      gap: 8,
    },
    acceptButton: {
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 16,
    },
    acceptButtonText: {
      fontSize: 12,
      fontWeight: "600",
    },
    declineButton: {
      paddingHorizontal: 16,
      paddingVertical: 6,
    },
    declineButtonText: {
      fontSize: 12,
      fontWeight: "500",
    },
  });

  export default Header;
