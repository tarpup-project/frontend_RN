import { useTheme } from '@/contexts/ThemeContext';
import { offlineSyncManager } from '@/utils/offlineSync';
import { CacheUtils } from '@/utils/queryClient';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

interface CacheStatusProps {
  visible?: boolean;
  onPress?: () => void;
}

export const CacheStatus: React.FC<CacheStatusProps> = ({ 
  visible = false, 
  onPress 
}) => {
  const { isDark } = useTheme();
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<any>(null);

  useEffect(() => {
    if (visible) {
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

      updateStats();
      const interval = setInterval(updateStats, 1000);

      return () => clearInterval(interval);
    }
  }, [visible]);

  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    text: {
      color: isDark ? "#FFFFFF" : "#000000",
    },
    subtitle: {
      color: isDark ? "#9AA0A6" : "#666666",
    },
  };

  if (!visible || !cacheStats) return null;

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
    return "Online";
  };

  return (
    <Pressable
      style={[styles.container, dynamicStyles.container]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          <Text style={[styles.statusText, dynamicStyles.text]}>
            {getStatusText()}
          </Text>
        </View>
        <Ionicons 
          name="information-circle-outline" 
          size={16} 
          color={dynamicStyles.subtitle.color} 
        />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, dynamicStyles.text]}>
            {cacheStats.totalQueries}
          </Text>
          <Text style={[styles.statLabel, dynamicStyles.subtitle]}>
            Cached
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, dynamicStyles.text]}>
            {cacheStats.freshQueries}
          </Text>
          <Text style={[styles.statLabel, dynamicStyles.subtitle]}>
            Fresh
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, dynamicStyles.text]}>
            {cacheStats.staleQueries}
          </Text>
          <Text style={[styles.statLabel, dynamicStyles.subtitle]}>
            Stale
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 160,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 14,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 10,
  },
});