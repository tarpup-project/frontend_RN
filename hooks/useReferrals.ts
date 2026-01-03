import { api } from '@/api/client';
import { UrlConstants } from '@/constants/apiUrls';
import { ReferralData, UserReferralStats } from '@/constants/referralConstants';
import { useAuthStore } from '@/state/authStore';
import { ReferralUtils } from '@/utils/referralUtils';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export const referralKeys = {
  all: ['referrals'] as const,
  stats: () => [...referralKeys.all, 'stats'] as const,
  userStats: (userId: string) => [...referralKeys.stats(), userId] as const,
};

interface UseReferralsReturn {
  referralStats: ReferralData | null;
  totalReferrals: number;
  referralLink: string;
  isLoading: boolean;
  error: Error | null;
  shareReferralLink: () => Promise<boolean>;
  copyReferralLink: () => Promise<boolean>;
  refetch: () => void;
}

export const useReferrals = (): UseReferralsReturn => {
  const { user } = useAuthStore();
  const [copySuccess, setCopySuccess] = useState(false);

  // Fetch user referral stats
  const { 
    data: statsData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: referralKeys.userStats(user?.id || ''),
    queryFn: async (): Promise<UserReferralStats> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      try {
        // Fetch from analytics endpoint
        const response = await api.get(UrlConstants.getUserReferralStats(user.id));
        console.log('📊 Referral stats response:', JSON.stringify(response.data, null, 2));
        
        if (response.data?.status === 'success') {
          return {
            referrals: response.data.data.referrals || { count: 0, weight: 0, total: 0 },
            totalReferrals: response.data.data.referrals?.count || 0
          };
        }

        // Fallback to user stats endpoint
        const userStatsResponse = await api.get(UrlConstants.getUserStats);
        console.log('📊 User stats response:', JSON.stringify(userStatsResponse.data, null, 2));
        
        return {
          referrals: userStatsResponse.data.data?.referrals || { count: 0, weight: 0, total: 0 },
          totalReferrals: userStatsResponse.data.data?.refferals || 0 // Note: API has typo "refferals"
        };
      } catch (error) {
        console.error('❌ Error fetching referral stats:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  // Generate referral link
  const referralLink = user?.id ? ReferralUtils.generateReferralLink(user.id) : '';

  // Share referral link
  const shareReferralLink = async (): Promise<boolean> => {
    if (!user?.id) return false;
    
    try {
      // Track the share action
      await ReferralUtils.trackReferralClick(user.id, 'share');
      
      const success = await ReferralUtils.shareReferralLink(user.id, user.fname);
      if (success) {
        console.log('✅ Referral link shared successfully');
      }
      return success;
    } catch (error) {
      console.error('❌ Error sharing referral link:', error);
      return false;
    }
  };

  // Copy referral link to clipboard
  const copyReferralLink = async (): Promise<boolean> => {
    if (!user?.id) return false;
    
    try {
      // Track the copy action
      await ReferralUtils.trackReferralClick(user.id, 'copy');
      
      const { setStringAsync } = await import('expo-clipboard');
      await setStringAsync(referralLink);
      console.log('📋 Copying referral link:', referralLink);
      setCopySuccess(true);
      
      // Reset copy success after 2 seconds
      setTimeout(() => setCopySuccess(false), 2000);
      
      return true;
    } catch (error) {
      console.error('❌ Error copying referral link:', error);
      return false;
    }
  };

  return {
    referralStats: statsData?.referrals || null,
    totalReferrals: statsData?.totalReferrals || 0,
    referralLink,
    isLoading,
    error: error as Error | null,
    shareReferralLink,
    copyReferralLink,
    refetch,
  };
};