import { useTheme } from '@/contexts/ThemeContext';
import { secureTokenStorage } from '@/utils/secureTokenStorage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { toast } from 'sonner-native';

interface TokenInfo {
  accessTokenExpiry: Date | null;
  refreshTokenExpiry: Date | null;
  accessTokenValid: boolean;
  refreshTokenValid: boolean;
}

const TokenManagementScreen = () => {
  const { isDark } = useTheme();
  const router = useRouter();
  const [tokenInfo, setTokenInfo] = useState<TokenInfo>({
    accessTokenExpiry: null,
    refreshTokenExpiry: null,
    accessTokenValid: false,
    refreshTokenValid: false,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
      backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    header: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
      borderBottomColor: isDark ? "#333333" : "#E0E0E0",
    },
  };

  useEffect(() => {
    loadTokenInfo();
  }, []);

  const loadTokenInfo = async () => {
    setIsLoading(true);
    try {
      const info = await secureTokenStorage.getTokenExpiryInfo();
      setTokenInfo(info);
    } catch (error) {
      console.error('Failed to load token info:', error);
      toast.error('Failed to load token information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadTokenInfo();
      toast.success('Token info refreshed');
    } catch (error) {
      toast.error('Failed to refresh token info');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefreshTokens = async () => {
    try {
      const success = await secureTokenStorage.refreshTokens();
      if (success) {
        toast.success('Tokens refreshed successfully');
        await loadTokenInfo();
      } else {
        toast.error('Failed to refresh tokens');
      }
    } catch (error) {
      toast.error('Token refresh failed');
    }
  };

  const handleClearTokens = () => {
    Alert.alert(
      'Clear Tokens',
      'This will log you out and clear all stored tokens. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await secureTokenStorage.clearTokens();
              toast.success('Tokens cleared');
              router.back();
            } catch (error) {
              toast.error('Failed to clear tokens');
            }
          },
        },
      ]
    );
  };

  const formatTimeRemaining = (expiry: Date | null): string => {
    if (!expiry) return 'Unknown';
    
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusColor = (isValid: boolean) => {
    return isValid ? "#10B981" : "#EF4444";
  };

  const getStatusText = (isValid: boolean) => {
    return isValid ? "Valid" : "Invalid/Expired";
  };

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
            Token Management
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
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={dynamicStyles.text.color} />
            <Text style={[styles.loadingText, dynamicStyles.text]}>
              Loading token information...
            </Text>
          </View>
        ) : (
          <>
            {/* Access Token Status */}
            <View style={[styles.card, dynamicStyles.card]}>
              <Text style={[styles.cardTitle, dynamicStyles.text]}>
                Access Token
              </Text>
              
              <View style={styles.statusContainer}>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(tokenInfo.accessTokenValid) }]} />
                  <Text style={[styles.statusText, dynamicStyles.text]}>
                    {getStatusText(tokenInfo.accessTokenValid)}
                  </Text>
                </View>
                
                <View style={styles.statusDetails}>
                  <Text style={[styles.statusDetail, dynamicStyles.subtitle]}>
                    Expires: {tokenInfo.accessTokenExpiry?.toLocaleString() || 'Unknown'}
                  </Text>
                  <Text style={[styles.statusDetail, dynamicStyles.subtitle]}>
                    Time remaining: {formatTimeRemaining(tokenInfo.accessTokenExpiry)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Refresh Token Status */}
            <View style={[styles.card, dynamicStyles.card]}>
              <Text style={[styles.cardTitle, dynamicStyles.text]}>
                Refresh Token
              </Text>
              
              <View style={styles.statusContainer}>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(tokenInfo.refreshTokenValid) }]} />
                  <Text style={[styles.statusText, dynamicStyles.text]}>
                    {getStatusText(tokenInfo.refreshTokenValid)}
                  </Text>
                </View>
                
                <View style={styles.statusDetails}>
                  <Text style={[styles.statusDetail, dynamicStyles.subtitle]}>
                    Expires: {tokenInfo.refreshTokenExpiry?.toLocaleString() || 'Unknown'}
                  </Text>
                  <Text style={[styles.statusDetail, dynamicStyles.subtitle]}>
                    Time remaining: {formatTimeRemaining(tokenInfo.refreshTokenExpiry)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Security Information */}
            <View style={[styles.card, dynamicStyles.card]}>
              <Text style={[styles.cardTitle, dynamicStyles.text]}>
                Security Information
              </Text>
              
              <View style={styles.infoContainer}>
                <Text style={[styles.infoText, dynamicStyles.text]}>
                  • Tokens are stored securely using Expo SecureStore
                </Text>
                <Text style={[styles.infoText, dynamicStyles.text]}>
                  • Access tokens are automatically refreshed when needed
                </Text>
                <Text style={[styles.infoText, dynamicStyles.text]}>
                  • Tokens are encrypted and protected by device security
                </Text>
                <Text style={[styles.infoText, dynamicStyles.text]}>
                  • Auto-refresh runs every 5 minutes in background
                </Text>
                <Text style={[styles.infoText, dynamicStyles.text]}>
                  • Tokens are cleared on logout or app uninstall
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={[styles.card, dynamicStyles.card]}>
              <Text style={[styles.cardTitle, dynamicStyles.text]}>
                Actions
              </Text>
              
              <View style={styles.actionsContainer}>
                <Pressable
                  style={[styles.actionButton, { backgroundColor: '#4F46E5' }]}
                  onPress={handleRefreshTokens}
                  disabled={!tokenInfo.refreshTokenValid}
                >
                  <Ionicons name="refresh" size={16} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Refresh Tokens</Text>
                </Pressable>
                
                <Pressable
                  style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
                  onPress={handleClearTokens}
                >
                  <Ionicons name="trash" size={16} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Clear Tokens</Text>
                </Pressable>
              </View>
            </View>
          </>
        )}
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
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  statusContainer: {
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusDetails: {
    gap: 4,
  },
  statusDetail: {
    fontSize: 14,
  },
  infoContainer: {
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TokenManagementScreen;