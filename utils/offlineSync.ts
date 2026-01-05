import { queryClient } from './queryClient';
import { StorageUtils } from './storage';
import { networkManager } from './networkUtils';

export interface OfflineAction {
  id: string;
  type: 'message' | 'reaction' | 'read_status' | 'join_group' | 'leave_group';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

class OfflineSyncManager {
  private isOnline = true;
  private syncQueue: OfflineAction[] = [];
  private isSyncing = false;
  private maxRetries = 3;
  private initialized = false;

  constructor() {
    // Don't initialize immediately to avoid import issues
    this.initializeWhenReady();
  }

  private async initializeWhenReady() {
    try {
      // Wait a bit to ensure all modules are loaded
      setTimeout(async () => {
        await this.initialize();
      }, 1000);
    } catch (error) {
      console.warn('⚠️ Failed to initialize offline sync manager:', error);
    }
  }

  private async initialize() {
    if (this.initialized) return;
    
    try {
      await this.initializeNetworkListener();
      await this.loadOfflineQueue();
      this.initialized = true;
      console.log('✅ Offline sync manager initialized');
    } catch (error) {
      console.warn('⚠️ Offline sync initialization failed:', error);
    }
  }

  private async initializeNetworkListener() {
    try {
      if (!networkManager) {
         console.warn('⚠️ networkManager is undefined, skipping network listener');
         this.isOnline = true;
         return;
      }

      // Initialize network manager
      await networkManager.initialize();
      
      // Set initial state
      this.isOnline = networkManager.getNetworkState();
      
      // Add listener for network changes
      networkManager.addListener((isOnline) => {
        const wasOffline = !this.isOnline;
        this.isOnline = isOnline;
        
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

  private async loadOfflineQueue() {
    try {
      const unsyncedData = await StorageUtils.getUnsyncedOfflineData();
      this.syncQueue = unsyncedData.map(item => item.data.value);
      console.log(`📦 Loaded ${this.syncQueue.length} offline actions`);
    } catch (error) {
      console.error('❌ Failed to load offline queue:', error);
    }
  }

  // Check if the manager is ready
  isReady(): boolean {
    return this.initialized;
  }

  // Add action to offline queue
  addToQueue(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) {
    if (!this.initialized) {
      console.warn('⚠️ Offline sync manager not ready, action will be lost');
      return;
    }

    const offlineAction: OfflineAction = {
      ...action,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: action.maxRetries || this.maxRetries,
    };

    this.syncQueue.push(offlineAction);
    StorageUtils.setOffline(`action_${offlineAction.id}`, offlineAction);
    
    console.log('📝 Added offline action:', offlineAction.type);

    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncPendingActions();
    }
  }

  // Sync all pending actions
  async syncPendingActions() {
    if (this.isSyncing || !this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;
    console.log(`🔄 Syncing ${this.syncQueue.length} offline actions`);

    const actionsToSync = [...this.syncQueue];
    
    for (const action of actionsToSync) {
      try {
        await this.syncAction(action);
        
        // Remove from queue and mark as synced
        this.removeFromQueue(action.id);
        StorageUtils.markAsSynced(`action_${action.id}`);
        
        console.log('✅ Synced action:', action.type);
      } catch (error) {
        console.error('❌ Failed to sync action:', action.type, error);
        
        // Increment retry count
        action.retryCount++;
        
        if (action.retryCount >= action.maxRetries) {
          console.log('🚫 Max retries reached for action:', action.type);
          this.removeFromQueue(action.id);
          StorageUtils.remove(`action_${action.id}`);
        } else {
          // Update the action in storage with new retry count
          StorageUtils.setOffline(`action_${action.id}`, action);
        }
      }
    }

    this.isSyncing = false;
    console.log('✅ Offline sync completed');
  }

  private async syncAction(action: OfflineAction): Promise<void> {
    switch (action.type) {
      case 'message':
        return this.syncMessage(action.data);
      case 'reaction':
        return this.syncReaction(action.data);
      case 'read_status':
        return this.syncReadStatus(action.data);
      case 'join_group':
        return this.syncJoinGroup(action.data);
      case 'leave_group':
        return this.syncLeaveGroup(action.data);
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private async syncMessage(data: any): Promise<void> {
    // Import the API client dynamically to avoid circular dependencies
    const { api } = await import('@/api/client');
    
    // Send the message to the server
    const response = await api.post('/groups/messages', {
      groupId: data.groupId,
      message: data.message,
      replyTo: data.replyTo,
      file: data.file,
    });

    // Update the local cache with the server response
    queryClient.setQueryData(['messages', data.groupId], (oldData: any) => {
      if (!oldData) return oldData;
      
      // Replace the temporary message with the server response
      return oldData.map((msg: any) => 
        msg.tempId === data.tempId ? response.data.data : msg
      );
    });
  }

  private async syncReaction(data: any): Promise<void> {
    const { api } = await import('@/api/client');
    
    await api.post('/groups/messages/react', {
      messageId: data.messageId,
      reaction: data.reaction,
    });
  }

  private async syncReadStatus(data: any): Promise<void> {
    const { api } = await import('@/api/client');
    const { UrlConstants } = await import('@/constants/apiUrls');
    
    await api.post(UrlConstants.markGroupMessageAsRead(data.groupId));
  }

  private async syncJoinGroup(data: any): Promise<void> {
    const { api } = await import('@/api/client');
    const { UrlConstants } = await import('@/constants/apiUrls');
    
    await api.post(UrlConstants.fetchInviteGroupDetails(data.groupId), {});
  }

  private async syncLeaveGroup(data: any): Promise<void> {
    const { api } = await import('@/api/client');
    const { UrlConstants } = await import('@/constants/apiUrls');
    
    await api.post(UrlConstants.leaveGroup, { groupID: data.groupId });
  }

  private removeFromQueue(actionId: string) {
    this.syncQueue = this.syncQueue.filter(action => action.id !== actionId);
  }

  // Get current sync status
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingActions: this.syncQueue.length,
      queuedActions: this.syncQueue.map(action => ({
        type: action.type,
        timestamp: action.timestamp,
        retryCount: action.retryCount,
      })),
    };
  }

  // Force sync (useful for manual refresh)
  forcSync() {
    if (this.isOnline) {
      this.syncPendingActions();
    }
  }

  // Clear all offline data
  clearOfflineData() {
    this.syncQueue = [];
    StorageUtils.clearOffline();
    console.log('🗑️ Cleared all offline data');
  }
}

// Export singleton instance
export const offlineSyncManager = new OfflineSyncManager();