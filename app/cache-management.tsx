import { useTheme } from '@/contexts/ThemeContext';
import { offlineSyncManager } from '@/utils/offlineSync';
import { CacheUtils } from '@/utils/queryClient';
import { StorageUtils } from '@/utils/storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

const CacheManagementScreen = () => {
  const { isDark } = useTheme();
  const router = useRouter();
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<any>(null);
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
    button: {
      backgroundColor: isDark ? "#333333" : "#F5F5F5",
    },
    dangerButton: {
      backgroundColor: "#FF6B6B",
    },
    successButton: {
      backgroundColor: "#51CF66",
    },
  };

  const updateStats = () => {
    setCacheStats(CacheUtils.getCacheStats());
    
    // Only get sync status if the manager is ready
    if (offlineSyncManager.isReady()) {
      setSyncStatus(offlineSyncManager.getSyncStatus());
    } else {
      setSyncStatus({
        isOnline: true,
        isSyncing: false,
        pendingActions: 0,
        queuedActions: [],
      });
    }
  };

  useEffect(() => {
    updateStats();
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    updateStats();
    setIsRefreshing(false);
  };

  const handleClearAllCache = () => {
    Alert.alert(
      'Clear All Cache',
      'This will remove all cached data and you may experience slower loading times. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            CacheUtils.clearAll();
            StorageUtils.clearCache();
            updateStats();
            toast.success('Cache cleared successfully');
          },
        },
      ]
    );
  };

  const handleForceSync = async () => {
    if (!offlineSyncManager.isReady()) {
      toast.error('Sync manager not ready yet');
      return;
    }

    if (!syncStatus.isOnline) {
      toast.error('Cannot sync while offline');
      return;
    }

    try {
      offlineSyncManager.forcSync();
      toast.success('Sync initiated');
      updateStats();
    } catch (error) {
      toast.error('Sync failed');
    }
  };

  const handleClearOfflineData = () => {
    Alert.alert(
      'Clear Offline Data',
      'This will remove all pending offline actions. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            offlineSyncManager.clearOfflineData();
            updateStats();
            toast.success('Offline data cleared');
          },
        },
      ]
    );
  };

  const getStatusColor = () => {
    if (!syncStatus?.isOnline) return "#FF6B6B";
    if (syncStatus?.isSyncing) return "#FFB347";
    if (syncStatus?.pendingActions > 0) return "#4ECDC4";
    return "#51CF66";
  };

  const getStatusText = () => {
    if (!syncStatus?.isOnline) return "Offline";
    if (syncStatus?.isSyncing) return "Syncing...";
    if (syncStatus?.pendingActions > 0) return `${syncStatus.pendingActions} actions pending`;
    return "All synced";
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={dynamicStyles.text.color} />
          </Pressable>
          <Text style={[styles.headerTitle, dynamicStyles.text]}>
            Cache Management
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
        {/* Connection Status */}
        <View style={[styles.card, dynamicStyles.card]}>
          <Text style={[styles.cardTitle, dynamicStyles.text]}>
            Connection Status
          </Text>
          
          <View style={styles.statusContainer}>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
              <Text style={[styles.statusText, dynamicStyles.text]}>
                {getStatusText()}
              </Text>
            </View>
            
            {syncStatus?.pendingActions > 0 && (
              <Pressable
                style={[styles.actionButton, dynamicStyles.successButton]}
                onPress={handleForceSync}
                disabled={!syncStatus.isOnline}
              >
                <Ionicons name="sync" size={16} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>
                  Force Sync
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Cache Statistics */}
        <View style={[styles.card, dynamicStyles.card]}>
          <Text style={[styles.cardTitle, dynamicStyles.text]}>
            Cache Statistics
          </Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, dynamicStyles.text]}>
                {cacheStats?.totalQueries || 0}
              </Text>
              <Text style={[styles.statLabel, dynamicStyles.subtitle]}>
                Total Queries
              </Text>
            </View>
            
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: "#51CF66" }]}>
                {cacheStats?.freshQueries || 0}
              </Text>
              <Text style={[styles.statLabel, dynamicStyles.subtitle]}>
                Fresh
              </Text>
            </View>
            
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: "#FFB347" }]}>
                {cacheStats?.staleQueries || 0}
              </Text>
              <Text style={[styles.statLabel, dynamicStyles.subtitle]}>
                Stale
              </Text>
            </View>
            
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: "#FF6B6B" }]}>
                {cacheStats?.errorQueries || 0}
              </Text>
              <Text style={[styles.statLabel, dynamicStyles.subtitle]}>
                Errors
              </Text>
            </View>
          </View>
        </View>

        {/* Offline Queue */}
        {syncStatus?.queuedActions && syncStatus.queuedActions.length > 0 && (
          <View style={[styles.card, dynamicStyles.card]}>
            <Text style={[styles.cardTitle, dynamicStyles.text]}>
              Offline Queue ({syncStatus.queuedActions.length})
            </Text>
            
            {syncStatus.queuedActions.slice(0, 5).map((action: any, index: number) => (
              <View key={index} style={styles.queueItem}>
                <View style={styles.queueItemContent}>
                  <Text style={[styles.queueItemType, dynamicStyles.text]}>
                    {action.type}
                  </Text>
                  <Text style={[styles.queueItemTime, dynamicStyles.subtitle]}>
                    {new Date(action.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
                <Text style={[styles.queueItemRetry, dynamicStyles.subtitle]}>
                  Retry: {action.retryCount}
                </Text>
              </View>
            ))}
            
            {syncStatus.queuedActions.length > 5 && (
              <Text style={[styles.moreText, dynamicStyles.subtitle]}>
                +{syncStatus.queuedActions.length - 5} more actions
              </Text>
            )}
          </View>
        )}

        {/* Cache Actions */}
        <View style={[styles.card, dynamicStyles.card]}>
          <Text style={[styles.cardTitle, dynamicStyles.text]}>
            Cache Actions
          </Text>
          
          <View style={styles.actionsContainer}>
            <Pressable
              style={[styles.actionButton, dynamicStyles.button]}
              onPress={() => {
                CacheUtils.invalidateAll();
                updateStats();
                toast.success('Cache invalidated');
              }}
            >
              <Ionicons name="refresh" size={16} color={dynamicStyles.text.color} />
              <Text style={[styles.actionButtonText, dynamicStyles.text]}>
                Invalidate All
              </Text>
            </Pressable>
            
            <Pressable
              style={[styles.actionButton, dynamicStyles.dangerButton]}
              onPress={handleClearAllCache}
            >
              <Ionicons name="trash" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>
                Clear All Cache
              </Text>
            </Pressable>
            
            {syncStatus?.pendingActions > 0 && (
              <Pressable
                style={[styles.actionButton, dynamicStyles.dangerButton]}
                onPress={handleClearOfflineData}
              >
                <Ionicons name="cloud-offline" size={16} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>
                  Clear Offline Data
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Performance Tips */}
        <View style={[styles.card, dynamicStyles.card]}>
          <Text style={[styles.cardTitle, dynamicStyles.text]}>
            Performance Tips
          </Text>
          
          <View style={styles.tipsContainer}>
            <View style={styles.tip}>
              <Ionicons name="flash" size={16} color="#FFB347" />
              <Text style={[styles.tipText, dynamicStyles.subtitle]}>
                Fresh data loads instantly from cache
              </Text>
            </View>
            
            <View style={styles.tip}>
              <Ionicons name="cloud-offline" size={16} color="#4ECDC4" />
              <Text style={[styles.tipText, dynamicStyles.subtitle]}>
                Offline actions sync automatically when online
              </Text>
            </View>
            
            <View style={styles.tip}>
              <Ionicons name="refresh" size={16} color="#51CF66" />
              <Text style={[styles.tipText, dynamicStyles.subtitle]}>
                Pull to refresh updates stale data
              </Text>
            </View>
          </View>
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
    paddingHorizontal: 16,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  queueItemContent: {
    flex: 1,
  },
  queueItemType: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  queueItemTime: {
    fontSize: 12,
    marginTop: 2,
  },
  queueItemRetry: {
    fontSize: 12,
  },
  moreText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
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
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tipsContainer: {
    gap: 12,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tipText: {
    fontSize: 14,
    flex: 1,
  },
});

export default CacheManagementScreen;