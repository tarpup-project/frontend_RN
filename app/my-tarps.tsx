import { api } from "@/api/client";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuthStore } from "@/state/authStore";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import moment from "moment";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { toast } from "sonner-native";

export default function MyTarpsScreen() {
  const { isDark } = useTheme();
  const { user } = useAuthStore();
  const nav = useRouter();

  // State
  const [profileStats, setProfileStats] = useState<{
    posts: number;
    photos: number;
    likes: number;
    comments: number;
  } | null>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<any | null>(null);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [showPostPreview, setShowPostPreview] = useState(false);
  const [postToPreview, setPostToPreview] = useState<any | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDropdownMenu, setShowDropdownMenu] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });

  // Function to fetch profile stats
  const fetchProfileStats = async () => {
    try {
      const response = await api.get('/tarps/stats');
      setProfileStats(response.data.data);
    } catch (error) {
      console.error('Error fetching profile stats:', error);
      toast.error('Failed to load profile stats');
    }
  };

  // Function to fetch user posts
  const fetchUserPosts = async () => {
    try {
      const response = await api.get('/tarps/stats/posts');
      setUserPosts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching user posts:', error);
      toast.error('Failed to load posts');
    }
  };

  // Combined function to load all data
  const loadAllData = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      await Promise.all([
        fetchProfileStats(),
        fetchUserPosts()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to delete post
  const deletePost = async (postId: string) => {
    try {
      setIsDeletingPost(true);
      await api.delete(`/tarps/posts/${postId}`);
      
      // Remove from local state
      setUserPosts(prev => prev.filter(post => post.id !== postId));
      
      // Update stats
      if (profileStats) {
        setProfileStats(prev => prev ? {
          ...prev,
          posts: prev.posts - 1
        } : null);
      }
      
      toast.success('Post deleted successfully');
      setShowDeleteModal(false);
      setPostToDelete(null);
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    } finally {
      setIsDeletingPost(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const formatLocation = (location: string) => {
    if (!location) return '';
    
    // Remove numbers (zip codes, postal codes, etc.)
    const withoutNumbers = location.replace(/\d+/g, '').trim();
    
    // Split by comma and clean up
    const parts = withoutNumbers.split(',').map(part => part.trim()).filter(part => part.length > 0);
    
    // Take the last two parts (typically state/province and country)
    const relevantParts = parts.slice(-2);
    
    return relevantParts.join(', ');
  };

  const dynamicStyles = {
    container: { backgroundColor: isDark ? "#0a0a0a" : "#F8F9FA" },
    text: { color: isDark ? "#FFFFFF" : "#0a0a0a" },
    subtitle: { color: isDark ? "#9a9a9a" : "#666666" },
    card: { backgroundColor: isDark ? "#1a1a1a" : "#FFFFFF" },
    border: { borderColor: isDark ? "#333333" : "#E0E0E0" },
    headerText: { color: isDark ? "#FFFFFF" : "#1a1a1a" },
    subtitleText: { color: isDark ? "#9a9a9a" : "#8E8E93" },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* Custom Header */}
      <View style={styles.customHeader}>
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.headerTitle, dynamicStyles.headerText]}>My Tarps</Text>
            <Text style={[styles.headerSubtitle, dynamicStyles.subtitleText]}>
              Manage your campus photo posts
            </Text>
          </View>
          <Pressable 
            style={styles.closeButton} 
            onPress={() => nav.back()}
          >
            <Ionicons name="close" size={24} color={dynamicStyles.text.color} />
          </Pressable>
        </View>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Loading State */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={isDark ? "#FFFFFF" : "#0a0a0a"} />
          </View>
        ) : (
          <>
            {/* Stats Cards */}
            {profileStats ? (
              <View style={styles.statsContainer}>
                <View style={[styles.statCard, { backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" }]}>
                  <Text style={[styles.statNumber, dynamicStyles.text]}>{profileStats.posts}</Text>
                  <Text style={[styles.statLabel, dynamicStyles.subtitle]}>Posts</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: isDark ? "#1C3A5E" : "#E3F2FD" }]}>
                  <Text style={[styles.statNumber, { color: "#007AFF" }]}>{profileStats.photos}</Text>
                  <Text style={[styles.statLabel, dynamicStyles.subtitle]}>Photos</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: isDark ? "#5E1C1C" : "#FFEBEE" }]}>
                  <Text style={[styles.statNumber, { color: "#FF3B30" }]}>{profileStats.likes}</Text>
                  <Text style={[styles.statLabel, dynamicStyles.subtitle]}>Likes</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: isDark ? "#1C5E3A" : "#E8F5E8" }]}>
                  <Text style={[styles.statNumber, { color: "#34C759" }]}>{profileStats.comments}</Text>
                  <Text style={[styles.statLabel, dynamicStyles.subtitle]}>Comments</Text>
                </View>
              </View>
            ) : (
              <Text style={[styles.errorText, dynamicStyles.subtitle]}>Failed to load stats</Text>
            )}

            {/* Posts List */}
            {userPosts.length > 0 ? (
              <View style={styles.postsContainer}>
                {userPosts.map((post, index) => (
                  <View key={post.id || index} style={[styles.postCard, dynamicStyles.card]}>
                    <View style={styles.postContent}>
                      {/* Post Image */}
                      {post.images && post.images.length > 0 && (
                        <View style={styles.postImageContainer}>
                          <ExpoImage
                            source={{ uri: post.images[0].url || post.images[0] }}
                            style={styles.postMainImage}
                            contentFit="cover"
                          />
                          {post.images.length > 1 && (
                            <View style={styles.imageCountBadge}>
                              <Ionicons name="images" size={12} color="#FFFFFF" />
                              <Text style={styles.imageCountText}>{post.images.length}</Text>
                            </View>
                          )}
                        </View>
                      )}
                      
                      {/* Post Details */}
                      <View style={styles.postInfo}>
                        <View style={styles.postHeader}>
                          <Ionicons name="location" size={16} color={dynamicStyles.subtitle.color} />
                          <Text style={[styles.postLocation, dynamicStyles.text]}>
                            {post.location || formatLocation(post.address) || "Unknown location"}
                          </Text>
                          <Pressable
                            style={styles.moreButton}
                            onPress={(event) => {
                              const { pageX, pageY } = event.nativeEvent;
                              setDropdownPosition({ x: pageX - 150, y: pageY + 10 });
                              setShowDropdownMenu(showDropdownMenu === post.id ? null : post.id);
                            }}
                          >
                            <Ionicons name="ellipsis-vertical" size={16} color={dynamicStyles.subtitle.color} />
                          </Pressable>
                          
                          {/* Dropdown Menu - removed from here, now using Modal */}
                        </View>
                        
                        <View style={styles.postMeta}>
                          <Ionicons name="calendar-outline" size={12} color={dynamicStyles.subtitle.color} />
                          <Text style={[styles.postDate, dynamicStyles.subtitle]}>
                            {moment(post.createdAt || post.created_at).format('MMM D, YYYY [at] h:mm A')}
                          </Text>
                          <Text style={[styles.postTimeAgo, dynamicStyles.subtitle]}>
                            {moment(post.createdAt || post.created_at).fromNow()}
                          </Text>
                        </View>
                        
                        {post.caption && (
                          <Text style={[styles.postCaption, dynamicStyles.text]} numberOfLines={2}>
                            {post.caption}
                          </Text>
                        )}
                        
                        <View style={styles.postStats}>
                          <Text style={[styles.postStatsText, dynamicStyles.subtitle]}>
                            {post.tarpImgLikes || 0} likes
                          </Text>
                          <Text style={[styles.postStatsText, dynamicStyles.subtitle]}>
                            {post.tarpImgComments || 0} comments
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    {/* Action Buttons - Full Width at Bottom */}
                    <View style={styles.actionButtons}>
                      <Pressable 
                        style={[styles.actionButton, isDark ? styles.viewButtonDark : styles.viewButton]}
                        onPress={() => {
                          try {
                            // Add current user as creator/owner since these are user's own posts
                            const enhancedPost = {
                              ...post,
                              creator: user ? {
                                id: user.id,
                                fname: user.fname,
                                lname: user.lname,
                                name: `${user.fname || ''} ${user.lname || ''}`.trim() || user.fname || 'User',
                                bgUrl: user.bgUrl,
                                avatar: user.bgUrl,
                                profileImage: user.bgUrl
                              } : null,
                              owner: user ? {
                                id: user.id,
                                fname: user.fname,
                                lname: user.lname,
                                name: `${user.fname || ''} ${user.lname || ''}`.trim() || user.fname || 'User',
                                bgUrl: user.bgUrl,
                                avatar: user.bgUrl,
                                profileImage: user.bgUrl
                              } : null,
                              // Ensure proper like/comment counts and status
                              likedByMe: false, // User's own posts - typically not self-liked
                              isLiked: false,
                              hasLiked: false,
                              liked: false,
                              isFollowing: false, // User doesn't follow themselves
                              following: false,
                              isFriend: null, // User isn't friends with themselves
                              friendStatus: null,
                              // Use the actual counts from the API response
                              commentsCount: post.tarpImgComments || 0,
                              likesCount: post.tarpImgLikes || 0,
                              // Ensure images have proper structure with actual counts
                              images: post.images?.map((img: any) => ({
                                ...img,
                                hasLiked: false, // User's own posts - typically not self-liked
                                likes: img._count?.tarpImgLikes || 0,
                                comments: img._count?.tarpImgComments || 0,
                                _count: {
                                  tarpImgLikes: img._count?.tarpImgLikes || 0,
                                  tarpImgComments: img._count?.tarpImgComments || 0
                                }
                              })) || []
                            };

                            // Use the same navigation pattern as tarps screen
                            const resolveItemImageSet = (item: any): { urls: string[]; ids: (string | null)[] } => {
                              const urls: string[] = [];
                              const ids: (string | null)[] = [];
                              if (Array.isArray(item?.images) && item.images.length > 0) {
                                item.images.forEach((im: any) => {
                                  const raw = typeof im === "string" ? im : im?.url;
                                  const id = typeof im?.id === "string" || typeof im?.id === "number" ? String(im.id) : null;
                                  if (typeof raw === "string" && raw.length > 0) {
                                    const cleaned = raw.replace(/`/g, "").trim();
                                    urls.push(cleaned);
                                    ids.push(id);
                                  }
                                });
                              } else {
                                // Fallback for single image
                                const cover = post.images?.[0]?.url || post.images?.[0];
                                const extractImageId = (item: any): string | null => {
                                  const candidates: any[] = [
                                    item?.imageId, item?.imageID, item?.postImageID, item?.postImageId,
                                    Array.isArray(item?.images) ? item.images[0]?.id : null,
                                    Array.isArray(item?.files) ? item.files[0]?.id : null,
                                    Array.isArray(item?.medias) ? item.medias[0]?.id : null,
                                    item?.id
                                  ];
                                  const v = candidates.find((x) => typeof x === "string" || typeof x === "number");
                                  return v != null ? String(v) : null;
                                };
                                const fallbackId = extractImageId(post);
                                if (cover) {
                                  urls.push(cover);
                                  ids.push(fallbackId);
                                }
                              }
                              return { urls, ids };
                            };
                            
                            const set = resolveItemImageSet(enhancedPost);
                            
                            // Create enhanced userPosts array with user data
                            const enhancedUserPosts = userPosts.map(p => ({
                              ...p,
                              creator: user ? {
                                id: user.id,
                                fname: user.fname,
                                lname: user.lname,
                                name: `${user.fname || ''} ${user.lname || ''}`.trim() || user.fname || 'User',
                                bgUrl: user.bgUrl,
                                avatar: user.bgUrl,
                                profileImage: user.bgUrl
                              } : null,
                              owner: user ? {
                                id: user.id,
                                fname: user.fname,
                                lname: user.lname,
                                name: `${user.fname || ''} ${user.lname || ''}`.trim() || user.fname || 'User',
                                bgUrl: user.bgUrl,
                                avatar: user.bgUrl,
                                profileImage: user.bgUrl
                              } : null
                            }));
                            
                            nav.push(`/post/${enhancedPost.id || 'unknown'}?item=${encodeURIComponent(JSON.stringify(enhancedPost))}&images=${encodeURIComponent(JSON.stringify(set))}&idx=0&serverPosts=${encodeURIComponent(JSON.stringify(enhancedUserPosts))}`);
                          } catch (error) {
                            console.error("Failed to navigate to post:", error);
                            toast.error("Failed to open post");
                          }
                        }}
                      >
                        <Ionicons name="eye" size={16} color={isDark ? "#FFFFFF" : "#007AFF"} />
                        <Text style={isDark ? styles.viewButtonTextDark : styles.viewButtonText}>View</Text>
                      </Pressable>
                      
                      <Pressable 
                        style={[styles.actionButton, isDark ? styles.editButtonDark : styles.editButton]}
                        onPress={() => {
                          // Navigate to edit post
                          nav.push(`/edit-post?postId=${post.id}`);
                        }}
                      >
                        <Ionicons name="create-outline" size={16} color={isDark ? "#FFFFFF" : "#8E8E93"} />
                        <Text style={isDark ? styles.editButtonTextDark : styles.editButtonText}>Edit</Text>
                      </Pressable>
                      
                      <Pressable 
                        style={styles.deleteIconButton}
                        onPress={() => {
                          setPostToDelete(post);
                          setShowDeleteModal(true);
                        }}
                      >
                        <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="camera-outline" size={48} color={dynamicStyles.subtitle.color} />
                <Text style={[styles.emptyText, dynamicStyles.text]}>No posts yet</Text>
                <Text style={[styles.emptySubtext, dynamicStyles.subtitle]}>
                  Share your first photo to get started
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Dropdown Menu Modal */}
      <Modal
        visible={showDropdownMenu !== null}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowDropdownMenu(null)}
      >
        <Pressable 
          style={styles.dropdownModalOverlay}
          onPress={() => setShowDropdownMenu(null)}
        >
          <View style={[
            styles.dropdownMenuModal, 
            dynamicStyles.card, 
            dynamicStyles.border,
            {
              position: 'absolute',
              top: dropdownPosition.y,
              left: dropdownPosition.x,
            }
          ]}>
            <Pressable 
              style={styles.dropdownItem}
              onPress={() => {
                const post = userPosts.find(p => p.id === showDropdownMenu);
                if (post) {
                  try {
                    // Add current user as creator/owner since these are user's own posts
                    const enhancedPost = {
                      ...post,
                      creator: user ? {
                        id: user.id,
                        fname: user.fname,
                        lname: user.lname,
                        name: `${user.fname || ''} ${user.lname || ''}`.trim() || user.fname || 'User',
                        bgUrl: user.bgUrl,
                        avatar: user.bgUrl,
                        profileImage: user.bgUrl
                      } : null,
                      owner: user ? {
                        id: user.id,
                        fname: user.fname,
                        lname: user.lname,
                        name: `${user.fname || ''} ${user.lname || ''}`.trim() || user.fname || 'User',
                        bgUrl: user.bgUrl,
                        avatar: user.bgUrl,
                        profileImage: user.bgUrl
                      } : null,
                      // Ensure proper like/comment counts and status
                      likedByMe: false, // User's own posts - typically not self-liked
                      isLiked: false,
                      hasLiked: false,
                      liked: false,
                      isFollowing: false, // User doesn't follow themselves
                      following: false,
                      isFriend: null, // User isn't friends with themselves
                      friendStatus: null,
                      // Use the actual counts from the API response
                      commentsCount: post.tarpImgComments || 0,
                      likesCount: post.tarpImgLikes || 0,
                      // Ensure images have proper structure with actual counts
                      images: post.images?.map((img: any) => ({
                        ...img,
                        hasLiked: false, // User's own posts - typically not self-liked
                        likes: img._count?.tarpImgLikes || 0,
                        comments: img._count?.tarpImgComments || 0,
                        _count: {
                          tarpImgLikes: img._count?.tarpImgLikes || 0,
                          tarpImgComments: img._count?.tarpImgComments || 0
                        }
                      })) || []
                    };

                    // Use the same navigation pattern as tarps screen
                    const resolveItemImageSet = (item: any): { urls: string[]; ids: (string | null)[] } => {
                      const urls: string[] = [];
                      const ids: (string | null)[] = [];
                      if (Array.isArray(item?.images) && item.images.length > 0) {
                        item.images.forEach((im: any) => {
                          const raw = typeof im === "string" ? im : im?.url;
                          const id = typeof im?.id === "string" || typeof im?.id === "number" ? String(im.id) : null;
                          if (typeof raw === "string" && raw.length > 0) {
                            const cleaned = raw.replace(/`/g, "").trim();
                            urls.push(cleaned);
                            ids.push(id);
                          }
                        });
                      } else {
                        // Fallback for single image
                        const cover = post.images?.[0]?.url || post.images?.[0];
                        const extractImageId = (item: any): string | null => {
                          const candidates: any[] = [
                            item?.imageId, item?.imageID, item?.postImageID, item?.postImageId,
                            Array.isArray(item?.images) ? item.images[0]?.id : null,
                            Array.isArray(item?.files) ? item.files[0]?.id : null,
                            Array.isArray(item?.medias) ? item.medias[0]?.id : null,
                            item?.id
                          ];
                          const v = candidates.find((x) => typeof x === "string" || typeof x === "number");
                          return v != null ? String(v) : null;
                        };
                        const fallbackId = extractImageId(post);
                        if (cover) {
                          urls.push(cover);
                          ids.push(fallbackId);
                        }
                      }
                      return { urls, ids };
                    };
                    
                    const set = resolveItemImageSet(enhancedPost);
                    
                    // Create enhanced userPosts array with user data
                    const enhancedUserPosts = userPosts.map(p => ({
                      ...p,
                      creator: user ? {
                        id: user.id,
                        fname: user.fname,
                        lname: user.lname,
                        name: `${user.fname || ''} ${user.lname || ''}`.trim() || user.fname || 'User',
                        bgUrl: user.bgUrl,
                        avatar: user.bgUrl,
                        profileImage: user.bgUrl
                      } : null,
                      owner: user ? {
                        id: user.id,
                        fname: user.fname,
                        lname: user.lname,
                        name: `${user.fname || ''} ${user.lname || ''}`.trim() || user.fname || 'User',
                        bgUrl: user.bgUrl,
                        avatar: user.bgUrl,
                        profileImage: user.bgUrl
                      } : null
                    }));
                    
                    nav.push(`/post/${enhancedPost.id || 'unknown'}?item=${encodeURIComponent(JSON.stringify(enhancedPost))}&images=${encodeURIComponent(JSON.stringify(set))}&idx=0&serverPosts=${encodeURIComponent(JSON.stringify(enhancedUserPosts))}`);
                  } catch (error) {
                    console.error("Failed to navigate to post:", error);
                    toast.error("Failed to open post");
                  }
                }
                setShowDropdownMenu(null);
              }}
            >
              <Ionicons name="eye" size={16} color={dynamicStyles.text.color} />
              <Text style={[styles.dropdownText, dynamicStyles.text]}>View Details</Text>
            </Pressable>
            
            <Pressable 
              style={styles.dropdownItem}
              onPress={() => {
                const post = userPosts.find(p => p.id === showDropdownMenu);
                if (post) {
                  nav.push(`/edit-post?postId=${post.id}`);
                }
                setShowDropdownMenu(null);
              }}
            >
              <Ionicons name="create-outline" size={16} color={dynamicStyles.text.color} />
              <Text style={[styles.dropdownText, dynamicStyles.text]}>Edit Post</Text>
            </Pressable>
            
            <Pressable 
              style={[styles.dropdownItem, { borderBottomWidth: 0 }]}
              onPress={() => {
                const post = userPosts.find(p => p.id === showDropdownMenu);
                if (post) {
                  console.log('Delete post pressed for:', post.id);
                  setPostToDelete(post);
                  setShowDeleteModal(true);
                }
                setShowDropdownMenu(null);
              }}
            >
              <Ionicons name="trash-outline" size={16} color="#FF3B30" />
              <Text style={[styles.dropdownText, { color: "#FF3B30" }]}>Delete Post</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.deleteModal, dynamicStyles.card]}>
            <Text style={[styles.deleteTitle, dynamicStyles.text]}>Delete Post</Text>
            <Text style={[styles.deleteMessage, dynamicStyles.subtitle]}>
              Are you sure you want to delete this post? This action cannot be undone. All likes and comments will be permanently removed.
            </Text>
            
            <View style={styles.deleteActions}>
              <Pressable
                style={styles.deleteButton}
                onPress={() => postToDelete && deletePost(postToDelete.id)}
                disabled={isDeletingPost}
              >
                {isDeletingPost ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.deleteButtonText}>Delete</Text>
                )}
              </Pressable>
              
              <Pressable
                style={[styles.cancelButton, dynamicStyles.border]}
                onPress={() => setShowDeleteModal(false)}
                disabled={isDeletingPost}
              >
                <Text style={[styles.cancelText, dynamicStyles.text]}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Post Details Modal */}
      <Modal
        visible={showPostPreview}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPostPreview(false)}
      >
        <View style={styles.detailsModalOverlay}>
          <View style={[styles.detailsModal, dynamicStyles.card]}>
            {/* Header */}
            <View style={styles.detailsHeader}>
              <Text style={[styles.detailsTitle, dynamicStyles.text]}>Post Details</Text>
              <Pressable
                style={styles.detailsCloseButton}
                onPress={() => setShowPostPreview(false)}
              >
                <Ionicons name="close" size={24} color={dynamicStyles.text.color} />
              </Pressable>
            </View>
            
            {postToPreview ? (
              <ScrollView style={styles.detailsContent} showsVerticalScrollIndicator={false}>
                {/* Images Scrollable Area */}
                {postToPreview.images && postToPreview.images.length > 0 && (
                  <View style={styles.detailsImagesContainer}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      pagingEnabled
                      style={styles.detailsImageScroll}
                      contentContainerStyle={styles.detailsImageScrollContent}
                    >
                      {postToPreview.images.map((image: any, index: number) => (
                        <ExpoImage
                          key={index}
                          source={{ uri: image.url || image }}
                          style={styles.detailsScrollImage}
                          contentFit="cover"
                        />
                      ))}
                    </ScrollView>
                    
                    {/* Image Counter */}
                    {postToPreview.images.length > 1 && (
                      <View style={styles.imageCounter}>
                        <Text style={styles.imageCounterText}>
                          {postToPreview.images.length} photos
                        </Text>
                      </View>
                    )}
                  </View>
                )}
                
                {/* Location */}
                <View style={styles.detailsLocationRow}>
                  <Ionicons name="location" size={20} color={dynamicStyles.subtitle.color} />
                  <Text style={[styles.detailsLocation, dynamicStyles.text]}>
                    {postToPreview.location || formatLocation(postToPreview.address) || "Unknown location"}
                  </Text>
                </View>
                
                {/* Date */}
                <View style={styles.detailsDateRow}>
                  <Ionicons name="calendar-outline" size={20} color={dynamicStyles.subtitle.color} />
                  <Text style={[styles.detailsDate, dynamicStyles.subtitle]}>
                    {moment(postToPreview.createdAt || postToPreview.created_at).format('MMM D, YYYY [at] h:mm A')}
                  </Text>
                </View>
                
                {/* Caption */}
                {postToPreview.caption && (
                  <View style={styles.detailsCaptionContainer}>
                    <Text style={[styles.detailsCaption, dynamicStyles.text]}>
                      {postToPreview.caption}
                    </Text>
                  </View>
                )}
                
                {/* Stats */}
                <View style={styles.detailsStats}>
                  <View style={styles.detailsStatItem}>
                    <Ionicons name="heart-outline" size={16} color={dynamicStyles.subtitle.color} />
                    <Text style={[styles.detailsStatText, dynamicStyles.subtitle]}>
                      {postToPreview.tarpImgLikes || 0} likes
                    </Text>
                  </View>
                  <View style={styles.detailsStatItem}>
                    <Ionicons name="chatbubble-outline" size={16} color={dynamicStyles.subtitle.color} />
                    <Text style={[styles.detailsStatText, dynamicStyles.subtitle]}>
                      {postToPreview.tarpImgComments || 0} comments
                    </Text>
                  </View>
                </View>
              </ScrollView>
            ) : (
              <View style={styles.detailsContent}>
                <Text style={[styles.detailsCaption, dynamicStyles.text]}>No post data available</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Old Post Preview Modal - Removed */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  customHeader: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginVertical: 20,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "500",
  },
  errorText: {
    textAlign: "center",
    padding: 20,
  },
  postsContainer: {
    gap: 16,
    paddingBottom: 20,
  },
  postCard: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  postContent: {
    flexDirection: "row",
    padding: 16,
    paddingBottom: 12,
  },
  postImageContainer: {
    position: "relative",
    marginRight: 16,
  },
  postMainImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  imageCountBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  imageCountText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  postInfo: {
    flex: 1,
    gap: 6,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  postLocation: {
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  moreButton: {
    padding: 4,
    position: "relative",
  },
  dropdownModalOverlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  dropdownMenuModal: {
    minWidth: 150,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  dropdownMenu: {
    position: "absolute",
    top: 30,
    right: 0,
    minWidth: 150,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1002,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: "500",
  },
  postMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  postDate: {
    fontSize: 13,
    flex: 1,
  },
  postTimeAgo: {
    fontSize: 13,
  },
  postCaption: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  postStats: {
    flexDirection: "row",
    gap: 16,
    marginTop: 4,
  },
  postStatsText: {
    fontSize: 13,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  viewButton: {
    borderColor: "#E5E5E7",
    backgroundColor: "#FFFFFF",
  },
  viewButtonDark: {
    borderColor: "#333333",
    backgroundColor: "transparent",
  },
  viewButtonText: {
    color: "#000000",
    fontSize: 13,
    fontWeight: "600",
  },
  viewButtonTextDark: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  editButton: {
    borderColor: "#E5E5E7",
    backgroundColor: "#FFFFFF",
  },
  editButtonDark: {
    borderColor: "#333333",
    backgroundColor: "transparent",
  },
  editButtonText: {
    color: "#000000",
    fontSize: 13,
    fontWeight: "600",
  },
  editButtonTextDark: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  deleteIconButton: {
    flex: 0,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF3B30",
    backgroundColor: "rgba(255, 59, 48, 0.1)",
  },
  emptyState: {
    alignItems: "center",
    padding: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteModal: {
    margin: 20,
    padding: 24,
    borderRadius: 16,
    maxWidth: 400,
    width: "90%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  deleteTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  deleteMessage: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
    textAlign: "center",
  },
  deleteActions: {
    gap: 12,
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  cancelButton: {
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
  },
  detailsModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  detailsModal: {
    width: "100%",
    maxWidth: 500,
    height: "80%",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  detailsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  detailsCloseButton: {
    padding: 4,
  },
  detailsContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  detailsImagesContainer: {
    marginBottom: 20,
  },
  detailsImageScroll: {
    height: 300,
  },
  detailsImageScrollContent: {
    paddingRight: 20,
  },
  detailsScrollImage: {
    width: 280,
    height: 300,
    borderRadius: 16,
    marginRight: 12,
  },
  imageCounter: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  detailsSingleImage: {
    width: "100%",
    height: 300,
    borderRadius: 16,
  },
  detailsImageGrid: {
    flexDirection: "row",
    gap: 8,
    height: 300,
  },
  detailsGridImage: {
    flex: 1,
    borderRadius: 16,
  },
  detailsLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  detailsLocation: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  detailsDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  detailsDate: {
    fontSize: 16,
    flex: 1,
  },
  detailsCaptionContainer: {
    marginBottom: 20,
  },
  detailsCaption: {
    fontSize: 16,
    lineHeight: 24,
  },
  detailsStats: {
    flexDirection: "row",
    gap: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  detailsStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailsStatText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
