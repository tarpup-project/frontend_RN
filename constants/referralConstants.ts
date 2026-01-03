export class ReferralConstants {
  static readonly REFERRAL_COOKIE_KEY = 'user.referral';
  static readonly REFERRAL_EXPIRY_DAYS = 1; // 24 hours
  static readonly REFERRAL_BASE_URL = 'https://tarpup.com';
  static readonly REFERRAL_PARAM = 'ref';
}

export interface ReferralData {
  count: number;
  weight: number;
  total: number;
}

export interface UserReferralStats {
  referrals: ReferralData;
  totalReferrals: number;
}

export interface ReferralAnalytics {
  totalClicks: number;
  totalSignups: number;
  conversionRate: number;
  topSources: string[];
  recentActivity: {
    date: string;
    signups: number;
    clicks: number;
  }[];
}