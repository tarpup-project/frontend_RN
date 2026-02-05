import { asyncStorageDB } from '@/database/asyncStorageDB';
import { networkManager } from './networkUtils';
import { queryClient } from './queryClient';

export interface OfflineAction {
  id: string;
  type: 'message' | 'reaction' | 'read_status' | 'join_group' | 'leave_group' | 'SEND_MESSAGE';
  payload?: any; // For SEND_MESSAGE type
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  groupId?: string;
  isSynced?: boolean;
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
      // Use AsyncStorageDB as single source of truth
      await asyncStorageDB.initialize();
      const unsyncedData = await asyncStorageDB.getOfflineActions();
      this.syncQueue = unsyncedData;
      console.log(`📦 Loaded ${this.syncQueue.length} offline actions from AsyncStorageDB`);
    } catch (error) {
      console.error('❌ Failed to load offline queue:', error);
    }
  }

  // Check if the manager is ready
  isReady(): boolean {
    return this.initialized;
  }

  // Add action to offline queue
  async addToQueue(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) {
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
    await asyncStorageDB.addOfflineAction(offlineAction);

    console.log('📝 Added offline action:', offlineAction.type);

    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncPendingActions();
    }
  }

  // Sync all pending actions
  async syncPendingActions() {
    // Refresh queue from DB first to catch any actions added by other hooks (like useSendGroupMessage)
    await this.loadOfflineQueue();

    if (this.isSyncing || !this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;
    console.log(`🔄 Syncing ${this.syncQueue.length} offline actions`);

    const actionsToSync = [...this.syncQueue];

    for (const action of actionsToSync) {
      try {
        await this.syncAction(action);

        // Mark as synced and remove
        this.removeFromQueue(action.id);
        await asyncStorageDB.markActionAsSynced(action.id);
        // We can optionally remove it immediately to keep DB clean
        await asyncStorageDB.removeOfflineAction(action.id);

        console.log('✅ Synced action:', action.type);
      } catch (error) {
        console.error('❌ Failed to sync action:', action.type, error);

        // Increment retry count logic is managed by the queue in memory for now
        // Ideally we should update DB too if we want persistent retry counts
        action.retryCount++;

        if (action.retryCount >= action.maxRetries) {
          console.log('🚫 Max retries reached for action:', action.type);
          this.removeFromQueue(action.id);
          await asyncStorageDB.removeOfflineAction(action.id);
        } else {
          // Optional: Update retry count in DB
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
      case 'SEND_MESSAGE': // Handle the type used by useSendGroupMessage
        return this.syncSendMessagePayload(action, action.payload || action.data);
      case 'reaction':
        return this.syncReaction(action.data);
      case 'read_status':
        return this.syncReadStatus(action.data);
      case 'join_group':
        return this.syncJoinGroup(action.data);
      case 'leave_group':
        return this.syncLeaveGroup(action.data);
      default:
        console.warn('Unknown action type:', action.type);
        // Don't throw to avoid blocking other items, just skip
        return;
    }
  }

  // Handler for Socket-payload based messages (from useSendGroupMessage)
  private async syncSendMessagePayload(action: OfflineAction, payload: any): Promise<void> {
    // We cannot use hooks (useSocket) here. logic must use API.
    // Map socket payload to API params
    const groupId = payload.roomID || payload.groupId;
    const message = payload.content?.message || payload.message;
    const replyTo = payload.replyingTo;
    const file = payload.file;

    if (!groupId || !message) {
      console.warn('⚠️ Invalid payload for syncSendMessagePayload:', payload);
      return; // Skip invalid
    }

    const { api } = await import('@/api/client');

    // Use REST API to send the message
    // This assumes the backend API handles the broadcast
    const response = await api.post('/groups/messages', {
      groupId,
      message,
      replyTo,
      file,
    });

    // We don't need to update query cache manually here usually, 
    // as the socket event from server will update it, 
    // OR we can update it if we want to confirm the temp ID replacement.
    // Ideally useSendGroupMessage managed the temp ID.
    // The socket event usually carries the tempID or we match by content/time.

    console.log('✅ Synced SEND_MESSAGE via API for group:', groupId);
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
  async clearOfflineData() {
    this.syncQueue = [];
    // DB specific clear - but maybe just clear offline actions key
    await asyncStorageDB.initialize();
    // Re-use logic from DB class 
    // Or just iterate remove. For now assume manual clearing isn't main path.
    console.log('🗑️ Cleared all offline data queue (memory only for now)');
  }
}

// Export singleton instance
export const offlineSyncManager = new OfflineSyncManager();