import { useTheme } from '@/contexts/ThemeContext';
import { useReferrals } from '@/hooks/useReferrals';
import { ReferralUtils } from '@/utils/referralUtils';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { toast } from 'sonner-native';

interface ReferralCardProps {
  showStats?: boolean;
  compact?: boolean;
}

export const ReferralCard: React.FC<ReferralCardProps> = ({ 
  showStats = true, 
  compact = false 
}) => {
  const { isDark } = useTheme();
  const router = useRouter();
  const {
    referralStats,
    totalReferrals,
    referralLink,
    isLoading,
    shareReferralLink,
    copyReferralLink,
  } = useReferrals();

  const [isSharing, setIsSharing] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    text: {
      color: isDark ? "#FFFFFF" : "#000000",
    },
    subtitle: {
      color: isDark ? "#9AA0A6" : "#666666",
    },
    button: {
      backgroundColor: isDark ? "#333333" : "#F5F5F5",
      borderColor: isDark ? "#444444" : "#E0E0E0",
    },
    primaryButton: {
      backgroundColor: isDark ? "#FFFFFF" : "#000000",
    },
    primaryButtonText: {
      color: isDark ? "#000000" : "#FFFFFF",
    },
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const success = await shareReferralLink();
      if (success) {
        toast.success('Referral link shared!');
      } else {
        // Fallback to copy
        await handleCopy();
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to share link');
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopy = async () => {
    setIsCopying(true);
    try {
      const success = await copyReferralLink();
      if (success) {
        toast.success('Link copied to clipboard!');
      } else {
        toast.error('Failed to copy link');
      }
    } catch (error) {
      console.error('Error copying:', error);
      toast.error('Failed to copy link');
    } finally {
      setIsCopying(false);
    }
  };

  const handleLinkPress = () => {
    Alert.alert(
      'Share Referral Link',
      'Choose how you want to share your referral link:',
      [
        {
          text: 'Copy Link',
          onPress: handleCopy,
          style: 'default',
        },
        {
          text: 'Share',
          onPress: handleShare,
          style: 'default',
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, dynamicStyles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={isDark ? "#FFFFFF" : "#000000"} />
        <Text style={[styles.loadingText, dynamicStyles.subtitle]}>
          Loading referral data...
        </Text>
      </View>
    );
  }

  if (compact) {
    return (
      <View style={[styles.compactContainer, dynamicStyles.container]}>
        <View style={styles.compactContent}>
          <View style={styles.compactStats}>
            <Text style={[styles.compactNumber, dynamicStyles.text]}>
              {ReferralUtils.formatNumber(totalReferrals)}
            </Text>
            <Text style={[styles.compactLabel, dynamicStyles.subtitle]}>
              Referrals
            </Text>
          </View>
          <Pressable
            style={[styles.compactButton, dynamicStyles.button]}
            onPress={handleLinkPress}
            disabled={isSharing || isCopying}
          >
            <Ionicons 
              name="share-outline" 
              size={16} 
              color={dynamicStyles.text.color} 
            />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons 
            name="people-outline" 
            size={24} 
            color={dynamicStyles.text.color} 
          />
          <Text style={[styles.title, dynamicStyles.text]}>
            Invite Friends
          </Text>
          <Pressable
            style={styles.viewDetailsButton}
            onPress={() => router.push('/referrals')}
          >
            <Text style={[styles.viewDetailsText, dynamicStyles.text]}>
              View Details
            </Text>
            <Ionicons 
              name="chevron-forward" 
              size={16} 
              color={dynamicStyles.text.color} 
            />
          </Pressable>
        </View>
        <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
          Share TarpAI and earn rewards
        </Text>
      </View>

      {/* Stats */}
      {showStats && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, dynamicStyles.text]}>
              {new Intl.NumberFormat('en-US').format(totalReferrals)}
            </Text>
            <Text style={[styles.statLabel, dynamicStyles.subtitle]}>
              Total Referrals
            </Text>
          </View>
          
          {referralStats && (
            <>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, dynamicStyles.text]}>
                  {ReferralUtils.formatNumber(referralStats.weight)}
                </Text>
                <Text style={[styles.statLabel, dynamicStyles.subtitle]}>
                  Points per Referral
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, dynamicStyles.text]}>
                  {ReferralUtils.formatNumber(referralStats.total)}
                </Text>
                <Text style={[styles.statLabel, dynamicStyles.subtitle]}>
                  Total Points
                </Text>
              </View>
            </>
          )}
        </View>
      )}

      {/* Referral Link */}
      <View style={styles.linkContainer}>
        <Text style={[styles.linkLabel, dynamicStyles.subtitle]}>
          Your Referral Link:
        </Text>
        <Pressable
          style={[styles.linkButton, dynamicStyles.button]}
          onPress={handleLinkPress}
        >
          <Text style={[styles.linkText, dynamicStyles.text]} numberOfLines={1}>
            {referralLink}
          </Text>
          <Ionicons 
            name="copy-outline" 
            size={16} 
            color={dynamicStyles.text.color} 
          />
        </Pressable>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Pressable
          style={[styles.actionButton, dynamicStyles.button]}
          onPress={handleCopy}
          disabled={isCopying}
        >
          {isCopying ? (
            <ActivityIndicator size="small" color={dynamicStyles.text.color} />
          ) : (
            <Ionicons 
              name="copy-outline" 
              size={16} 
              color={dynamicStyles.text.color} 
            />
          )}
          <Text style={[styles.actionButtonText, dynamicStyles.text]}>
            Copy Link
          </Text>
        </Pressable>

        <Pressable
          style={[styles.actionButton, styles.primaryActionButton, dynamicStyles.primaryButton]}
          onPress={handleShare}
          disabled={isSharing}
        >
          {isSharing ? (
            <ActivityIndicator size="small" color={dynamicStyles.primaryButtonText.color} />
          ) : (
            <Ionicons 
              name="share-outline" 
              size={16} 
              color={dynamicStyles.primaryButtonText.color} 
            />
          )}
          <Text style={[styles.actionButtonText, dynamicStyles.primaryButtonText]}>
            Share Link
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    margin: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  header: {
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginLeft: 8,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  linkContainer: {
    marginBottom: 16,
  },
  linkLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  linkText: {
    fontSize: 12,
    flex: 1,
    marginRight: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  primaryActionButton: {
    borderWidth: 0,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  compactContainer: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactStats: {
    alignItems: 'center',
  },
  compactNumber: {
    fontSize: 16,
    fontWeight: '700',
  },
  compactLabel: {
    fontSize: 11,
  },
  compactButton: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
});