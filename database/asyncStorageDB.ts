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

    // Ensure groups is an array
    if (!Array.isArray(groups)) {
      console.warn('⚠️ Groups cache is not an array, resetting to empty array');
      this.cache.set('db_groups', []);
      return [];
    }

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

    try {
      const messages = this.cache.get(`db_messages_${groupId}`) || [];

      // Ensure messages is an array
      if (!Array.isArray(messages)) {
        console.warn('⚠️ Messages cache is not an array for group:', groupId, 'Type:', typeof messages);
        this.cache.set(`db_messages_${groupId}`, []);
        return [];
      }

      // CRITICAL FIX: Validate message data before returning
      const validMessages = messages.filter((msg: any) => {
        return msg &&
          typeof msg.id === 'string' &&
          typeof msg.groupId === 'string' &&
          typeof msg.content === 'string' &&
          typeof msg.senderId === 'string' &&
          typeof msg.senderName === 'string' &&
          typeof msg.createdAt === 'number';
      });

      if (validMessages.length !== messages.length) {
        console.warn(`⚠️ Filtered out ${messages.length - validMessages.length} corrupted messages for group ${groupId}`);
        // Save cleaned messages back to cache
        await this.saveMessages(groupId, validMessages);
      }

      return validMessages.sort((a: any, b: any) => (a.createdAt || 0) - (b.createdAt || 0));
    } catch (error) {
      console.error('❌ Failed to get messages for group:', groupId, error);
      return []; // Return empty array instead of throwing
    }
  }

  async saveMessages(groupId: string, messages: any[]): Promise<void> {
    await this.initialize();

    try {
      // CRITICAL FIX: Validate messages before saving
      const validMessages = messages.filter((msg: any) => {
        return msg &&
          typeof msg.id === 'string' &&
          typeof msg.content === 'string' &&
          typeof msg.senderId === 'string' &&
          typeof msg.senderName === 'string';
      }).map(msg => ({
        ...msg,
        groupId: groupId, // Ensure groupId is set
        createdAt: msg.createdAt || Date.now(),
        updatedAt: msg.updatedAt || Date.now(),
      }));

      if (validMessages.length !== messages.length) {
        console.warn(`⚠️ Filtered out ${messages.length - validMessages.length} invalid messages before saving to group ${groupId}`);
      }

      const key = `db_messages_${groupId}`;
      this.cache.set(key, validMessages);
      await AsyncStorage.setItem(key, JSON.stringify(validMessages));
      console.log('💾 Saved', validMessages.length, 'messages for group', groupId);
    } catch (error) {
      console.error('❌ Failed to save messages for group:', groupId, error);
      // Don't throw - just log the error to prevent app crashes
    }
  }

  // CRITICAL: Efficiently sync new messages with existing cache
  async syncMessages(groupId: string, newMessages: any[]): Promise<void> {
    await this.initialize();

    try {
      const existingMessages = await this.getMessages(groupId);
      const existingIds = new Set(existingMessages.map(m => m.id));
      const existingServerIds = new Set(existingMessages.map(m => m.serverId).filter(Boolean));

      const messagesToAdd = newMessages.filter(msg => {
        const id = msg.id || msg.serverId;
        // Check both ID and serverId to prevent duplicates
        if (existingIds.has(id)) return false;
        if (msg.serverId && existingServerIds.has(msg.serverId)) return false;

        // Also check content duplicates for protection against ID shifts
        // (Only for very recent messages to avoid perf hit)
        if (Date.now() - (msg.createdAt || 0) < 60000) {
          const isDuplicate = existingMessages.some(m =>
            m.content === msg.content &&
            m.senderId === msg.senderId &&
            Math.abs(m.createdAt - msg.createdAt) < 2000
          );
          if (isDuplicate) return false;
        }

        return true;
      }).map(msg => ({
        ...msg,
        groupId: groupId,
        createdAt: msg.createdAt || Date.now(),
        updatedAt: Date.now(),
        isSynced: true
      }));

      if (messagesToAdd.length > 0) {
        console.log(`📥 Syncing ${messagesToAdd.length} new messages for group ${groupId}`);
        const updatedMessages = [...existingMessages, ...messagesToAdd];
        await this.saveMessages(groupId, updatedMessages);
      }
    } catch (error) {
      console.error('❌ Failed to sync messages for group:', groupId, error);
    }
  }

  async addMessage(groupId: string, message: any): Promise<void> {
    try {
      // CRITICAL FIX: Validate message before adding
      if (!message || !message.content || !message.senderId || !message.senderName) {
        console.warn('⚠️ Attempted to add invalid message:', message);
        return;
      }

      const messages = await this.getMessages(groupId);
      const newMessage = {
        ...message,
        id: message.id || `temp_${Date.now()}_${Math.random()}`,
        groupId: groupId, // Ensure groupId is set
        createdAt: message.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      // Check for duplicates
      const exists = messages.find(m => m.id === newMessage.id ||
        (m.content === newMessage.content &&
          m.senderId === newMessage.senderId &&
          Math.abs(m.createdAt - newMessage.createdAt) < 1000));

      if (exists) {
        console.log('📝 Message already exists, skipping duplicate');
        return;
      }

      messages.push(newMessage);
      await this.saveMessages(groupId, messages);

      // Update group's last message in db_groups for instant list update
      const groups = await this.getGroups();
      const groupIndex = groups.findIndex(g => g.id === groupId || g.serverId === groupId);
      
      if (groupIndex !== -1) {
        const newMessageObj = {
          content: newMessage.content,
          sender: { 
            fname: newMessage.senderName, 
            id: newMessage.senderId 
          },
          senderId: newMessage.senderId,
          senderName: newMessage.senderName,
          fileUrl: newMessage.fileUrl,
          fileType: newMessage.fileType,
          createdAt: new Date(newMessage.createdAt).toISOString()
        };

        const currentGroup = groups[groupIndex];
        const updatedGroup = {
          ...currentGroup,
          lastMessageAt: new Date(newMessage.createdAt).toISOString(),
          lastMessage: newMessageObj,
          updatedAt: new Date().toISOString(),
          // Update messages array if it exists
          messages: currentGroup.messages && Array.isArray(currentGroup.messages) 
            ? [...currentGroup.messages, newMessageObj] 
            : currentGroup.messages
        };
        
        groups[groupIndex] = updatedGroup;
        await this.saveGroups(groups);
        console.log('🔄 Updated last message for group:', groupId);
      }
    } catch (error) {
      console.error('❌ Failed to add message to group:', groupId, error);
      // Don't throw - just log the error to prevent app crashes
    }
  }

  // Get a specific message by ID across all groups (for reply resolution)
  async getMessageById(messageId: string): Promise<any | null> {
    await this.initialize();

    try {
      // First check all cached message groups
      const keys = Array.from(this.cache.keys()).filter(key => key.startsWith('db_messages_'));

      for (const key of keys) {
        const messages = this.cache.get(key) || [];
        // Ensure messages is an array before calling find
        if (Array.isArray(messages)) {
          const message = messages.find((msg: any) => msg.id === messageId || msg.serverId === messageId);
          if (message) {
            return message;
          }
        } else {
          console.warn('⚠️ Cache entry is not an array for key:', key, 'Type:', typeof messages);
        }
      }

      // If not found in cache, check AsyncStorage directly
      const allKeys = await AsyncStorage.getAllKeys();
      const messageKeys = allKeys.filter(key => key.startsWith('db_messages_'));

      for (const key of messageKeys) {
        try {
          const data = await AsyncStorage.getItem(key);
          if (data) {
            const messages = JSON.parse(data);
            const message = messages.find((msg: any) => msg.id === messageId || msg.serverId === messageId);
            if (message) {
              return message;
            }
          }
        } catch (error) {
          console.warn('Failed to parse messages from key:', key);
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Failed to get message by ID:', messageId, error);
      return null;
    }
  }

  // Prompts operations
  async getPrompts(): Promise<any[]> {
    await this.initialize();
    const prompts = this.cache.get('db_prompts') || [];

    // Ensure prompts is an array
    if (!Array.isArray(prompts)) {
      console.warn('⚠️ Prompts cache is not an array, resetting to empty array');
      this.cache.set('db_prompts', []);
      return [];
    }

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

    // Ensure actions is an array
    if (!Array.isArray(actions)) {
      console.warn('⚠️ Offline actions cache is not an array, resetting to empty array');
      this.cache.set('db_offline_actions', []);
      return [];
    }

    return actions.filter((action: any) => !action.isSynced);
  }

  async addOfflineAction(action: any): Promise<void> {
    await this.initialize();
    const actions = this.cache.get('db_offline_actions') || [];

    // Ensure actions is an array
    if (!Array.isArray(actions)) {
      console.warn('⚠️ Offline actions cache is not an array in addOfflineAction, resetting to empty array');
      this.cache.set('db_offline_actions', []);
    }

    const validActions = Array.isArray(actions) ? actions : [];

    const newAction = {
      ...action,
      id: `action_${Date.now()}_${Math.random()}`,
      createdAt: Date.now(),
      retryCount: 0,
      isSynced: false,
    };

    validActions.push(newAction);
    this.cache.set('db_offline_actions', validActions);
    await AsyncStorage.setItem('db_offline_actions', JSON.stringify(validActions));
  }

  async markActionAsSynced(actionId: string): Promise<void> {
    const actions = this.cache.get('db_offline_actions') || [];

    // Ensure actions is an array
    if (!Array.isArray(actions)) {
      console.warn('⚠️ Offline actions cache is not an array in markActionAsSynced');
      return;
    }

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

    // Ensure actions is an array
    if (!Array.isArray(actions)) {
      console.warn('⚠️ Offline actions cache is not an array in removeOfflineAction');
      return;
    }

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

  // CRITICAL FIX: Add backup mechanism for message recovery
  async createMessageBackup(groupId: string): Promise<void> {
    try {
      const messages = await this.getMessages(groupId);
      if (messages.length > 0) {
        const backupKey = `db_messages_backup_${groupId}`;
        this.cache.set(backupKey, {
          messages,
          timestamp: Date.now(),
          count: messages.length
        });
        await AsyncStorage.setItem(backupKey, JSON.stringify({
          messages,
          timestamp: Date.now(),
          count: messages.length
        }));
        console.log('💾 Created backup of', messages.length, 'messages for group', groupId);
      }
    } catch (error) {
      console.error('❌ Failed to create message backup:', error);
    }
  }

  async restoreMessageBackup(groupId: string): Promise<any[]> {
    try {
      const backupKey = `db_messages_backup_${groupId}`;
      const backup = this.cache.get(backupKey);

      if (backup && backup.messages && Array.isArray(backup.messages) && backup.messages.length > 0) {
        console.log('🔄 Restoring', backup.messages.length, 'messages from backup for group', groupId);
        await this.saveMessages(groupId, backup.messages);
        return backup.messages;
      }

      return [];
    } catch (error) {
      console.error('❌ Failed to restore message backup:', error);
      return [];
    }
  }
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

    // Ensure actions is an array
    if (!Array.isArray(actions)) {
      console.warn('⚠️ Offline actions cache is not an array in cleanup, resetting to empty array');
      this.cache.set('db_offline_actions', []);
      await AsyncStorage.setItem('db_offline_actions', JSON.stringify([]));
      return;
    }

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