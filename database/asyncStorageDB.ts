import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorage-based database implementation as fallback for Expo managed workflow
export class AsyncStorageDB {
  private static instance: AsyncStorageDB;
  private cache: Map<string, any> = new Map();
  private isInitialized = false;

  static getInstance(): AsyncStorageDB {
    if (!AsyncStorageDB.instance) {
      AsyncStorageDB.instance = new AsyncStorageDB();
    }
    return AsyncStorageDB.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Load all data into memory cache for better performance
      const keys = await AsyncStorage.getAllKeys();
      const dbKeys = keys.filter(key => key.startsWith('db_'));
      
      if (dbKeys.length > 0) {
        const values = await AsyncStorage.multiGet(dbKeys);
        values.forEach(([key, value]) => {
          if (value) {
            try {
              this.cache.set(key, JSON.parse(value));
            } catch (error) {
              console.warn('Failed to parse cached data for key:', key);
            }
          }
        });
      }
      
      this.isInitialized = true;
      console.log('✅ AsyncStorageDB initialized with', this.cache.size, 'cached items');
    } catch (error) {
      console.error('❌ Failed to initialize AsyncStorageDB:', error);
      this.isInitialized = true; // Still mark as initialized to prevent hanging
    }
  }

  // Groups operations
  async getGroups(): Promise<any[]> {
    await this.initialize();
    const groups = this.cache.get('db_groups') || [];
    return groups.sort((a: any, b: any) => {
      // Sort by last message time, then by created time
      const aTime = a.lastMessageAt || a.createdAt || 0;
      const bTime = b.lastMessageAt || b.createdAt || 0;
      return bTime - aTime;
    });
  }

  async saveGroups(groups: any[]): Promise<void> {
    await this.initialize();
    this.cache.set('db_groups', groups);
    await AsyncStorage.setItem('db_groups', JSON.stringify(groups));
    console.log('💾 Saved', groups.length, 'groups to AsyncStorageDB');
  }

  async updateGroup(groupId: string, updates: Partial<any>): Promise<void> {
    const groups = await this.getGroups();
    const index = groups.findIndex(g => g.id === groupId || g.serverId === groupId);
    
    if (index !== -1) {
      groups[index] = { ...groups[index], ...updates, updatedAt: Date.now() };
      await this.saveGroups(groups);
    }
  }

  // Messages operations
  async getMessages(groupId: string): Promise<any[]> {
    await this.initialize();
    const messages = this.cache.get(`db_messages_${groupId}`) || [];
    return messages.sort((a: any, b: any) => (a.createdAt || 0) - (b.createdAt || 0));
  }

  async saveMessages(groupId: string, messages: any[]): Promise<void> {
    await this.initialize();
    const key = `db_messages_${groupId}`;
    this.cache.set(key, messages);
    await AsyncStorage.setItem(key, JSON.stringify(messages));
    console.log('💾 Saved', messages.length, 'messages for group', groupId);
  }

  async addMessage(groupId: string, message: any): Promise<void> {
    const messages = await this.getMessages(groupId);
    const newMessage = {
      ...message,
      id: message.id || `temp_${Date.now()}_${Math.random()}`,
      createdAt: message.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    
    messages.push(newMessage);
    await this.saveMessages(groupId, messages);
  }

  // Prompts operations
  async getPrompts(): Promise<any[]> {
    await this.initialize();
    const prompts = this.cache.get('db_prompts') || [];
    return prompts.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
  }

  async savePrompts(prompts: any[]): Promise<void> {
    await this.initialize();
    this.cache.set('db_prompts', prompts);
    await AsyncStorage.setItem('db_prompts', JSON.stringify(prompts));
    console.log('💾 Saved', prompts.length, 'prompts to AsyncStorageDB');
  }

  // Offline actions operations
  async getOfflineActions(): Promise<any[]> {
    await this.initialize();
    const actions = this.cache.get('db_offline_actions') || [];
    return actions.filter((action: any) => !action.isSynced);
  }

  async addOfflineAction(action: any): Promise<void> {
    await this.initialize();
    const actions = this.cache.get('db_offline_actions') || [];
    const newAction = {
      ...action,
      id: `action_${Date.now()}_${Math.random()}`,
      createdAt: Date.now(),
      retryCount: 0,
      isSynced: false,
    };
    
    actions.push(newAction);
    this.cache.set('db_offline_actions', actions);
    await AsyncStorage.setItem('db_offline_actions', JSON.stringify(actions));
  }

  async markActionAsSynced(actionId: string): Promise<void> {
    const actions = this.cache.get('db_offline_actions') || [];
    const index = actions.findIndex((a: any) => a.id === actionId);
    
    if (index !== -1) {
      actions[index].isSynced = true;
      actions[index].syncedAt = Date.now();
      this.cache.set('db_offline_actions', actions);
      await AsyncStorage.setItem('db_offline_actions', JSON.stringify(actions));
    }
  }

  async removeOfflineAction(actionId: string): Promise<void> {
    const actions = this.cache.get('db_offline_actions') || [];
    const filtered = actions.filter((a: any) => a.id !== actionId);
    this.cache.set('db_offline_actions', filtered);
    await AsyncStorage.setItem('db_offline_actions', JSON.stringify(filtered));
  }

  // Statistics
  async getStats() {
    await this.initialize();
    const groups = await this.getGroups();
    const prompts = await this.getPrompts();
    const actions = this.cache.get('db_offline_actions') || [];
    
    let totalMessages = 0;
    for (const group of groups) {
      const messages = await this.getMessages(group.id || group.serverId);
      totalMessages += messages.length;
    }

    return {
      groups: groups.length,
      messages: totalMessages,
      prompts: prompts.length,
      offlineActions: actions.length,
      total: groups.length + totalMessages + prompts.length + actions.length,
    };
  }

  async getUnsyncedCount() {
    await this.initialize();
    const groups = await this.getGroups();
    const prompts = await this.getPrompts();
    const actions = await this.getOfflineActions();
    
    const unsyncedGroups = groups.filter(g => !g.isSynced).length;
    const unsyncedPrompts = prompts.filter(p => !p.isSynced).length;
    
    let unsyncedMessages = 0;
    for (const group of groups) {
      const messages = await this.getMessages(group.id || group.serverId);
      unsyncedMessages += messages.filter(m => !m.isSynced).length;
    }

    return {
      groups: unsyncedGroups,
      messages: unsyncedMessages,
      prompts: unsyncedPrompts,
      actions: actions.length,
      total: unsyncedGroups + unsyncedMessages + unsyncedPrompts + actions.length,
    };
  }

  // Clear all data
  async clearAll(): Promise<void> {
    await this.initialize();
    
    // Get all database keys
    const keys = await AsyncStorage.getAllKeys();
    const dbKeys = keys.filter(key => key.startsWith('db_'));
    
    // Remove from AsyncStorage
    if (dbKeys.length > 0) {
      await AsyncStorage.multiRemove(dbKeys);
    }
    
    // Clear cache
    this.cache.clear();
    
    console.log('🗑️ Cleared all AsyncStorageDB data');
  }

  // Cleanup old data
  async cleanup(): Promise<void> {
    await this.initialize();
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    // Clean up old synced offline actions
    const actions = this.cache.get('db_offline_actions') || [];
    const filteredActions = actions.filter((action: any) => {
      return !action.isSynced || (action.syncedAt && action.syncedAt > thirtyDaysAgo);
    });
    
    if (filteredActions.length !== actions.length) {
      this.cache.set('db_offline_actions', filteredActions);
      await AsyncStorage.setItem('db_offline_actions', JSON.stringify(filteredActions));
      console.log('🧹 Cleaned up', actions.length - filteredActions.length, 'old offline actions');
    }
  }
}

// Export singleton instance
export const asyncStorageDB = AsyncStorageDB.getInstance();