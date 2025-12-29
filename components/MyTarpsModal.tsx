import { api } from "@/api/client";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
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

interface MyTarpsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function MyTarpsModal({ visible, onClose }: MyTarpsModalProps) {
  const { isDark } = useTheme();
  const nav = useRouter();

  // State
  const [profileStats, setProfileStats] = useState<{
    posts: number;
    photos: number;
    likes: number;
    comments: number;
  } | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<any | null>(null);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [showPostPreview, setShowPostPreview] = useState(false);
  const [postToPreview, setPostToPreview] = useState<any | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Function to fetch profile stats
  const fetchProfileStats = async () => {
    if (isLoadingStats) return;
    
    try {
      setIsLoadingStats(true);
      const response = await api.get('/tarps/stats');
      console.log('Profile stats response:', JSON.stringify(response, null, 2));
      
      if (response.data?.status === 'success' && response.data?.data) {
        setProfileStats(response.data.data);
      } else {
        toast.error('Failed to load profile stats');
      }
    } catch (error: any) {
      console.error('Error fetching profile stats:', error);
      toast.error('Failed to load profile stats');
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Function to fetch user posts
  const fetchUserPosts = async () => {
    if (isLoadingPosts) return;
    
    try {
      setIsLoadingPosts(true);
      const response = await api.get('/tarps/stats/posts');
      console.log('User posts response:', JSON.stringify(response, null, 2));
      
      if (response.data?.status === 'success' && Array.isArray(response.data?.data)) {
        setUserPosts(response.data.data);
      } else {
        toast.error('Failed to load posts');
      }
    } catch (error: any) {
      console.error('Error fetching user posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setIsLoadingPosts(false);
    }
  };

  // Function to handle delete post
  const handleDeletePost = async (postId: string) => {
    if (isDeletingPost) return;
    
    try {
      setIsDeletingPost(true);
      const response = await api.delete(`/tarps/posts/${postId}`);
      console.log('Delete post response:', JSON.stringify(response, null, 2));
      
      // Remove the post from the local state
      setUserPosts(prev => prev.filter(post => post.id !== postId));
      
      // Update stats
      if (profileStats) {
        setProfileStats(prev => prev ? {
          ...prev,
          posts: Math.max(0, prev.posts - 1)
        } : null);
      }
      
      setShowDeleteModal(false);
      setPostToDelete(null);
      toast.success("Post deleted successfully");
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    } finally {
      setIsDeletingPost(false);
    }
  };

  // Function to open delete confirmation modal
  const openDeleteModal = (post: any) => {
    console.log('Opening delete modal for post:', post);
    setPostToDelete(post);
    setShowDeleteModal(true);
  };

  // Function to open post preview overlay
  const openPostPreview = (post: any) => {
    console.log('Opening post preview for:', post);
    setPostToPreview(post);
    setCurrentImageIndex(0); // Reset to first image
    setShowPostPreview(true);
  };

  // Load data when modal opens
  useEffect(() => {
    if (visible) {
      fetchProfileStats();
      fetchUserPosts();
    }
  }, [visible]);

  return (
    <>
      {/* Main Modal */}
      <Modal
        visible={visible}
        animationType="fade"
        presentationStyle="overFullScreen"
        transparent
        onRequestClose={onClose}
      >
        <View style={styles.profileModalOverlay}>
          <View style={[styles.profileModalContent, isDark ? styles.profileModalDark : styles.profileModalLight]}>
            {/* Header */}
            <View style={styles.profileModalHeader}>
              <Text style={[styles.profileModalTitle, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>
                My Tarps
              </Text>
              <Text style={[styles.profileModalSubtitle, { color: isDark ? "#9AA0A6" : "#666" }]}>
                Manage your campus photo posts
              </Text>
              <Pressable 
                style={styles.profileCloseButton} 
                onPress={onClose}
              >
                <Ionicons name="close" size={24} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
              </Pressable>
            </View>

            {/* Stats */}
            <View style={styles.profileStats}>
              <View style={[styles.profileStatCard, { backgroundColor: isDark ? "#2A2A2A" : "#F5F5F5" }]}>
                <Text style={[styles.profileStatNumber, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>
                  {isLoadingStats ? "..." : profileStats?.posts || 0}
                </Text>
                <Text style={[styles.profileStatLabel, { color: isDark ? "#9AA0A6" : "#666" }]}>Posts</Text>
              </View>
              <View style={[styles.profileStatCard, { backgroundColor: isDark ? "#1A4A6B" : "#E3F2FD" }]}>
                <Text style={[styles.profileStatNumber, { color: "#2196F3" }]}>
                  {isLoadingStats ? "..." : profileStats?.photos || 0}
                </Text>
                <Text style={[styles.profileStatLabel, { color: "#2196F3" }]}>Photos</Text>
              </View>
              <View style={[styles.profileStatCard, { backgroundColor: isDark ? "#4A1A1A" : "#FFEBEE" }]}>
                <Text style={[styles.profileStatNumber, { color: "#F44336" }]}>
                  {isLoadingStats ? "..." : profileStats?.likes || 0}
                </Text>
                <Text style={[styles.profileStatLabel, { color: "#F44336" }]}>Likes</Text>
              </View>
              <View style={[styles.profileStatCard, { backgroundColor: isDark ? "#1A4A1A" : "#E8F5E8" }]}>
                <Text style={[styles.profileStatNumber, { color: "#4CAF50" }]}>
                  {isLoadingStats ? "..." : profileStats?.comments || 0}
                </Text>
                <Text style={[styles.profileStatLabel, { color: "#4CAF50" }]}>Comments</Text>
              </View>
            </View>

            {/* Posts Section */}
            <View style={styles.postsSection}>
              <Text style={[styles.postsSectionTitle, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>
                Recent Posts
              </Text>
              
              {isLoadingPosts ? (
                <View style={styles.postsLoading}>
                  <ActivityIndicator size="small" color={isDark ? "#FFFFFF" : "#0a0a0a"} />
                  <Text style={[styles.postsLoadingText, { color: isDark ? "#9AA0A6" : "#666" }]}>
                    Loading posts...
                  </Text>
                </View>
              ) : userPosts.length === 0 ? (
                <View style={styles.postsEmpty}>
                  <Text style={[styles.postsEmptyText, { color: isDark ? "#9AA0A6" : "#666" }]}>
                    No posts yet
                  </Text>
                </View>
              ) : (
                <ScrollView 
                  style={styles.postsScrollView}
                  showsVerticalScrollIndicator={false}
                >
                  {userPosts.map((post, index) => (
                    <Pressable
                      key={post.id || index}
                      style={[styles.postCard, isDark ? styles.postCardDark : styles.postCardLight]}
                      onPress={() => {
                        openPostPreview(post);
                      }}
                    >
                      <View style={styles.postCardContent}>
                        {/* Post Image */}
                        {post.images?.[0]?.url && (
                          <ExpoImage
                            source={{ uri: post.images[0].url }}
                            style={styles.postThumbnail}
                            contentFit="cover"
                          />
                        )}
                        
                        {/* Post Details */}
                        <View style={styles.postDetails}>
                          <View style={styles.postHeader}>
                            <View style={styles.postLocation}>
                              <Ionicons name="location-outline" size={14} color={isDark ? "#9AA0A6" : "#666"} />
                              <Text style={[styles.postLocationText, { color: isDark ? "#9AA0A6" : "#666" }]} numberOfLines={1}>
                                {post.location || "Unknown location"}
                              </Text>
                            </View>
                            <Text style={[styles.postTime, { color: isDark ? "#9AA0A6" : "#666" }]}>
                              {moment(post.createdAt).fromNow()}
                            </Text>
                          </View>
                          
                          {post.caption && (
                            <Text style={[styles.postCaption, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]} numberOfLines={2}>
                              {post.caption}
                            </Text>
                          )}
                          
                          <View style={styles.postStats}>
                            <View style={styles.postStat}>
                              <Ionicons name="images-outline" size={14} color={isDark ? "#9AA0A6" : "#666"} />
                              <Text style={[styles.postStatText, { color: isDark ? "#9AA0A6" : "#666" }]}>
                                {post.images?.length || 0}
                              </Text>
                            </View>
                            <View style={styles.postStat}>
                              <Ionicons name="heart-outline" size={14} color="#F44336" />
                              <Text style={[styles.postStatText, { color: "#F44336" }]}>
                                {post.tarpImgLikes || 0}
                              </Text>
                            </View>
                            <View style={styles.postStat}>
                              <Ionicons name="chatbubble-outline" size={14} color="#4CAF50" />
                              <Text style={[styles.postStatText, { color: "#4CAF50" }]}>
                                {post.tarpImgComments || 0}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                      
                      {/* Action Buttons */}
                      <View style={styles.postActions}>
                        <Pressable
                          style={[styles.postActionBtn, { backgroundColor: isDark ? "#2A2A2A" : "#F5F5F5" }]}
                          onPress={(e) => {
                            e.stopPropagation();
                            openPostPreview(post);
                          }}
                        >
                          <Ionicons name="eye-outline" size={16} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
                          <Text style={[styles.postActionText, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>View</Text>
                        </Pressable>
                        
                        <Pressable
                          style={[styles.postActionBtn, { backgroundColor: isDark ? "#2A2A2A" : "#F5F5F5" }]}
                          onPress={(e) => {
                            e.stopPropagation();
                            toast.success("Edit feature coming soon!");
                          }}
                        >
                          <Ionicons name="create-outline" size={16} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
                          <Text style={[styles.postActionText, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>Edit</Text>
                        </Pressable>
                        
                        <Pressable
                          style={[styles.postActionBtn, styles.deleteBtn]}
                          onPress={(e) => {
                            e.stopPropagation();
                            console.log('Delete button pressed for post:', post.id);
                            openDeleteModal(post);
                          }}
                        >
                          <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
                        </Pressable>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Delete Confirmation Overlay - Shows on top of the modal */}
            {showDeleteModal && (
              <View style={styles.deleteOverlay}>
                <View style={[styles.deleteCard, isDark ? styles.deleteCardDark : styles.deleteCardLight]}>
                  {/* Header */}
                  <View style={styles.deleteHeader}>
                    <Text style={[styles.deleteTitle, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>
                      Delete Post
                    </Text>
                  </View>

                  {/* Content */}
                  <View style={styles.deleteBody}>
                    <Text style={[styles.deleteText, { color: isDark ? "#CCCCCC" : "#666666" }]}>
                      Are you sure you want to delete this post? This action cannot be undone. All likes and comments will be permanently removed.
                    </Text>
                    
                    {/* Post Preview */}
                    {postToDelete && (
                      <View style={[styles.deletePostPreview, isDark ? styles.deletePostPreviewDark : styles.deletePostPreviewLight]}>
                        {postToDelete.images?.[0]?.url && (
                          <ExpoImage
                            source={{ uri: postToDelete.images[0].url }}
                            style={styles.deletePostThumbnail}
                            contentFit="cover"
                          />
                        )}
                        <View style={styles.deletePostDetails}>
                          <View style={styles.deletePostLocation}>
                            <Ionicons name="location-outline" size={14} color={isDark ? "#9AA0A6" : "#666"} />
                            <Text style={[styles.deletePostLocationText, { color: isDark ? "#9AA0A6" : "#666" }]} numberOfLines={1}>
                              {postToDelete.location || "Unknown location"}
                            </Text>
                          </View>
                          {postToDelete.caption && (
                            <Text style={[styles.deletePostCaption, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]} numberOfLines={2}>
                              {postToDelete.caption}
                            </Text>
                          )}
                          <View style={styles.deletePostStats}>
                            <Text style={[styles.deletePostStatsText, { color: isDark ? "#9AA0A6" : "#666" }]}>
                              {postToDelete.tarpImgLikes || 0} likes • {postToDelete.tarpImgComments || 0} comments
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Actions */}
                  <View style={styles.deleteActions}>
                    <Pressable
                      style={[styles.deleteButton, styles.cancelButton, isDark ? styles.cancelButtonDark : styles.cancelButtonLight]}
                      onPress={() => setShowDeleteModal(false)}
                      disabled={isDeletingPost}
                    >
                      <Text style={[styles.cancelButtonText, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>Cancel</Text>
                    </Pressable>
                    
                    <Pressable
                      style={[styles.deleteButton, styles.confirmDeleteButton, isDeletingPost && styles.deleteButtonDisabled]}
                      onPress={() => postToDelete && handleDeletePost(postToDelete.id)}
                      disabled={isDeletingPost}
                    >
                      {isDeletingPost ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              </View>
            )}

            {/* Post Preview Overlay - Shows on top of the modal */}
            {showPostPreview && postToPreview && (
              <View style={styles.previewOverlay}>
                <View style={[styles.previewCard, isDark ? styles.previewCardDark : styles.previewCardLight]}>
                  {/* Header */}
                  <View style={styles.previewHeader}>
                    <View style={styles.previewTitleContainer}>
                      <Text style={[styles.previewTitle, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>
                        Post Details
                      </Text>
                      {postToPreview.images && postToPreview.images.length > 1 && (
                        <Text style={[styles.previewCounter, { color: isDark ? "#9AA0A6" : "#666" }]}>
                          {currentImageIndex + 1} of {postToPreview.images.length}
                        </Text>
                      )}
                    </View>
                    <Pressable 
                      style={styles.previewCloseButton} 
                      onPress={() => setShowPostPreview(false)}
                    >
                      <Ionicons name="close" size={24} color={isDark ? "#FFFFFF" : "#0a0a0a"} />
                    </Pressable>
                  </View>

                  {/* Header Separator Line */}
                  <View style={[styles.previewHeaderSeparator, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />

                  {/* Images Carousel */}
                  <View style={styles.previewImagesContainer}>
                    {postToPreview.images && postToPreview.images.length > 0 ? (
                      <View>
                        <ScrollView
                          horizontal
                          pagingEnabled
                          showsHorizontalScrollIndicator={false}
                          style={styles.previewImagesScroll}
                          contentContainerStyle={styles.previewImagesScrollContent}
                          onMomentumScrollEnd={(event) => {
                            const slideIndex = Math.round(
                              event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width
                            );
                            setCurrentImageIndex(slideIndex);
                          }}
                        >
                          {postToPreview.images.map((image: any, index: number) => (
                            <View key={index} style={styles.previewImageSlide}>
                              <ExpoImage
                                source={{ uri: image.url }}
                                style={styles.previewImage}
                                contentFit="contain"
                              />
                            </View>
                          ))}
                        </ScrollView>
                        
                        {/* Pagination Dots */}
                        {postToPreview.images.length > 1 && (
                          <View style={styles.previewPagination}>
                            {postToPreview.images.map((_: any, index: number) => (
                              <View
                                key={index}
                                style={[
                                  styles.previewDot,
                                  index === currentImageIndex ? styles.previewDotActive : styles.previewDotInactive
                                ]}
                              />
                            ))}
                          </View>
                        )}
                      </View>
                    ) : (
                      <View style={styles.previewNoImage}>
                        <Ionicons name="image-outline" size={48} color={isDark ? "#666" : "#999"} />
                        <Text style={[styles.previewNoImageText, { color: isDark ? "#666" : "#999" }]}>
                          No images
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Separator Line */}
                  <View style={[styles.previewSeparator, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />

                  {/* Post Details */}
                  <View style={[styles.previewDetails, { backgroundColor: isDark ? 'rgba(26,26,26,0.95)' : 'rgba(255,255,255,0.95)' }]}>
                    {/* Location */}
                    <View style={styles.previewLocationRow}>
                      <Ionicons name="location-outline" size={20} color={isDark ? "#FFFFFF" : "#000000"} />
                      <Text style={[styles.previewLocationText, { color: isDark ? "#FFFFFF" : "#000000" }]}>
                        {postToPreview.location || "Unknown location"}
                      </Text>
                    </View>

                    {/* Date */}
                    <View style={styles.previewDateRow}>
                      <Ionicons name="calendar-outline" size={16} color={isDark ? "#CCCCCC" : "#555555"} />
                      <Text style={[styles.previewDateText, { color: isDark ? "#CCCCCC" : "#555555" }]}>
                        {moment(postToPreview.createdAt).format("MMM D, YYYY [at] h:mm A")}
                      </Text>
                    </View>

                    {/* Caption */}
                    {postToPreview.caption && (
                      <>
                        {/* Separator before caption */}
                        <View style={[styles.previewDetailsSeparator, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
                        
                        <View style={styles.previewCaptionContainer}>
                          <Text style={[styles.previewCaption, { color: isDark ? "#FFFFFF" : "#000000" }]}>
                            {postToPreview.caption}
                          </Text>
                        </View>
                        
                        {/* Separator after caption */}
                        <View style={[styles.previewDetailsSeparator, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
                      </>
                    )}

                    {/* Stats */}
                    <View style={styles.previewStats}>
                      <View style={styles.previewStatItem}>
                        <Text style={[styles.previewStatNumber, { color: isDark ? "#FFFFFF" : "#000000" }]}>
                          {postToPreview.tarpImgLikes || 0}
                        </Text>
                        <Text style={[styles.previewStatLabel, { color: isDark ? "#CCCCCC" : "#555555" }]}>
                          Likes
                        </Text>
                      </View>
                      <View style={styles.previewStatItem}>
                        <Text style={[styles.previewStatNumber, { color: isDark ? "#FFFFFF" : "#000000" }]}>
                          {postToPreview.tarpImgComments || 0}
                        </Text>
                        <Text style={[styles.previewStatLabel, { color: isDark ? "#CCCCCC" : "#555555" }]}>
                          Comments
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {isLoadingStats && (
              <View style={styles.profileLoadingOverlay}>
                <ActivityIndicator size="large" color={isDark ? "#FFFFFF" : "#0a0a0a"} />
                <Text style={[styles.profileLoadingText, { color: isDark ? "#FFFFFF" : "#0a0a0a" }]}>
                  Loading stats...
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Profile Modal Styles
  profileModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  profileModalContent: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "95%",
    borderRadius: 20,
    padding: 0,
    overflow: "hidden",
  },
  profileModalDark: {
    backgroundColor: "#1A1A1A",
  },
  profileModalLight: {
    backgroundColor: "#FFFFFF",
  },
  profileModalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    position: "relative",
  },
  profileModalTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  profileModalSubtitle: {
    fontSize: 14,
  },
  profileCloseButton: {
    position: "absolute",
    top: 20,
    right: 20,
    padding: 4,
  },
  profileStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 8,
  },
  profileStatCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  profileStatNumber: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  profileStatLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
  profileLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  profileLoadingText: {
    fontSize: 14,
    fontWeight: "600",
  },
  // Posts Section Styles
  postsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    maxHeight: 400,
  },
  postsSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  postsLoading: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  postsLoadingText: {
    fontSize: 14,
  },
  postsEmpty: {
    alignItems: "center",
    paddingVertical: 20,
  },
  postsEmptyText: {
    fontSize: 14,
  },
  postsScrollView: {
    maxHeight: 340,
  },
  postCard: {
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  postCardDark: {
    backgroundColor: "#2A2A2A",
    borderColor: "#333333",
  },
  postCardLight: {
    backgroundColor: "#F8F9FA",
    borderColor: "#E0E0E0",
  },
  postCardContent: {
    flexDirection: "row",
    padding: 12,
  },
  postThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  postDetails: {
    flex: 1,
    justifyContent: "space-between",
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  postLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
    marginRight: 8,
  },
  postLocationText: {
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },
  postTime: {
    fontSize: 10,
    fontWeight: "500",
  },
  postCaption: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  postStats: {
    flexDirection: "row",
    gap: 12,
  },
  postStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  postStatText: {
    fontSize: 12,
    fontWeight: "600",
  },
  postActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  postActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  postActionText: {
    fontSize: 12,
    fontWeight: "600",
  },
  deleteBtn: {
    backgroundColor: "#FF3B30",
    flex: 0.5,
  },
  // Delete Overlay Styles (shows on top of modal)
  deleteOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 1000,
  },
  deleteCard: {
    width: "100%",
    maxWidth: 350,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  deleteCardDark: {
    backgroundColor: "#1A1A1A",
  },
  deleteCardLight: {
    backgroundColor: "#FFFFFF",
  },
  deleteHeader: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  deleteTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  deleteBody: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  deleteText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 20,
  },
  deletePostPreview: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  deletePostPreviewDark: {
    backgroundColor: "#2A2A2A",
    borderColor: "#333333",
  },
  deletePostPreviewLight: {
    backgroundColor: "#F8F9FA",
    borderColor: "#E0E0E0",
  },
  deletePostThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginRight: 12,
  },
  deletePostDetails: {
    flex: 1,
    justifyContent: "space-between",
  },
  deletePostLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  deletePostLocationText: {
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },
  deletePostCaption: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 4,
  },
  deletePostStats: {
    marginTop: 4,
  },
  deletePostStatsText: {
    fontSize: 11,
  },
  deleteActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonDark: {
    backgroundColor: "transparent",
    borderColor: "#333333",
  },
  cancelButtonLight: {
    backgroundColor: "transparent",
    borderColor: "#E0E0E0",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  confirmDeleteButton: {
    backgroundColor: "#FF3B30",
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  // Post Preview Overlay Styles
  previewOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 1001, // Higher than delete overlay
  },
  previewCard: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "100%",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  previewCardDark: {
    backgroundColor: "#1A1A1A",
  },
  previewCardLight: {
    backgroundColor: "#FFFFFF",
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  previewTitleContainer: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  previewCounter: {
    fontSize: 12,
    marginTop: 2,
  },
  previewCloseButton: {
    padding: 4,
  },
  previewImagesContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: "50%", // Allow up to 60% of modal height for images
  },
  previewImagesScroll: {
    height: 400, // Fixed height of 400px
  },
  previewImagesScrollContent: {
    alignItems: "center",
  },
  previewImageSlide: {
    width: 360, // Increased width for better display
    height: 400, // Fixed height to match scroll container
    borderRadius: 12,
    overflow: "hidden",
    marginHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    // Image will fit within the 400px height container without cropping using contentFit="contain"
  },
  previewPagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    gap: 6,
  },
  previewDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  previewDotActive: {
    backgroundColor: "#3b82f6",
  },
  previewDotInactive: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  previewNoImage: {
    height: 400, // Fixed height to match image area
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#666",
  },
  previewNoImageText: {
    fontSize: 14,
    marginTop: 8,
  },
  previewSeparator: {
    height: 1,
    marginHorizontal: 20,
    marginVertical: 0,
  },
  previewDetailsSeparator: {
    height: 1,
    marginHorizontal: 0,
    marginVertical: 12,
  },
  previewHeaderSeparator: {
    height: 1,
    marginHorizontal: 20,
    marginVertical: 0,
  },
  previewDetails: {
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginTop: -16, // Slight overlap with image area for seamless transition
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  previewLocationText: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  previewDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  previewDateText: {
    fontSize: 14,
  },
  previewCaptionContainer: {
    marginBottom: 0, // Remove bottom margin since we have separator after
    paddingVertical: 4, // Add some padding for better spacing
  },
  previewCaption: {
    fontSize: 16,
    lineHeight: 22,
  },
  previewStats: {
    flexDirection: "row",
    gap: 32,
  },
  previewStatItem: {
    alignItems: "center",
  },
  previewStatNumber: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  previewStatLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
});