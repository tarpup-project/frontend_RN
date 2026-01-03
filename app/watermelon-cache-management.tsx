import { useTheme } from '@/contexts/ThemeContext';
import { useWatermelon } from '@/contexts/WatermelonProvider';
import { watermelonOfflineSyncManager } from '@/utils/watermelonOfflineSync';
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

const WatermelonCacheManagementScreen = () => {
  const { isDark } = useTheme();
  const router = useRouter();
  const { stats, unsyncedCount, refreshStats, clearAll, isWatermelonAvailable } = useWatermelon();
  const [syncStatus, setSyncStatus] = useState<any>({});
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
      backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    header: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
      borderBottomColor: isDark ? "#333333" : "#E0E0E0",
    },
  };

  useEffect(() => {
    updateSyncStatus();
    const interval = setInterval(updateSyncStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const updateSyncStatus = async () => {
    try {
      const status = await watermelonOfflineSyncManager.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Failed to get sync status:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshStats();
      await updateSyncStatus();
      toast.success('Stats refreshed');
    } catch (error) {
      toast.error('Failed to refresh stats');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleForceSync = async () => {
    if (!syncStatus.isOnline) {
      toast.error('Cannot sync while offline');
      return;
    }

    try {
      watermelonOfflineSyncManager.forceSync();
      toast.success('Sync initiated');
      await updateSyncStatus();
    } catch (error) {
      toast.error('Sync failed');
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all cached data including messages, groups, and prompts. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAll();
              toast.success('All data cleared');
            } catch (error) {
              toast.error('Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const handleClearOfflineData = () => {
    Alert.alert(
      'Clear Offline Queue',
      'This will clear all pending offline actions. Unsent messages will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await watermelonOfflineSyncManager.clearOfflineData();
              await updateSyncStatus();
              toast.success('Offline queue cleared');
            } catch (error) {
              toast.error('Failed to clear offline data');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = () => {
    if (!syncStatus.isOnline) return "#FF6B6B";
    if (syncStatus.isSyncing) return "#FFB347";
    if (syncStatus.pendingActions > 0) return "#4ECDC4";
    return "#51CF66";
  };

  const getStatusText = () => {
    if (!syncStatus.isOnline) return "Offline";
    if (syncStatus.isSyncing) return "Syncing...";
    if (syncStatus.pendingActions > 0) return `${syncStatus.pendingActions} pending`;
    return "All synced";
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
            {isWatermelonAvailable ? 'WatermelonDB Cache' : 'AsyncStorage Cache'}
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
        {/* Sync Status */}
        <View style={[styles.card, dynamicStyles.card]}>
          <Text style={[styles.cardTitle, dynamicStyles.text]}>
            Sync Status
          </Text>
          
          <View style={styles.statusContainer}>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
              <Text style={[styles.statusText, dynamicStyles.text]}>
                {getStatusText()}
              </Text>
            </View>
            
            <View style={styles.statusDetails}>
              <Text style={[styles.statusDetail, dynamicStyles.subtitle]}>
                Network: {syncStatus.isOnline ? 'Online' : 'Offline'}
              </Text>
              <Text style={[styles.statusDetail, dynamicStyles.subtitle]}>
                Pending: {syncStatus.pendingActions || 0} actions
              </Text>
              <Text style={[styles.statusDetail, dynamicStyles.subtitle]}>
                Failed: {syncStatus.failedActions || 0} actions
              </Text>
            </View>
          </View>
        </View>

        {/* Database Statistics */}
        <View style={[styles.card, dynamicStyles.card]}>
          <Text style={[styles.cardTitle, dynamicStyles.text]}>
            Database Statistics
          </Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, dynamicStyles.text]}>
                {stats.groups || 0}
              </Text>
              <Text style={[styles.statLabel, dynamicStyles.subtitle]}>
                Groups
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, dynamicStyles.text]}>
                {stats.messages || 0}
              </Text>
              <Text style={[styles.statLabel, dynamicStyles.subtitle]}>
                Messages
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, dynamicStyles.text]}>
                {stats.prompts || 0}
              </Text>
              <Text style={[styles.statLabel, dynamicStyles.subtitle]}>
                Prompts
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, dynamicStyles.text]}>
                {stats.users || 0}
              </Text>
              <Text style={[styles.statLabel, dynamicStyles.subtitle]}>
                Users
              </Text>
            </View>
          </View>
          
          <View style={styles.totalRow}>
            <Text style={[styles.totalText, dynamicStyles.text]}>
              Total Records: {stats.total || 0}
            </Text>
          </View>
        </View>

        {/* Unsynced Data */}
        <View style={[styles.card, dynamicStyles.card]}>
          <Text style={[styles.cardTitle, dynamicStyles.text]}>
            Unsynced Data
          </Text>
          
          <View style={styles.unsyncedGrid}>
            <View style={styles.unsyncedItem}>
              <Text style={[styles.unsyncedNumber, dynamicStyles.text]}>
                {unsyncedCount.groups || 0}
              </Text>
              <Text style={[styles.unsyncedLabel, dynamicStyles.subtitle]}>
                Groups
              </Text>
            </View>
            
            <View style={styles.unsyncedItem}>
              <Text style={[styles.unsyncedNumber, dynamicStyles.text]}>
                {unsyncedCount.messages || 0}
              </Text>
              <Text style={[styles.unsyncedLabel, dynamicStyles.subtitle]}>
                Messages
              </Text>
            </View>
            
            <View style={styles.unsyncedItem}>
              <Text style={[styles.unsyncedNumber, dynamicStyles.text]}>
                {unsyncedCount.actions || 0}
              </Text>
              <Text style={[styles.unsyncedLabel, dynamicStyles.subtitle]}>
                Actions
              </Text>
            </View>
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
              onPress={handleForceSync}
              disabled={!syncStatus.isOnline}
            >
              <Ionicons name="sync" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Force Sync</Text>
            </Pressable>
            
            <Pressable
              style={[styles.actionButton, { backgroundColor: '#F59E0B' }]}
              onPress={handleClearOfflineData}
            >
              <Ionicons name="cloud-offline" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Clear Queue</Text>
            </Pressable>
            
            <Pressable
              style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
              onPress={handleClearCache}
            >
              <Ionicons name="trash" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Clear All</Text>
            </Pressable>
          </View>
        </View>

        {/* Database Info */}
        <View style={[styles.card, dynamicStyles.card]}>
          <Text style={[styles.cardTitle, dynamicStyles.text]}>
            Database Info
          </Text>
          
          <View style={styles.infoContainer}>
            <Text style={[styles.infoText, dynamicStyles.text]}>
              • Engine: {isWatermelonAvailable ? 'WatermelonDB + SQLite' : 'AsyncStorage (Fallback)'}
            </Text>
            <Text style={[styles.infoText, dynamicStyles.text]}>
              • Offline-First: Full support
            </Text>
            <Text style={[styles.infoText, dynamicStyles.text]}>
              • Real-time Sync: Automatic
            </Text>
            <Text style={[styles.infoText, dynamicStyles.text]}>
              • Performance: {isWatermelonAvailable ? 'Optimized for React Native' : 'Memory-cached AsyncStorage'}
            </Text>
            <Text style={[styles.infoText, dynamicStyles.text]}>
              • Storage: {isWatermelonAvailable ? 'Local SQLite database' : 'AsyncStorage with memory cache'}
            </Text>
            {!isWatermelonAvailable && (
              <Text style={[styles.infoText, { color: '#F59E0B' }]}>
                • Note: Using fallback mode (WatermelonDB not available in Expo managed workflow)
              </Text>
            )}
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
    minWidth: '22%',
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
  totalRow: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    alignItems: 'center',
  },
  totalText: {
    fontSize: 14,
    fontWeight: '600',
  },
  unsyncedGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  unsyncedItem: {
    alignItems: 'center',
  },
  unsyncedNumber: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  unsyncedLabel: {
    fontSize: 12,
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
  infoContainer: {
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default WatermelonCacheManagementScreen;