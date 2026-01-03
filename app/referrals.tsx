import { ReferralCard } from '@/components/ReferralCard';
import { useTheme } from '@/contexts/ThemeContext';
import { useReferrals } from '@/hooks/useReferrals';
import { useAuthStore } from '@/state/authStore';
import { ReferralUtils } from '@/utils/referralUtils';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { toast } from 'sonner-native';

const ReferralsScreen = () => {
  const { isDark } = useTheme();
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    referralStats,
    totalReferrals,
    refetch,
  } = useReferrals();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
    },
    text: {
      color: isDark ? "#FFFFFF" : "#000000",
    },
    subtitle: {
      color: isDark ? "#9AA0A6" : "#666666",
    },
    card: {
      backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    header: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
      borderBottomColor: isDark ? "#333333" : "#E0E0E0",
    },
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      refetch();
    } catch (error) {
      console.error('Error refreshing referrals:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleInviteFriends = () => {
    Alert.alert(
      'Invite Friends',
      'Choose how you want to invite your friends:',
      [
        {
          text: 'Share Link',
          onPress: async () => {
            const success = await ReferralUtils.shareReferralLink(user?.id || '', user?.fname);
            if (success) {
              toast.success('Referral link shared!');
            } else {
              toast.error('Failed to share link');
            }
          },
        },
        {
          text: 'Copy Link',
          onPress: async () => {
            // Simulate copy to clipboard
            toast.success('Link copied to clipboard!');
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const referralTips = [
    {
      icon: 'people-outline',
      title: 'Share with Friends',
      description: 'Send your referral link to friends who would love TarpAI Connect',
    },
    {
      icon: 'school-outline',
      title: 'Campus Communities',
      description: 'Share in your university groups, clubs, and study circles',
    },
    {
      icon: 'chatbubbles-outline',
      title: 'Social Media',
      description: 'Post your referral link on social platforms and messaging apps',
    },
    {
      icon: 'trophy-outline',
      title: 'Earn Rewards',
      description: 'Get points for each successful referral and climb the leaderboard',
    },
  ];

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      {/* Header */}
      <View style={[styles.header, dynamicStyles.header]}>
        <View style={styles.headerContent}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={dynamicStyles.text.color} />
          </Pressable>
          <Text style={[styles.headerTitle, dynamicStyles.text]}>
            Referrals
          </Text>
          <View style={styles.headerRight} />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={dynamicStyles.text.color}
          />
        }
      >
        {/* Main Referral Card */}
        <ReferralCard showStats={true} compact={false} />

        {/* Quick Stats */}
        <View style={[styles.quickStatsCard, dynamicStyles.card]}>
          <Text style={[styles.cardTitle, dynamicStyles.text]}>
            Your Referral Performance
          </Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, dynamicStyles.text]}>
                {ReferralUtils.formatNumber(totalReferrals)}
              </Text>
              <Text style={[styles.statLabel, dynamicStyles.subtitle]}>
                Total Referrals
              </Text>
            </View>
            
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, dynamicStyles.text]}>
                {referralStats ? ReferralUtils.formatNumber(referralStats.weight) : '0'}
              </Text>
              <Text style={[styles.statLabel, dynamicStyles.subtitle]}>
                Points per Referral
              </Text>
            </View>
            
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, dynamicStyles.text]}>
                {referralStats ? ReferralUtils.formatNumber(referralStats.total) : '0'}
              </Text>
              <Text style={[styles.statLabel, dynamicStyles.subtitle]}>
                Total Points Earned
              </Text>
            </View>
          </View>
        </View>

        {/* How It Works */}
        <View style={[styles.howItWorksCard, dynamicStyles.card]}>
          <Text style={[styles.cardTitle, dynamicStyles.text]}>
            How Referrals Work
          </Text>
          
          <View style={styles.stepsContainer}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, dynamicStyles.text]}>
                  Share Your Link
                </Text>
                <Text style={[styles.stepDescription, dynamicStyles.subtitle]}>
                  Send your unique referral link to friends
                </Text>
              </View>
            </View>
            
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, dynamicStyles.text]}>
                  Friend Signs Up
                </Text>
                <Text style={[styles.stepDescription, dynamicStyles.subtitle]}>
                  They create an account using your link
                </Text>
              </View>
            </View>
            
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, dynamicStyles.text]}>
                  Earn Rewards
                </Text>
                <Text style={[styles.stepDescription, dynamicStyles.subtitle]}>
                  Get points and climb the leaderboard
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tips for Success */}
        <View style={[styles.tipsCard, dynamicStyles.card]}>
          <Text style={[styles.cardTitle, dynamicStyles.text]}>
            Tips for Success
          </Text>
          
          {referralTips.map((tip, index) => (
            <View key={index} style={styles.tip}>
              <View style={[styles.tipIcon, { backgroundColor: isDark ? "#333333" : "#F5F5F5" }]}>
                <Ionicons
                  name={tip.icon as any}
                  size={20}
                  color={dynamicStyles.text.color}
                />
              </View>
              <View style={styles.tipContent}>
                <Text style={[styles.tipTitle, dynamicStyles.text]}>
                  {tip.title}
                </Text>
                <Text style={[styles.tipDescription, dynamicStyles.subtitle]}>
                  {tip.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Progress to Next Milestone */}
        <View style={[styles.progressCard, dynamicStyles.card]}>
          <Text style={[styles.cardTitle, dynamicStyles.text]}>
            Progress to Next Milestone
          </Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressInfo}>
              <Text style={[styles.progressCurrent, dynamicStyles.text]}>
                {totalReferrals}
              </Text>
              <Text style={[styles.progressTarget, dynamicStyles.subtitle]}>
                / 10 referrals
              </Text>
            </View>
            
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { 
                    width: `${Math.min((totalReferrals / 10) * 100, 100)}%`,
                    backgroundColor: '#4F46E5'
                  }
                ]} 
              />
            </View>
            
            <Text style={[styles.progressReward, dynamicStyles.subtitle]}>
              🎉 Next reward: Premium features unlock
            </Text>
          </View>
        </View>

        {/* Leaderboard Preview */}
        <View style={[styles.leaderboardCard, dynamicStyles.card]}>
          <View style={styles.leaderboardHeader}>
            <Text style={[styles.cardTitle, dynamicStyles.text]}>
              Referral Leaderboard
            </Text>
            <Pressable onPress={() => {/* Navigate to full leaderboard */}}>
              <Text style={[styles.viewAllText, { color: '#4F46E5' }]}>
                View All
              </Text>
            </Pressable>
          </View>
          
          <View style={styles.leaderboardPreview}>
            <View style={styles.leaderboardItem}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>1</Text>
              </View>
              <Text style={[styles.leaderboardName, dynamicStyles.text]}>
                You
              </Text>
              <Text style={[styles.leaderboardScore, dynamicStyles.subtitle]}>
                {ReferralUtils.formatNumber(totalReferrals)} referrals
              </Text>
            </View>
            
            <Text style={[styles.leaderboardNote, dynamicStyles.subtitle]}>
              Keep inviting friends to climb the leaderboard!
            </Text>
          </View>
        </View>

        {/* Call to Action */}
        <View style={styles.ctaContainer}>
          <Pressable
            style={[styles.ctaButton, { backgroundColor: isDark ? "#FFFFFF" : "#000000" }]}
            onPress={handleInviteFriends}
          >
            <Ionicons
              name="share-social"
              size={20}
              color={isDark ? "#000000" : "#FFFFFF"}
            />
            <Text style={[styles.ctaButtonText, { color: isDark ? "#000000" : "#FFFFFF" }]}>
              Invite Friends Now
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  quickStatsCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  howItWorksCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  stepsContainer: {
    gap: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  tipsCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  tipDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  ctaContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  leaderboardCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  leaderboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  leaderboardPreview: {
    gap: 12,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  leaderboardName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  leaderboardScore: {
    fontSize: 12,
  },
  leaderboardNote: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  progressCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  progressContainer: {
    gap: 12,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  progressCurrent: {
    fontSize: 32,
    fontWeight: '700',
  },
  progressTarget: {
    fontSize: 16,
    marginLeft: 4,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(79, 70, 229, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressReward: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default ReferralsScreen;