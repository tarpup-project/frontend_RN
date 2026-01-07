import { api } from "@/api/client";
import AuthModal from "@/components/AuthModal";
import { Text } from "@/components/Themedtext";
import { UrlConstants } from "@/constants/apiUrls";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotifications } from "@/hooks/useNotification";
import { useAuthStore } from "@/state/authStore";
import { useNotificationStore } from "@/state/notificationStore";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from "expo-status-bar";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Dimensions, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";

// Notification Item Component
const NotificationItem = ({ notification, isDark, onFriendRequest, isLocallyRead, onNotificationClick }: {
  notification: any;
  isDark: boolean;
  onFriendRequest: (id: string, action: 'accept' | 'decline') => void;
  isLocallyRead: boolean;
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
      {!notification.isRead && !isLocallyRead && (
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
        ['new_comment', 'comment', 'new_like', 'like', 'new_match', 'match'].includes(notification.type?.toLowerCase())) && (
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
  } = useNotificationStore();
  const { groupNotifications, personalNotifications: apiPersonalNotifications } = useNotifications();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set());

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;

  // SecureStore key for read notifications
  const READ_NOTIFICATIONS_KEY = 'read_notification_ids';

  // Load read notification IDs from SecureStore
  const loadReadNotificationIds = async () => {
    try {
      const storedIds = await SecureStore.getItemAsync(READ_NOTIFICATIONS_KEY);
      if (storedIds) {
        const idsArray = JSON.parse(storedIds);
        setReadNotificationIds(new Set(idsArray));
        console.log('Loaded read notification IDs:', idsArray.length);
      }
    } catch (error) {
      console.error('Error loading read notification IDs:', error);
    }
  };

  // Save read notification IDs to SecureStore
  const saveReadNotificationIds = async (ids: Set<string>) => {
    try {
      const idsArray = Array.from(ids);
      await SecureStore.setItemAsync(READ_NOTIFICATIONS_KEY, JSON.stringify(idsArray));
      console.log('Saved read notification IDs:', idsArray.length);
    } catch (error) {
      console.error('Error saving read notification IDs:', error);
    }
  };

  // Mark notification as read locally
  const markNotificationAsRead = async (notificationId: string) => {
    const newReadIds = new Set([...readNotificationIds, notificationId]);
    setReadNotificationIds(newReadIds);
    await saveReadNotificationIds(newReadIds);
  };

  // Mark all visible notifications as read when closing sidebar
  const markAllVisibleAsRead = async () => {
    const visibleNotificationIds = notifications.map(notif => notif.id);
    const newReadIds = new Set([...readNotificationIds, ...visibleNotificationIds]);
    setReadNotificationIds(newReadIds);
    await saveReadNotificationIds(newReadIds);
    
    // Update unread count
    updateUnreadCount(notifications, newReadIds);
    
    console.log('Marked all visible notifications as read:', visibleNotificationIds.length);
  };

  // Update unread count based on notifications and read IDs
  const updateUnreadCount = (notificationsList: any[], readIds: Set<string>) => {
    const unread = notificationsList.filter((notif: any) => 
      !notif.isRead && !readIds.has(notif.id)
    ).length;
    setUnreadCount(unread);
  };

  // Fetch notifications from the new endpoint
  const fetchNotifications = async () => {
    if (!isAuthenticated || isLoadingNotifications) return;
    
    try {
      setIsLoadingNotifications(true);
      const response = await api.get(UrlConstants.tarpNotifications);
      
      if (response.data?.status === 'success' && response.data?.data) {
        const notificationsList = Array.isArray(response.data.data) ? response.data.data : [];
        setNotifications(notificationsList);
        
        // Count unread notifications (server isRead + local read IDs)
        updateUnreadCount(notificationsList, readNotificationIds);
        
        console.log('Notifications loaded:', { 
          total: notificationsList.length, 
          unread: notificationsList.filter((notif: any) => !notif.isRead && !readNotificationIds.has(notif.id)).length,
          locallyRead: Array.from(readNotificationIds).length,
          sample: notificationsList[0] ? {
            id: notificationsList[0].id,
            type: notificationsList[0].type,
            message: notificationsList[0].message?.substring(0, 50),
            hasActors: !!notificationsList[0].actors,
            actorName: notificationsList[0].actors?.[0]?.actor?.fname,
            bgUrl: notificationsList[0].actors?.[0]?.actor?.bgUrl?.substring(0, 50),
            data: notificationsList[0].data,
            postID: notificationsList[0].data?.postID
          } : null
        });
      } else {
        console.log('No notifications found or invalid response format');
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      if (error.response?.status !== 401) {
        toast.error('Failed to load notifications');
      }
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      // Mark all notifications as read locally
      const allNotificationIds = notifications.map(notif => notif.id);
      const newReadIds = new Set([...readNotificationIds, ...allNotificationIds]);
      setReadNotificationIds(newReadIds);
      await saveReadNotificationIds(newReadIds);
      
      // Update unread count
      setUnreadCount(0);
      
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    try {
      setNotifications([]);
      setUnreadCount(0);
      
      // TODO: Add API call to clear all notifications on server
      toast.success('All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error('Failed to clear notifications');
    }
  };

  // Handle individual notification click
  const handleNotificationClick = async (notificationId: string) => {
    // Mark this notification as read
    await markNotificationAsRead(notificationId);
    
    // Update unread count
    updateUnreadCount(notifications, new Set([...readNotificationIds, notificationId]));
    
    // Find the notification to get navigation data
    const notification = notifications.find(notif => notif.id === notificationId);
    
    if (notification) {
      // Handle navigation based on notification type
      handleNotificationNavigation(notification);
    }
    
    console.log('Notification clicked and marked as read:', notificationId);
  };

  // Handle navigation based on notification type and data
  const handleNotificationNavigation = async (notification: any) => {
    try {
      const notificationType = notification.type?.toLowerCase();
      const data = notification.data;
      
      console.log('Navigating from notification:', {
        type: notificationType,
        data: data,
        postID: data?.postID
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
          // Navigate to profile screen
          router.push('/profile/me');
          break;
          
        case 'friend_request':
        case 'new_friend_request':
          // Navigate to profile screen
          router.push('/profile/me');
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
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      toast.success(action === 'accept' ? 'Friend request accepted' : 'Friend request declined');
    } catch (error) {
      console.error('Error handling friend request:', error);
      toast.error(`Failed to ${action} friend request`);
    }
  };

  const totalNotifications = notifications.length;

  // Load read notification IDs on mount
  useEffect(() => {
    loadReadNotificationIds();
  }, []);

  // Load notifications when authenticated
  useEffect(() => {
    if (isAuthenticated && !initialized) {
      markInitialized();
      fetchNotifications();
    }
  }, [isAuthenticated, initialized, markInitialized]);

  // Refresh notifications when panel opens
  useEffect(() => {
    if (showNotificationPanel && isAuthenticated) {
      fetchNotifications();
    }
  }, [showNotificationPanel, isAuthenticated]);

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
              {notifications.length > 0 && (
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
              {notifications.length > 0 && (
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
                        {notifications.length}
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
                        {notifications.filter(notif => !notif.isRead && !readNotificationIds.has(notif.id)).length}
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
              ) : notifications.length === 0 ? (
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
                  {notifications
                    .filter(notif => {
                      const isRead = notif.isRead || readNotificationIds.has(notif.id);
                      return activeTab === 'all' || !isRead;
                    })
                    .map((notification, index) => (
                      <NotificationItem
                        key={notification.id || index}
                        notification={notification}
                        isDark={isDark}
                        onFriendRequest={handleFriendRequest}
                        isLocallyRead={readNotificationIds.has(notification.id)}
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
    top: -4,
    right: -4,
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