import { api } from '@/api/client';
import { UrlConstants } from '@/constants/apiUrls';
import { database, isWatermelonAvailable, messagesCollection, offlineActionsCollection } from '@/database';
import OfflineAction from '@/database/models/OfflineAction';
import { Q } from '@nozbe/watermelondb';
import { NativeModules } from 'react-native';

class WatermelonOfflineSyncManager {
  private isOnline = true;
  private isSyncing = false;
  private syncInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (!isWatermelonAvailable) return;
    this.initializeNetworkListener();
    this.startPeriodicSync();
  }

  private async initializeNetworkListener() {
    try {
      // Check if native module is available BEFORE import to prevent crash
      if (!NativeModules || !NativeModules.RNCNetInfo) {
         console.warn('⚠️ NetInfo native module (RNCNetInfo) not found, offline sync disabled');
         this.isOnline = true; // Assume online as fallback
         return;
      }

      // Dynamic import to avoid initialization issues
      const NetInfo = await import('@react-native-community/netinfo');
      
      // Check if native module is available
      if (!NetInfo.default || !NetInfo.default.fetch) {
         console.warn('⚠️ NetInfo native module not available, offline sync disabled');
         this.isOnline = true; // Assume online as fallback
         return;
      }

      NetInfo.default.addEventListener(state => {
        const wasOffline = !this.isOnline;
        this.isOnline = state.isConnected ?? false;
        
        console.log('🌐 Network status:', this.isOnline ? 'Online' : 'Offline');
        
        // If we just came back online, sync pending actions
        if (wasOffline && this.isOnline) {
          console.log('🔄 Back online - starting sync');
          this.syncPendingActions();
        }
      });
    } catch (error) {
      console.warn('⚠️ Failed to initialize network listener:', error);
      // Assume online if we can't detect network status
      this.isOnline = true;
    }
  }

  private startPeriodicSync() {
    // Sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncPendingActions();
      }
    }, 30000);
  }

  async addToQueue(actionType: string, data: any, maxRetries = 3) {
    if (!isWatermelonAvailable || !database || !offlineActionsCollection) return;

    try {
      await database.write(async () => {
        await offlineActionsCollection!.create((action: any) => {
          action.actionType = actionType;
          action.data = JSON.stringify(data);
          action.retryCount = 0;
          action.maxRetries = maxRetries;
          action.isSynced = false;
        });
      });

      console.log('📝 Added offline action:', actionType);

      // Try to sync immediately if online
      if (this.isOnline) {
        this.syncPendingActions();
      }
    } catch (error) {
      console.error('❌ Failed to add action to queue:', error);
    }
  }

  async syncPendingActions() {
    if (!isWatermelonAvailable || !database || !offlineActionsCollection || this.isSyncing || !this.isOnline) {
      return;
    }

    this.isSyncing = true;

    try {
      const pendingActions = await offlineActionsCollection
        .query(
          Q.where('is_synced', false),
          Q.sortBy('created_at', Q.asc)
        )
        .fetch();

      if (pendingActions.length === 0) {
        this.isSyncing = false;
        return;
      }

      console.log(`🔄 Syncing ${pendingActions.length} offline actions`);

      for (const action of pendingActions) {
        try {
          await this.syncAction(action);
          
          // Mark as synced
          await database.write(async () => {
            await action.update((a: any) => {
              a.isSynced = true;
            });
          });
          
          console.log('✅ Synced action:', action.actionType);
        } catch (error) {
          console.error('❌ Failed to sync action:', action.actionType, error);
          
          // Increment retry count
          await database.write(async () => {
            await action.update((a: any) => {
              a.retryCount = a.retryCount + 1;
            });
          });
          
          // Remove if max retries reached
          if (action.retryCount >= action.maxRetries) {
            console.log('🚫 Max retries reached for action:', action.actionType);
            await database.write(async () => {
              await action.markAsDeleted();
            });
          }
        }
      }

      console.log('✅ Offline sync completed');
    } catch (error) {
      console.error('❌ Sync error:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncAction(action: OfflineAction) {
    const data = action.parsedData;

    switch (action.actionType) {
      case 'message':
        return this.syncMessage(data);
      case 'delete_message':
        return this.syncDeleteMessage(data);
      case 'reaction':
        return this.syncReaction(data);
      case 'read_status':
        return this.syncReadStatus(data);
      case 'join_group':
        return this.syncJoinGroup(data);
      case 'leave_group':
        return this.syncLeaveGroup(data);
      default:
        throw new Error(`Unknown action type: ${action.actionType}`);
    }
  }

  private async syncMessage(data: any) {
    const response = await api.post('/groups/messages', {
      groupId: data.groupId,
      message: data.message,
      replyTo: data.replyTo,
      file: data.file,
    });

    // Update the local message with server response
    if (data.tempId && messagesCollection && database) {
      const pendingMessage = await messagesCollection!
        .query(Q.where('temp_id', data.tempId))
        .fetch();

      if (pendingMessage.length > 0) {
        await database!.write(async () => {
          await pendingMessage[0].update((m: any) => {
            m.serverId = response.data.data.id;
            m.isPending = false;
            m.isSynced = true;
          });
        });
      }
    }
  }

  private async syncDeleteMessage(data: any) {
    await api.delete(`/groups/messages/${data.messageId}`);
  }

  private async syncReaction(data: any) {
    await api.post('/groups/messages/react', {
      messageId: data.messageId,
      reaction: data.reaction,
    });
  }

  private async syncReadStatus(data: any) {
    await api.post(UrlConstants.markGroupMessageAsRead(data.groupId));
  }

  private async syncJoinGroup(data: any) {
    await api.post(UrlConstants.fetchInviteGroupDetails(data.groupId), {});
  }

  private async syncLeaveGroup(data: any) {
    await api.post(UrlConstants.leaveGroup, { groupID: data.groupId });
  }

  // Get current sync status
  async getSyncStatus() {
    if (!isWatermelonAvailable || !database || !offlineActionsCollection) {
      return {
        isOnline: this.isOnline,
        isSyncing: false,
        pendingActions: 0,
        failedActions: 0,
      };
    }

    const pendingActions = await offlineActionsCollection
      .query(Q.where('is_synced', false))
      .fetchCount();

    const failedActions = await offlineActionsCollection
      .query(
        Q.where('is_synced', false),
        Q.where('retry_count', Q.gte(3))
      )
      .fetchCount();

    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingActions,
      failedActions,
    };
  }

  // Force sync (useful for manual refresh)
  forceSync() {
    if (this.isOnline) {
      this.syncPendingActions();
    }
  }

  // Clear all offline data
  async clearOfflineData() {
    if (!isWatermelonAvailable || !database || !offlineActionsCollection) return;
    
    await database.write(async () => {
      const allActions = await offlineActionsCollection!.query().fetch();
      const batch = allActions.map(action => action.prepareMarkAsDeleted());
      await database!.batch(...batch);
    });
    console.log('🗑️ Cleared all offline data');
  }

  // Cleanup old synced actions
  async cleanup() {
    if (!isWatermelonAvailable || !database || !offlineActionsCollection) return;

    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    await database.write(async () => {
      const oldActions = await offlineActionsCollection!
        .query(
          Q.where('is_synced', true),
          Q.where('created_at', Q.lt(sevenDaysAgo))
        )
        .fetch();

      const batch = oldActions.map(action => action.prepareMarkAsDeleted());
      await database!.batch(...batch);
    });

    console.log('🧹 Offline sync cleanup completed');
  }

  // Destroy the sync manager
  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

// Export singleton instance
export const watermelonOfflineSyncManager = new WatermelonOfflineSyncManager();

// Auto cleanup on app start
watermelonOfflineSyncManager.cleanup();