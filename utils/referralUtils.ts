import { ReferralConstants } from '@/constants/referralConstants';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class ReferralUtils {
  /**
   * Generate referral link for a user
   */
  static generateReferralLink(userId: string): string {
    return `${ReferralConstants.REFERRAL_BASE_URL}/?${ReferralConstants.REFERRAL_PARAM}=${userId}`;
  }

  /**
   * Store referrer ID in AsyncStorage (React Native equivalent of cookies)
   */
  static async storeReferrerID(referrerID: string): Promise<void> {
    try {
      const expiryTime = Date.now() + (ReferralConstants.REFERRAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
      const referralData = {
        referrerID,
        expiryTime
      };
      await AsyncStorage.setItem(ReferralConstants.REFERRAL_COOKIE_KEY, JSON.stringify(referralData));
      console.log('✅ Referrer ID stored:', referrerID);
    } catch (error) {
      console.error('❌ Error storing referrer ID:', error);
    }
  }

  /**
   * Get referrer ID from AsyncStorage
   */
  static async getReferrerID(): Promise<string | null> {
    try {
      const storedData = await AsyncStorage.getItem(ReferralConstants.REFERRAL_COOKIE_KEY);
      if (!storedData) return null;

      const { referrerID, expiryTime } = JSON.parse(storedData);
      
      // Check if expired
      if (Date.now() > expiryTime) {
        await AsyncStorage.removeItem(ReferralConstants.REFERRAL_COOKIE_KEY);
        console.log('🕒 Referrer ID expired and removed');
        return null;
      }

      return referrerID;
    } catch (error) {
      console.error('❌ Error getting referrer ID:', error);
      return null;
    }
  }

  /**
   * Clear referrer ID from storage
   */
  static async clearReferrerID(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ReferralConstants.REFERRAL_COOKIE_KEY);
      console.log('🗑️ Referrer ID cleared');
    } catch (error) {
      console.error('❌ Error clearing referrer ID:', error);
    }
  }

  /**
   * Extract referrer ID from deep link URL
   */
  static extractReferrerFromURL(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get(ReferralConstants.REFERRAL_PARAM);
    } catch (error) {
      console.error('❌ Error extracting referrer from URL:', error);
      return null;
    }
  }

  /**
   * Handle incoming deep link for referrals
   */
  static async handleDeepLink(url: string): Promise<void> {
    const referrerID = this.extractReferrerFromURL(url);
    if (referrerID) {
      await this.storeReferrerID(referrerID);
      console.log('🔗 Deep link referral processed:', referrerID);
    }
  }

  /**
   * Track referral link click (for analytics)
   */
  static async trackReferralClick(userId: string, source?: string): Promise<void> {
    try {
      console.log('📊 Tracking referral click:', { userId, source });
      
      // Store click data locally for analytics
      const clickData = {
        userId,
        source: source || 'direct',
        timestamp: Date.now(),
      };
      
      const existingClicks = await AsyncStorage.getItem('referral_clicks');
      const clicks = existingClicks ? JSON.parse(existingClicks) : [];
      clicks.push(clickData);
      
      // Keep only last 100 clicks to avoid storage bloat
      if (clicks.length > 100) {
        clicks.splice(0, clicks.length - 100);
      }
      
      await AsyncStorage.setItem('referral_clicks', JSON.stringify(clicks));
      
      // You can also send this to your analytics API here
      // await api.post('/analytics/referral-click', clickData);
      
    } catch (error) {
      console.error('❌ Error tracking referral click:', error);
    }
  }

  /**
   * Get referral analytics data
   */
  static async getReferralAnalytics(userId: string): Promise<any> {
    try {
      const clicksData = await AsyncStorage.getItem('referral_clicks');
      const clicks = clicksData ? JSON.parse(clicksData) : [];
      
      const userClicks = clicks.filter((click: any) => click.userId === userId);
      
      return {
        totalClicks: userClicks.length,
        recentClicks: userClicks.slice(-10), // Last 10 clicks
        sources: userClicks.reduce((acc: any, click: any) => {
          acc[click.source] = (acc[click.source] || 0) + 1;
          return acc;
        }, {}),
      };
    } catch (error) {
      console.error('❌ Error getting referral analytics:', error);
      return { totalClicks: 0, recentClicks: [], sources: {} };
    }
  }
  static formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  /**
   * Share referral link using native sharing
   */
  static async shareReferralLink(userId: string, userName?: string): Promise<boolean> {
    try {
      const referralLink = this.generateReferralLink(userId);
      const shareMessage = `Hey! Sign up to TarpAI Connect using my referral link and let's connect there!\n\n${referralLink}`;
      
      // Try using React Native's Share API first
      const { Share } = require('react-native');
      
      const result = await Share.share({
        message: shareMessage,
        title: 'Join me on TarpAI Connect 🎉',
        url: referralLink,
      });

      // Check if sharing was successful
      if (result.action === Share.sharedAction) {
        console.log('✅ Referral link shared successfully');
        return true;
      } else if (result.action === Share.dismissedAction) {
        console.log('📱 Share dialog dismissed');
        return false;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error sharing referral link:', error);
      
      // Fallback to copying to clipboard
      try {
        const { default: Clipboard } = await import('expo-clipboard');
        const referralLink = this.generateReferralLink(userId);
        await Clipboard.setStringAsync(referralLink);
        console.log('📋 Referral link copied to clipboard as fallback');
        return true;
      } catch (clipboardError) {
        console.error('❌ Clipboard fallback failed:', clipboardError);
        return false;
      }
    }
  }
}