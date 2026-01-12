import { api } from "@/api/client";
import AuthModal from "@/components/AuthModal";
import { Text } from "@/components/Themedtext";
import { UrlConstants } from "@/constants/apiUrls";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotifications } from "@/hooks/useNotification";
import { usePendingMatches } from "@/hooks/usePendingMatches";
import { useAuthStore } from "@/state/authStore";
import { useNotificationStore } from "@/state/notificationStore";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Dimensions, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";

// Notification Item Component
  const NotificationItem = ({ notification, isDark, onFriendRequest, onNotificationClick }: {
    notification: any;
    isDark: boolean;
    onFriendRequest: (id: string, action: 'accept' | 'decline') => void;
    onNotificationClick: (id: string) => void;
  }) => {
  // Helper function to get user info from the notification
  const getUserInfo = () => {
    const actor = notification.actors?.[0]?.actor;
    if (actor) {
      return {
        name: actor.fname && actor.lname ? `${actor.fname} ${actor.lname}` : (actor.fname || actor.name || 'User'),
        avatar: actor.bgUrl || actor.avatar || actor.profileImage,
        firstName: actor.fname || actor.name || 'User'
      };
    }
    
    // Fallback to notification.user if no actors
    const user = notification.user;
    if (user) {
      return {
        name: user.name || (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName || 'User'),
        avatar: user.avatar || user.profileImage,
        firstName: user.firstName || user.name || 'User'
      };
    }
    
    return {
      name: 'User',
      avatar: null,
      firstName: 'User'
    };
  };

  const userInfo = getUserInfo();
  const getNotificationIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'friend_request':
      case 'new_friend_request':
        return 'person-add';
      case 'match':
      case 'new_match':
        return 'heart';
      case 'follower':
      case 'new_follower':
      case 'new_following':
        return 'person-add-outline';
      case 'like':
      case 'new_like':
        return 'heart-outline';
      case 'comment':
      case 'new_comment':
        return 'chatbubble-outline';
      default:
        return 'notifications';
    }
  };

  const getNotificationTitle = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'friend_request':
        return 'New Friend Request';
      case 'new_match':
      case 'match':
        return 'New Match Found!';
      case 'new_follower':
      case 'follower':
      case 'new_following':
        return 'New Follower';
      case 'new_like':
      case 'like':
        return 'Post Liked';
      case 'new_comment':
      case 'comment':
        return 'New Comment';
      default:
        return 'Notification';
    }
  };

  const renderAvatar = () => {
    if (userInfo.avatar) {
      return (
        <ExpoImage 
          source={{ uri: userInfo.avatar }} 
          style={styles.notificationAvatar}
          contentFit="cover"
        />
      );
    }
    
    // Default avatar with user's initial
    const initial = userInfo.firstName[0] || 'U';
    
    return (
      <View style={[styles.notificationAvatar, styles.defaultAvatar, { backgroundColor: '#4F46E5' }]}>
        <Text style={styles.avatarText}>{initial.toUpperCase()}</Text>
      </View>
    );
  };

  return (
    <Pressable 
      style={[
        styles.notificationItem, 
        { 
          backgroundColor: isDark ? "#2a2a2a" : "#FFFFFF",
          borderBottomColor: isDark ? "#333333" : "#F3F4F6"
        }
      ]}
      onPress={() => onNotificationClick(notification.id)}
      android_ripple={{ color: isDark ? "#444444" : "#F3F4F6" }}
    >
      {/* Unread indicator */}
      {!notification.isRead && (
        <View style={styles.unreadIndicator} />
      )}
      
      {/* Avatar */}
      {renderAvatar()}
      
      {/* Content */}
      <View style={styles.notificationContent}>
        <Text style={[styles.notificationTitle, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>
          {getNotificationTitle(notification.type)}
        </Text>
        
        <Text style={[styles.notificationMessage, { color: isDark ? "#CCCCCC" : "#666666" }]}>
          {(notification.message || notification.content || 'No message').replace(/\s+/g, ' ').trim()}
        </Text>
        
        <Text style={[styles.notificationTime, { color: isDark ? "#999999" : "#999999" }]}>
          {moment(notification.createdAt || notification.updatedAt || notification.timestamp).fromNow()}
        </Text>
        
        {/* Friend Request Actions */}
        {(notification.type?.toLowerCase() === 'friend_request' || notification.type?.toLowerCase() === 'new_friend_request') && (
          <View style={styles.friendRequestActions}>
            <Pressable 
              style={[styles.acceptButton, { backgroundColor: isDark ? "#FFFFFF" : "#0a0a0a" }]}
              onPress={(e) => {
                e.stopPropagation(); // Prevent notification click
                onFriendRequest(notification.id, 'accept');
              }}
            >
              <Text style={[styles.acceptButtonText, { color: isDark ? "#0a0a0a" : "#FFFFFF" }]}>
                Accept
              </Text>
            </Pressable>
            
            <Pressable 
              style={[styles.declineButton, { borderColor: isDark ? "#666666" : "#CCCCCC" }]}
              onPress={(e) => {
                e.stopPropagation(); // Prevent notification click
                onFriendRequest(notification.id, 'decline');
              }}
            >
              <Text style={[styles.declineButtonText, { color: isDark ? "#CCCCCC" : "#666666" }]}>
                Decline
              </Text>
            </Pressable>
          </View>
        )}
      </View>
      
      {/* Navigation Arrow - only show for navigable notifications */}
      {(notification.data?.postID || 
        ['new_comment', 'comment', 'new_like', 'like', 'new_match', 'match', 'new_follower', 'follower', 'new_following', 'friend_request', 'new_friend_request'].includes(notification.type?.toLowerCase())) && (
        <View style={styles.navigationArrow}>
          <Ionicons name="chevron-forward" size={16} color={isDark ? "#666666" : "#CCCCCC"} />
        </View>
      )}
    </Pressable>
  );
};

const Header = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const { isAuthenticated } = useAuthStore();
  const {
    personalNotifications,
    clearNotifications,
    initialized,
    markInitialized,
    setNotifications: setGlobalNotifications,
    unreadCount,
    notificationsList,
    setNotificationsList,
  } = useNotificationStore();
  const { 
    groupNotifications, 
    personalNotifications: apiPersonalNotifications,
    refetchNotifications
  } = useNotifications();
  const { pendingMatches, markMatchAsViewed, unviewedCount } = usePendingMatches();
  const unviewedMatchesCount = unviewedCount !== undefined ? unviewedCount : pendingMatches.length;

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  // notifications state replaced by store
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');



  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;

  // Mark all visible notifications as read when closing sidebar
  const markAllVisibleAsRead = async () => {
    // Get IDs of unread notifications that are visible
    const unreadNotificationIds = notificationsList
      .filter(notif => !notif.isRead)
      .map(notif => notif.id);
    
    if (unreadNotificationIds.length === 0) {
      return;
    }

    try {
      // Call API to mark notifications as read
      await api.put(UrlConstants.tarpNotifications, {
        notificationIDs: unreadNotificationIds
      });
      
      // Update local state to reflect read status
      setNotificationsList(notificationsList.map(notif => 
          unreadNotificationIds.includes(notif.id) 
            ? { ...notif, isRead: true } 
            : notif
        )
      );
      
      setGlobalNotifications({ unreadCount: 0 });
      console.log('Marked notifications as read on server:', unreadNotificationIds.length);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  // Update unread count based on notifications
  const updateUnreadCount = (notificationsList: any[]) => {
    const unread = notificationsList.filter((notif: any) => !notif.isRead).length;
    setGlobalNotifications({ unreadCount: unread });
  };

  // Fetch notifications from the new endpoint
  const fetchNotifications = async () => {
    if (!isAuthenticated || isLoadingNotifications) return;
    
    try {
      setIsLoadingNotifications(true);
      await refetchNotifications();
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      if (error.response?.status !== 401) {
        toast.error('Failed to load notifications');
      }
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const unreadIds = notificationsList.filter(n => !n.isRead).map(n => n.id);
      
      if (unreadIds.length > 0) {
        await api.put(UrlConstants.tarpNotifications, {
          notificationIDs: unreadIds
        });

        // Update local state
        setNotificationsList(notificationsList.map(n => ({ ...n, isRead: true })));
        setGlobalNotifications({ unreadCount: 0 });
        toast.success('All notifications marked as read');
      } else {
        toast.success('All notifications are already read');
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    try {
      setNotificationsList([]);
      setGlobalNotifications({ unreadCount: 0 });
      
      // TODO: Add API call to clear all notifications on server
      toast.success('All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error('Failed to clear notifications');
    }
  };

  // Handle individual notification click
  const handleNotificationClick = async (notificationId: string) => {
    // Find the notification to get navigation data
    const notification = notificationsList.find(notif => notif.id === notificationId);
    
    // Mark this notification as read on server if it's not already read
    if (notification && !notification.isRead) {
      try {
        await api.put(UrlConstants.tarpNotifications, {
          notificationIDs: [notificationId]
        });
        
        // Update local state
        setNotificationsList(notificationsList.map(n => 
          n.id === notificationId ? { ...n, isRead: true } : n
        ));
        
        // Update unread count
        const newCount = Math.max(0, unreadCount - 1);
        setGlobalNotifications({ unreadCount: newCount });
      } catch (error) {
        console.error('Error marking single notification as read:', error);
      }
    }
    
    if (notification) {
      // Handle navigation based on notification type
      handleNotificationNavigation(notification);
    }
    
    console.log('Notification clicked:', notificationId);
  };

  // Handle navigation based on notification type and data
  const handleNotificationNavigation = async (notification: any) => {
    try {
      const notificationType = notification.type?.toLowerCase();
      const data = notification.data;
      
      console.log('Navigating from notification:', {
        type: notificationType,
        data: data,
        postID: data?.postID,
        actors: notification.actors,
        firstActorId: notification.actors?.[0]?.actor?.id,
        firstActorName: notification.actors?.[0]?.actor?.fname
      });
      
      // Close the notification panel first
      setShowNotificationPanel(false);
      
      // Add a small delay to allow panel to close smoothly
      setTimeout(async () => {
        // Navigate based on notification type
        switch (notificationType) {
        case 'new_comment':
        case 'comment':
        case 'new_like':
        case 'like':
          // Navigate to post if postID is available
          if (data?.postID) {
            console.log('Fetching post data for navigation:', data.postID);
            await navigateToPost(data.postID);
          } else {
            console.warn('No postID found in notification data');
            toast.error('Unable to navigate to post');
          }
          break;
          
        case 'new_match':
        case 'match':
          // Navigate to matches screen - using the correct route
          router.push('/matches/list');
          break;
          
        case 'new_follower':
        case 'follower':
        case 'new_following':
          // Navigate to follower's profile using their ID from actors
          const followerActor = notification.actors?.[0]?.actor;
          if (followerActor?.id) {
            console.log('Navigating to follower profile:', followerActor.id);
            router.push(`/profile/${followerActor.id}`);
          } else {
            console.warn('No follower ID found in notification actors');
            // Fallback to user's own profile
            router.push('/profile/me');
          }
          break;
          
        case 'friend_request':
        case 'new_friend_request':
          // Navigate to friend requester's profile using their ID from actors
          const requesterActor = notification.actors?.[0]?.actor;
          if (requesterActor?.id) {
            console.log('Navigating to friend requester profile:', requesterActor.id);
            router.push(`/profile/${requesterActor.id}`);
          } else {
            console.warn('No requester ID found in notification actors');
            // Fallback to user's own profile
            router.push('/profile/me');
          }
          break;
          
        default:
          console.log('No specific navigation for notification type:', notificationType);
          // For unknown types, try to navigate to post if postID exists
          if (data?.postID) {
            await navigateToPost(data.postID);
          }
          break;
      }
      }, 300); // Small delay to allow smooth panel closing
    } catch (error) {
      console.error('Error navigating from notification:', error);
      toast.error('Navigation failed');
    }
  };

  // Fetch post data and navigate to post screen (using tarps/stats/posts endpoint)
  const navigateToPost = async (postId: string) => {
    try {
      console.log('Fetching posts data to find post ID:', postId);
      
      // Show loading toast
      toast.loading('Loading post...');
      
      // Fetch both posts data and authenticated user data
      const [postsResponse, authResponse] = await Promise.all([
        api.get(UrlConstants.tarpStatsPosts),
        api.get(UrlConstants.fetchAuthUser)
      ]);
      
      // Dismiss loading toast
      toast.dismiss();
      
      if (postsResponse.data?.status === 'success' && postsResponse.data?.data) {
        const allPosts = postsResponse.data.data;
        
        // Find the specific post by ID
        const postItem = allPosts.find((post: any) => post.id === postId);
        
        if (!postItem) {
          console.error('Post not found in stats data:', postId);
          toast.error('Post not found');
          return;
        }
        
        // Get authenticated user data
        const authUser = authResponse.data?.status === 'success' ? authResponse.data.data : null;
        
        console.log('Post found in stats data:', {
          id: postItem.id,
          caption: postItem.caption?.substring(0, 50),
          hasImages: !!postItem.images,
          imageCount: postItem.images?.length || 0,
          location: postItem.location,
          tarpImgComments: postItem.tarpImgComments,
          tarpImgLikes: postItem.tarpImgLikes,
          firstImageComments: postItem.images?.[0]?._count?.tarpImgComments
        });
        
        console.log('Auth user data:', {
          id: authUser?.id,
          fname: authUser?.fname,
          lname: authUser?.lname,
          bgUrl: authUser?.bgUrl?.substring(0, 50) + '...'
        });
        
        // Enhance post item with authenticated user data
        const enhancedPostItem = {
          ...postItem,
          // Add creator/owner data from authenticated user
          creator: authUser ? {
            id: authUser.id,
            fname: authUser.fname,
            lname: authUser.lname,
            name: `${authUser.fname} ${authUser.lname}`.trim(),
            bgUrl: authUser.bgUrl,
            avatar: authUser.bgUrl,
            profileImage: authUser.bgUrl
          } : postItem.creator,
          owner: authUser ? {
            id: authUser.id,
            fname: authUser.fname,
            lname: authUser.lname,
            name: `${authUser.fname} ${authUser.lname}`.trim(),
            bgUrl: authUser.bgUrl,
            avatar: authUser.bgUrl,
            profileImage: authUser.bgUrl
          } : postItem.owner,
          // Remove friend/follow status since it's the user's own post
          isFriend: null,
          isFollowing: null,
          friendStatus: null,
          following: null,
          // Ensure comment count is properly set from the post data
          commentsCount: postItem.tarpImgComments || 0,
          // Also set it at image level for consistency
          images: postItem.images?.map((img: any) => ({
            ...img,
            comments: img._count?.tarpImgComments || 0,
            likes: img._count?.tarpImgLikes || 0
          })) || []
        };
        
        // Process images using the exact structure from the API response
        const resolveItemImageSet = (item: any) => {
          const urls: string[] = [];
          const ids: (string | null)[] = [];
          
          if (Array.isArray(item.images)) {
            item.images.forEach((img: any) => {
              if (img.url) {
                // URLs are already complete from the API response
                urls.push(img.url);
                ids.push(img.id ? String(img.id) : null);
              }
            });
          }
          
          return { urls, ids };
        };
        
        const imageSet = resolveItemImageSet(enhancedPostItem);
        
        console.log('Image set processed:', {
          urlCount: imageSet.urls.length,
          idCount: imageSet.ids.length,
          firstUrl: imageSet.urls[0]?.substring(0, 50) + '...',
          firstId: imageSet.ids[0]
        });
        
        // Navigate to post screen with proper parameters (same as tarps.tsx)
        const navigationUrl = `/post/${enhancedPostItem.id}?item=${encodeURIComponent(JSON.stringify(enhancedPostItem))}&images=${encodeURIComponent(JSON.stringify(imageSet))}&idx=0&serverPosts=${encodeURIComponent(JSON.stringify(allPosts))}`;
        
        console.log('Navigating to post with complete data:', {
          postId: enhancedPostItem.id,
          imageCount: imageSet.urls.length,
          hasServerPosts: allPosts.length > 0,
          hasAuthUser: !!authUser,
          creatorName: enhancedPostItem.creator?.name,
          commentCount: enhancedPostItem.commentsCount || enhancedPostItem.tarpImgComments || 0,
          likeCount: enhancedPostItem.tarpImgLikes || 0,
          navigationUrlLength: navigationUrl.length
        });
        
        router.push(navigationUrl as any);
        
      } else {
        console.error('Failed to fetch posts data:', postsResponse.data);
        toast.error('Failed to load posts');
      }
    } catch (error: any) {
      console.error('Error fetching posts data:', error);
      
      // Dismiss loading toast
      toast.dismiss();
      
      if (error.response?.status === 404) {
        toast.error('Posts not found');
      } else if (error.response?.status === 401) {
        toast.error('Please log in to view posts');
      } else {
        toast.error('Failed to load post');
      }
    }
  };

  // Handle friend request actions
  const handleFriendRequest = async (notificationId: string, action: 'accept' | 'decline') => {
    try {
      // TODO: Add API call to handle friend request
      
      // Update local state
      setNotificationsList(notificationsList.filter(notif => notif.id !== notificationId));
      const newCount = Math.max(0, unreadCount - 1);
      setGlobalNotifications({ unreadCount: newCount });
      
      toast.success(action === 'accept' ? 'Friend request accepted' : 'Friend request declined');
    } catch (error) {
      console.error('Error handling friend request:', error);
      toast.error(`Failed to ${action} friend request`);
    }
  };

  const totalNotifications = notificationsList.length;

  // Refresh notifications when panel opens
  useEffect(() => {
    if (showNotificationPanel && isAuthenticated) {
      fetchNotifications();
    }
  }, [showNotificationPanel, isAuthenticated]);

  useEffect(() => {
    // Start pulse animation if there are notifications or pending matches
    if ((notificationsList.some((n: any) => !n.isRead) || unviewedMatchesCount > 0) && isAuthenticated) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
        ).start();
      } else {
        pulseAnim.setValue(1);
      }
    }, [notificationsList, unviewedMatchesCount, isAuthenticated]);

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

  const handleCloseNotificationPanel = async () => {
    // Mark all visible notifications as read when closing
    await markAllVisibleAsRead();
    
    // Slide out animation
    Animated.timing(slideAnim, {
      toValue: Dimensions.get('window').width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowNotificationPanel(false);
    });
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
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
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
                  AI Chat
                </Text>
              </View>
              {/* Show badge for pending matches */}
              {unviewedMatchesCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unviewedMatchesCount > 9 ? '9+' : unviewedMatchesCount}
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
                backgroundColor: isDark ? "#1a1a1a" : "#FFFFFF",
                transform: [{ translateX: slideAnim }]
              }
            ]}
          >
            {/* Panel Header */}
            <View style={[styles.panelHeader, { paddingTop: insets.top + 12, borderBottomColor: isDark ? "#333333" : "#E5E7EB" }]}>
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
                      {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
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
              {notificationsList.length > 0 && (
                <View style={styles.actionButtonsRow}>
                  <Pressable 
                    style={[styles.actionButton, { backgroundColor: isDark ? "#333333" : "#F3F4F6" }]}
                    onPress={markAllAsRead}
                  >
                    <Ionicons name="checkmark" size={16} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
                    <Text style={[styles.actionButtonText, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>
                      Mark all read
                    </Text>
                  </Pressable>
                  
                  <Pressable 
                    style={styles.clearButton}
                    onPress={clearAllNotifications}
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    <Text style={styles.clearButtonText}>
                      Clear all
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* Tab Selector */}
              {notificationsList.length > 0 && (
                <View style={[styles.tabSelector, { backgroundColor: isDark ? "#333333" : "#F3F4F6" }]}>
                  <Pressable 
                    style={[
                      styles.tab, 
                      activeTab === 'all' && styles.activeTab,
                      activeTab === 'all' && { backgroundColor: isDark ? "#FFFFFF" : "#0a0a0a" }
                    ]}
                    onPress={() => setActiveTab('all')}
                  >
                    <Text style={[
                      styles.tabText, 
                      { color: activeTab === 'all' ? (isDark ? "#0a0a0a" : "#FFFFFF") : (isDark ? "#CCCCCC" : "#666666") }
                    ]}>
                      All
                    </Text>
                    <View style={[
                      styles.tabBadge, 
                      { backgroundColor: activeTab === 'all' ? (isDark ? "#666666" : "#CCCCCC") : (isDark ? "#555555" : "#E5E7EB") }
                    ]}>
                      <Text style={[
                        styles.tabBadgeText,
                        { color: activeTab === 'all' ? "#FFFFFF" : (isDark ? "#CCCCCC" : "#666666") }
                      ]}>
                        {notificationsList.length}
                      </Text>
                    </View>
                  </Pressable>
                  
                  <Pressable 
                    style={[
                      styles.tab, 
                      activeTab === 'unread' && styles.activeTab,
                      activeTab === 'unread' && { backgroundColor: isDark ? "#FFFFFF" : "#0a0a0a" }
                    ]}
                    onPress={() => setActiveTab('unread')}
                  >
                    <Text style={[
                      styles.tabText, 
                      { color: activeTab === 'unread' ? (isDark ? "#0a0a0a" : "#FFFFFF") : (isDark ? "#CCCCCC" : "#666666") }
                    ]}>
                      Unread
                    </Text>
                    <View style={[
                      styles.tabBadge, 
                      { backgroundColor: activeTab === 'unread' ? (isDark ? "#666666" : "#CCCCCC") : (isDark ? "#555555" : "#E5E7EB") }
                    ]}>
                      <Text style={[
                        styles.tabBadgeText,
                        { color: activeTab === 'unread' ? "#FFFFFF" : (isDark ? "#CCCCCC" : "#666666") }
                      ]}>
                        {notificationsList.filter(notif => !notif.isRead).length}
                      </Text>
                    </View>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Notifications List */}
            <ScrollView style={styles.notificationsList} showsVerticalScrollIndicator={false}>
              {isLoadingNotifications ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={isDark ? "#FFFFFF" : "#0a0a0a"} />
                  <Text style={[styles.loadingText, { color: isDark ? "#CCCCCC" : "#666666" }]}>
                    Loading notifications...
                  </Text>
                </View>
              ) : notificationsList.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="notifications-off-outline" size={48} color="#9CA3AF" />
                  <Text style={[styles.emptyText, { color: isDark ? "#CCCCCC" : "#666666" }]}>
                    No notifications
                  </Text>
                  <Text style={[styles.emptySubtext, { color: isDark ? "#999999" : "#999999" }]}>
                    You're all caught up! New notifications will appear here.
                  </Text>
                </View>
              ) : (
                <View style={styles.notificationsContainer}>
                  {notificationsList
                    .filter(notif => {
                      return activeTab === 'all' || !notif.isRead;
                    })
                    .map((notification, index) => (
                      <NotificationItem
                          key={notification.id}
                          notification={notification}
                          isDark={isDark}
                          onFriendRequest={handleFriendRequest}
                          onNotificationClick={handleNotificationClick}
                        />
                    ))}
                </View>
              )}
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
  },
  iconsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  notificationButton: {
    position: "relative",
    padding: 8,
  },
  notificationBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  iconButton: {
    padding: 8,
  },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    position: "relative",
  },
  chatContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chatText: {
    fontSize: 14,
    fontWeight: "600",
  },
  badge: {
    position: "absolute",
    top: -16,
    right: -18,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalBackdrop: {
    flex: 1,
  },
  notificationPanel: {
    position: "absolute",
    top: 0,
    right: 0,
    width: Dimensions.get('window').width * 0.85,
    height: "100%",
    shadowColor: "#000",
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  panelHeader: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  panelHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    alignItems: "center",
    justifyContent: "center",
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
    padding: 8,
  },
  actionButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EF4444",
  },
  tabSelector: {
    flexDirection: "row",
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  activeTab: {
    // backgroundColor set dynamically
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  tabBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: "center",
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  notificationsList: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  notificationsContainer: {
    paddingVertical: 8,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    position: "relative",
  },
  unreadIndicator: {
    position: "absolute",
    left: 8,
    top: "50%",
    marginTop: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3B82F6",
  },
  notificationAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  defaultAvatar: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    marginBottom: 12,
  },
  friendRequestActions: {
    flexDirection: "row",
    gap: 12,
  },
  acceptButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  declineButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  declineButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  navigationArrow: {
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 8,
  },
});

export default Header;