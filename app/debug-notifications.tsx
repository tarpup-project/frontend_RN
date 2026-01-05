import { useCommentsNotifications } from '@/hooks/useCommentsNotifications';
import { useFollowerNotifications } from '@/hooks/useFollowerNotifications';
import { useFriendPostsNotifications } from '@/hooks/useFriendPostsNotifications';
import { usePostLikesNotifications } from '@/hooks/usePostLikesNotifications';
import { clearNotificationStorage } from '@/utils/notificationInitializer';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function DebugNotifications() {
  const router = useRouter();
  const { 
    checkSecureStore: checkFollowersStore, 
    clearStoredData: clearFollowersData,
    fetchFollowers,
    checkForNewFollowers,
    getRecentFollowers,
    dismissFollower
  } = useFollowerNotifications();
  const { 
    checkSecureStore: checkPostLikesStore, 
    clearStoredData: clearPostLikesData,
    fetchPostLikes,
    checkForNewPostLikes 
  } = usePostLikesNotifications();
  const { 
    checkSecureStore: checkFriendPostsStore, 
    clearStoredData: clearFriendPostsData,
    fetchFriendPosts,
    checkForNewFriendPosts 
  } = useFriendPostsNotifications();
  const { 
    checkSecureStore: checkCommentsStore, 
    clearStoredData: clearCommentsData,
    fetchComments,
    checkForNewComments 
  } = useCommentsNotifications();

  const handleCompleteReset = async () => {
    try {
      console.log('🔄 Complete reset starting...');
      
      // 1. Clear all storage
      await clearNotificationStorage();
      
      // 2. Clear hook storage and refetch
      await clearFollowersData();
      await clearPostLikesData();
      await clearFriendPostsData();
      await clearCommentsData();
      
      // 3. Wait a moment for storage to clear
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 4. Force fetch fresh data
      console.log('🔄 Fetching fresh data...');
      const followers = await fetchFollowers();
      const postLikes = await fetchPostLikes();
      const friendPosts = await fetchFriendPosts();
      const comments = await fetchComments();
      
      // 5. Test getRecentFollowers
      console.log('🔄 Testing getRecentFollowers...');
      const recentFollowers = await getRecentFollowers();
      
      console.log('✅ Complete reset done!');
      console.log('📊 Results:', {
        followers: followers.length,
        postLikes: postLikes.length,
        friendPosts: friendPosts.length,
        comments: comments.length,
        recentFollowers: recentFollowers.length
      });
      
      alert(`Complete Reset Done!\nFollowers: ${followers.length}\nPost Likes: ${postLikes.length}\nFriend Posts: ${friendPosts.length}\nComments: ${comments.length}\nRecent Followers: ${recentFollowers.length}\n\nGo back and check notifications!`);
    } catch (error: any) {
      console.error('❌ Complete reset error:', error);
      alert(`Reset Error: ${error.message}`);
    }
  };

  const handleCheckFollowersStore = async () => {
    const dismissed = await checkFollowersStore();
    alert(`Dismissed followers: ${dismissed.length}\nCheck console for details`);
  };

  const handleCheckPostLikesStore = async () => {
    const dismissed = await checkPostLikesStore();
    alert(`Dismissed post likes: ${dismissed.length}\nCheck console for details`);
  };

  const handleCheckFriendPostsStore = async () => {
    const dismissed = await checkFriendPostsStore();
    alert(`Dismissed friend posts: ${dismissed.length}\nCheck console for details`);
  };

  const handleCheckCommentsStore = async () => {
    const dismissed = await checkCommentsStore();
    alert(`Dismissed comments: ${dismissed.length}\nCheck console for details`);
  };

  const handleClearFollowers = async () => {
    await clearFollowersData();
    alert('Cleared followers storage and refetched data!');
  };

  const handleClearPostLikes = async () => {
    await clearPostLikesData();
    alert('Cleared post likes storage and refetched data!');
  };

  const handleClearFriendPosts = async () => {
    await clearFriendPostsData();
    alert('Cleared friend posts storage and refetched data!');
  };

  const handleClearComments = async () => {
    await clearCommentsData();
    alert('Cleared comments storage and refetched data!');
  };

  const handleTestFollowersAPI = async () => {
    try {
      console.log('🧪 Testing followers API directly...');
      const { api } = await import('@/api/client');
      const { UrlConstants } = await import('@/constants/apiUrls');
      const response = await api.get(UrlConstants.fetchFollowers);
      console.log('🧪 Direct API response:', JSON.stringify(response.data, null, 2));
      
      if (response.data.status === 'success' && Array.isArray(response.data.data)) {
        const followers = response.data.data;
        alert(`API Test Success!\nFound ${followers.length} followers\nFirst follower: ${followers[0]?.follower?.fname || 'None'}\nCheck console for full data`);
      } else {
        alert('API Test Failed: Invalid response structure');
      }
    } catch (error: any) {
      console.error('🧪 API Test Error:', error);
      alert(`API Test Error: ${error.message}`);
    }
  };

  const handleTestPostLikesAPI = async () => {
    try {
      console.log('🧪 Testing post likes API directly...');
      const { api } = await import('@/api/client');
      const { UrlConstants } = await import('@/constants/apiUrls');
      const response = await api.get(UrlConstants.fetchPostLikes);
      console.log('🧪 Direct API response:', JSON.stringify(response.data, null, 2));
      
      if (response.data.status === 'success' && Array.isArray(response.data.data)) {
        const postLikes = response.data.data;
        alert(`API Test Success!\nFound ${postLikes.length} post likes\nFirst like: ${postLikes[0]?.likee?.fname || 'None'}\nCheck console for full data`);
      } else {
        alert('API Test Failed: Invalid response structure');
      }
    } catch (error: any) {
      console.error('🧪 API Test Error:', error);
      alert(`API Test Error: ${error.message}`);
    }
  };

  const handleTestFriendPostsAPI = async () => {
    try {
      console.log('🧪 Testing friend posts API directly...');
      const { api } = await import('@/api/client');
      const { UrlConstants } = await import('@/constants/apiUrls');
      const response = await api.get(UrlConstants.fetchFriendPosts);
      console.log('🧪 Direct API response:', JSON.stringify(response.data, null, 2));
      
      if (response.data.status === 'success' && Array.isArray(response.data.data)) {
        const friendPosts = response.data.data.filter((post: any) => !post.deletedAt);
        alert(`API Test Success!\nFound ${friendPosts.length} friend posts\nFirst post: ${friendPosts[0]?.creator?.fname || 'None'}\nCheck console for full data`);
      } else {
        alert('API Test Failed: Invalid response structure');
      }
    } catch (error: any) {
      console.error('🧪 API Test Error:', error);
      alert(`API Test Error: ${error.message}`);
    }
  };

  const handleTestCommentsAPI = async () => {
    try {
      console.log('🧪 Testing comments API directly...');
      const { api } = await import('@/api/client');
      const { UrlConstants } = await import('@/constants/apiUrls');
      const response = await api.get(UrlConstants.fetchComments);
      console.log('🧪 Direct API response:', JSON.stringify(response.data, null, 2));
      
      if (response.data.status === 'success' && Array.isArray(response.data.data)) {
        const comments = response.data.data.filter((comment: any) => !comment.tarpPostImg.deletedAt);
        alert(`API Test Success!\nFound ${comments.length} comments\nFirst comment: ${comments[0]?.commenter?.fname || 'None'}\nCheck console for full data`);
      } else {
        alert('API Test Failed: Invalid response structure');
      }
    } catch (error: any) {
      console.error('🧪 API Test Error:', error);
      alert(`API Test Error: ${error.message}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Debug Notifications</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Clear Storage</Text>
        <Pressable style={styles.button} onPress={handleCompleteReset}>
          <Text style={styles.buttonText}>🔄 COMPLETE RESET & TEST</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={async () => {
          console.log('🧹 Clearing all notification storage...');
          await clearNotificationStorage();
          
          // Also clear individual hook storage and trigger refetch
          await clearFollowersData();
          await clearPostLikesData();
          await clearFriendPostsData();
          await clearCommentsData();
          
          alert('Cleared all notification storage and refetched data! Please go back and check notifications.');
        }}>
          <Text style={styles.buttonText}>Clear All Notification Storage</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={handleClearFollowers}>
          <Text style={styles.buttonText}>Clear Followers Only</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={handleClearPostLikes}>
          <Text style={styles.buttonText}>Clear Post Likes Only</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={handleClearFriendPosts}>
          <Text style={styles.buttonText}>Clear Friend Posts Only</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={handleClearComments}>
          <Text style={styles.buttonText}>Clear Comments Only</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Check Storage</Text>
        <Pressable style={styles.button} onPress={handleCheckFollowersStore}>
          <Text style={styles.buttonText}>Check Dismissed Followers</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={handleCheckPostLikesStore}>
          <Text style={styles.buttonText}>Check Dismissed Post Likes</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={handleCheckFriendPostsStore}>
          <Text style={styles.buttonText}>Check Dismissed Friend Posts</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={handleCheckCommentsStore}>
          <Text style={styles.buttonText}>Check Dismissed Comments</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test APIs Directly</Text>
        <Pressable style={styles.button} onPress={handleTestFollowersAPI}>
          <Text style={styles.buttonText}>Test Followers API</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={handleTestPostLikesAPI}>
          <Text style={styles.buttonText}>Test Post Likes API</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={handleTestFriendPostsAPI}>
          <Text style={styles.buttonText}>Test Friend Posts API</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={handleTestCommentsAPI}>
          <Text style={styles.buttonText}>Test Comments API</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={async () => {
          try {
            console.log('🔄 Force checking followers...');
            await checkForNewFollowers();
            alert('Force checked followers! Check console and notification panel.');
          } catch (error: any) {
            alert(`Error: ${error.message}`);
          }
        }}>
          <Text style={styles.buttonText}>Force Check Followers</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={async () => {
          try {
            console.log('🔄 Force checking friend posts...');
            await checkForNewFriendPosts();
            alert('Force checked friend posts! Check console and notification panel.');
          } catch (error: any) {
            alert(`Error: ${error.message}`);
          }
        }}>
          <Text style={styles.buttonText}>Force Check Friend Posts</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={async () => {
          try {
            console.log('🔄 Force checking comments...');
            await checkForNewComments();
            alert('Force checked comments! Check console and notification panel.');
          } catch (error: any) {
            alert(`Error: ${error.message}`);
          }
        }}>
          <Text style={styles.buttonText}>Force Check Comments</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={async () => {
          try {
            console.log('🔄 Force fetching followers...');
            const followers = await fetchFollowers();
            alert(`Fetched ${followers.length} followers! Check console for details.`);
          } catch (error: any) {
            alert(`Error: ${error.message}`);
          }
        }}>
          <Text style={styles.buttonText}>Force Fetch Followers</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={async () => {
          try {
            console.log('🔄 Testing getRecentFollowers directly...');
            const recentFollowers = await getRecentFollowers();
            console.log('🔄 getRecentFollowers result:', recentFollowers);
            alert(`getRecentFollowers returned ${recentFollowers.length} followers! Check console.`);
          } catch (error: any) {
            console.error('Error testing getRecentFollowers:', error);
            alert(`Error: ${error.message}`);
          }
        }}>
          <Text style={styles.buttonText}>Test getRecentFollowers</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={async () => {
          try {
            console.log('🧪 Testing dismiss functionality...');
            
            // Get current followers and post likes
            const followers = await getRecentFollowers();
            
            if (followers.length > 0) {
              console.log('🧪 Dismissing first follower:', followers[0].follower.fname);
              await dismissFollower(followers[0].id);
              alert(`Dismissed follower: ${followers[0].follower.fname}! Check if it disappears from notifications.`);
            } else {
              alert('No followers to dismiss!');
            }
          } catch (error: any) {
            console.error('Error testing dismiss:', error);
            alert(`Error: ${error.message}`);
          }
        }}>
          <Text style={styles.buttonText}>Test Dismiss First Follower</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instructions</Text>
        <Text style={styles.instruction}>
          1. If you can't see any notifications, click "Clear All Notification Storage"
        </Text>
        <Text style={styles.instruction}>
          2. Go back to the main screen and open notifications
        </Text>
        <Text style={styles.instruction}>
          3. You should see all post likes and followers again
        </Text>
        <Text style={styles.instruction}>
          4. Check console logs for detailed debugging info
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3B82F6',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0a0a0a',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0a0a0a',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  instruction: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    lineHeight: 20,
  },
});