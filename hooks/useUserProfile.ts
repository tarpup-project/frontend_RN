import { api } from '@/api/client';
import { UrlConstants } from '@/constants/apiUrls';
import { useQuery } from '@tanstack/react-query';

export interface UserProfileDetails {
  id: string;
  fname: string;
  lname?: string;
  name?: string;
  bgUrl?: string;
  avatar?: string;
  profileImage?: string;
  friends: number;
  followers: number;
  following: number;
  posts?: number; // We'll exclude this from display
  createdAt?: string;
  updatedAt?: string;
  // Add other profile fields as needed
}

const userProfileKeys = {
  all: ['userProfile'] as const,
  lists: () => [...userProfileKeys.all, 'list'] as const,
  list: () => [...userProfileKeys.lists()] as const,
  details: () => [...userProfileKeys.all, 'detail'] as const,
  detail: (userId: string) => [...userProfileKeys.details(), userId] as const,
};

// Fetch user profile details from tarps endpoint
const fetchUserProfileDetails = async (userId: string): Promise<UserProfileDetails> => {
  try {
    console.log('👤 Fetching user profile details for:', userId);
    console.log('🔗 API endpoint:', UrlConstants.tarpProfileDetails(userId));
    
    const response = await api.get<{
      status: string;
      data: UserProfileDetails;
    }>(UrlConstants.tarpProfileDetails(userId));

    console.log('📡 Raw API response:', JSON.stringify(response.data, null, 2));

    if (response.data?.status === 'success' && response.data?.data) {
      const profileData = response.data.data;
      console.log('✅ User profile details fetched:', {
        id: profileData.id,
        name: `${profileData.fname} ${profileData.lname || ''}`.trim(),
        friends: profileData.friends,
        followers: profileData.followers,
        following: profileData.following,
        posts: profileData.posts // This will be excluded from display
      });
      return profileData;
    }

    console.warn('⚠️ Invalid profile response:', response.data);
    console.warn('⚠️ Response status:', response.data?.status);
    console.warn('⚠️ Response data:', response.data?.data);
    throw new Error('Invalid profile response');
  } catch (error: any) {
    console.error('❌ Failed to fetch user profile details:', error);
    console.error('❌ Error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    throw error;
  }
};

export const useUserProfile = (userId: string | null | undefined) => {
  return useQuery<UserProfileDetails, Error>({
    queryKey: userProfileKeys.detail(userId || ''),
    queryFn: () => fetchUserProfileDetails(userId!),
    enabled: !!userId, // Only fetch when userId is provided
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    placeholderData: (previousData) => {
      if (previousData) {
        console.log('⚡ Using cached profile data for user:', userId);
      }
      return previousData;
    },
  });
};

// Hook for multiple user profiles (batch fetching)
export const useUserProfiles = (userIds: string[]) => {
  const queries = userIds.map(userId => 
    useUserProfile(userId)
  );

  return {
    profiles: queries.map(query => query.data).filter(Boolean) as UserProfileDetails[],
    isLoading: queries.some(query => query.isLoading),
    errors: queries.map(query => query.error).filter(Boolean),
    hasErrors: queries.some(query => query.error),
    refetchAll: () => queries.forEach(query => query.refetch()),
  };
};