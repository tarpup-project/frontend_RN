import { api } from '@/api/client';
import { UrlConstants } from '@/constants/apiUrls';
import { ReferralUtils } from './referralUtils';

export interface SignupData {
  email: string;
  fullName: string;
  universityID?: string;
  stateID?: string;
  password?: string;
}

export class SignupUtils {
  /**
   * Create user account with referral tracking
   */
  static async createUserWithReferral(signupData: SignupData) {
    try {
      // Get referrer ID from storage
      const referrerID = await ReferralUtils.getReferrerID();
      
      // Prepare signup payload
      const payload = {
        ...signupData,
        ...(referrerID && { referrerID }), // Include referrer ID if available
      };

      console.log('👤 Creating user with payload:', {
        ...payload,
        referrerID: referrerID || 'none'
      });

      // Make API call
      const response = await api.post(UrlConstants.createUser, payload);

      // Clear referrer ID after successful signup
      if (referrerID && response.data?.status === 'success') {
        await ReferralUtils.clearReferrerID();
        console.log('✅ User created successfully with referral tracking');
      }

      return response;
    } catch (error) {
      console.error('❌ Error creating user with referral:', error);
      throw error;
    }
  }

  /**
   * Track referral conversion (call after successful signup)
   */
  static async trackReferralConversion(newUserId: string, referrerID?: string | null) {
    try {
      if (!referrerID) {
        referrerID = await ReferralUtils.getReferrerID();
      }

      if (referrerID) {
        console.log('📊 Tracking referral conversion:', {
          newUserId,
          referrerID
        });

        // You can add additional tracking API calls here if needed
        // For example, analytics events, conversion tracking, etc.
      }
    } catch (error) {
      console.error('❌ Error tracking referral conversion:', error);
    }
  }
}