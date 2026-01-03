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
      <Text style={[styles.title, dynamicStyles.text]}>
        Referrals
      </Text>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.iconContainer}>
          <Ionicons 
            name="people" 
            size={20} 
            color={dynamicStyles.subtitle.color} 
          />
        </View>
        <Text style={[styles.statNumber, dynamicStyles.text]}>
          {totalReferrals}
        </Text>
        <Text style={[styles.statLabel, dynamicStyles.subtitle]}>
          Total Referrals
        </Text>
      </View>

      {/* Description */}
      <Text style={[styles.description, dynamicStyles.subtitle]}>
        Share your unique link and earn rewards when friends join!
      </Text>

      {/* Link and Share Row */}
      <View style={styles.linkRow}>
        <View style={[styles.linkContainer, dynamicStyles.button]}>
          <Text style={[styles.linkText, dynamicStyles.text]} numberOfLines={1}>
            {referralLink}
          </Text>
          <Pressable
            style={styles.copyButton}
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
          </Pressable>
        </View>
        
        <Pressable
          style={[styles.shareButton]}
          onPress={handleShare}
          disabled={isSharing}
        >
          {isSharing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons 
              name="share-outline" 
              size={16} 
              color="#FFFFFF" 
            />
          )}
          <Text style={styles.shareButtonText}>
            Share
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
    padding: 20,
    marginVertical: 16,
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  linkRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  linkContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  linkText: {
    fontSize: 12,
    flex: 1,
    marginRight: 8,
  },
  copyButton: {
    padding: 4,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
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