import { Database, Q } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { asyncStorageDB } from './asyncStorageDB';
import { Category, Group, Message, OfflineAction, Prompt, User } from './models';
import { schema } from './schema';

let database: Database | null = null;
export let isWatermelonAvailable = false;

// Try to initialize WatermelonDB, fallback to AsyncStorage if not available
try {
  // Create the SQLite adapter
  const adapter = new SQLiteAdapter({
    schema,
    // Disable JSI for Expo managed workflow compatibility
    jsi: false,
    onSetUpError: (error) => {
      console.error('❌ SQLite setup error:', error);
      throw error;
    },
  });

  // Create the database
  database = new Database({
    adapter,
    modelClasses: [
      Group,
      Message,
      Prompt,
      Category,
      OfflineAction,
      User,
    ],
  });

  isWatermelonAvailable = true;
  console.log('✅ WatermelonDB initialized');
} catch (error) {
  console.warn('⚠️ WatermelonDB not available, using AsyncStorage fallback:', error);
  isWatermelonAvailable = false;
  // Initialize AsyncStorage fallback
  asyncStorageDB.initialize();
}


// Export collections for easy access (only if WatermelonDB is available)
export const groupsCollection = database?.get<Group>('groups');
export const messagesCollection = database?.get<Message>('messages');
export const promptsCollection = database?.get<Prompt>('prompts');
export const categoriesCollection = database?.get<Category>('categories');
export const offlineActionsCollection = database?.get<OfflineAction>('offline_actions');
export const usersCollection = database?.get<User>('users');

// Database utilities that work with both WatermelonDB and AsyncStorage
export class DatabaseUtils {
  // Clear all data (useful for logout)
  static async clearAll(): Promise<void> {
    if (isWatermelonAvailable && database) {
      await database.write(async () => {
        await database!.unsafeResetDatabase();
      });
      console.log('🗑️ WatermelonDB cleared');
    } else {
      await asyncStorageDB.clearAll();
    }
  }

  // Get database statistics
  static async getStats() {
    if (isWatermelonAvailable && database) {
      const [
        groupsCount,
        messagesCount,
        promptsCount,
        categoriesCount,
        offlineActionsCount,
        usersCount,
      ] = await Promise.all([
        groupsCollection!.query().fetchCount(),
        messagesCollection!.query().fetchCount(),
        promptsCollection!.query().fetchCount(),
        categoriesCollection!.query().fetchCount(),
        offlineActionsCollection!.query().fetchCount(),
        usersCollection!.query().fetchCount(),
      ]);

      return {
        groups: groupsCount,
        messages: messagesCount,
        prompts: promptsCount,
        categories: categoriesCount,
        offlineActions: offlineActionsCount,
        users: usersCount,
        total: groupsCount + messagesCount + promptsCount + categoriesCount + offlineActionsCount + usersCount,
      };
    } else {
      return await asyncStorageDB.getStats();
    }
  }

  // Get unsynced data count
  static async getUnsyncedCount() {
    if (isWatermelonAvailable && database) {
      const [
        unsyncedGroups,
        unsyncedMessages,
        unsyncedPrompts,
        unsyncedCategories,
        unsyncedActions,
        unsyncedUsers,
      ] = await Promise.all([
        groupsCollection!.query(Q.where('is_synced', false)).fetchCount(),
        messagesCollection!.query(Q.where('is_synced', false)).fetchCount(),
        promptsCollection!.query(Q.where('is_synced', false)).fetchCount(),
        categoriesCollection!.query(Q.where('is_synced', false)).fetchCount(),
        offlineActionsCollection!.query(Q.where('is_synced', false)).fetchCount(),
        usersCollection!.query(Q.where('is_synced', false)).fetchCount(),
      ]);

      return {
        groups: unsyncedGroups,
        messages: unsyncedMessages,
        prompts: unsyncedPrompts,
        categories: unsyncedCategories,
        actions: unsyncedActions,
        users: unsyncedUsers,
        total: unsyncedGroups + unsyncedMessages + unsyncedPrompts + unsyncedCategories + unsyncedActions + unsyncedUsers,
      };
    } else {
      return await asyncStorageDB.getUnsyncedCount();
    }
  }

  // Cleanup old data
  static async cleanup(): Promise<void> {
    if (isWatermelonAvailable && database) {
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      
      await database.write(async () => {
        // Delete old synced offline actions
        const oldActions = await offlineActionsCollection!
          .query(
            Q.where('is_synced', true),
            Q.where('created_at', Q.lt(thirtyDaysAgo))
          )
          .fetch();

        const batch = oldActions.map((action: OfflineAction) => action.prepareMarkAsDeleted());
        await database!.batch(...batch);
      });

      console.log('🧹 WatermelonDB cleanup completed');
    } else {
      await asyncStorageDB.cleanup();
    }
  }

  // Check if WatermelonDB is available
  static isWatermelonAvailable(): boolean {
    return isWatermelonAvailable;
  }

  // Get the appropriate database instance
  static getDatabase() {
    return isWatermelonAvailable ? database : asyncStorageDB;
  }
}

// Export the database instance (may be null if using AsyncStorage fallback)
export { asyncStorageDB, database };

console.log('✅ Database system initialized with', isWatermelonAvailable ? 'WatermelonDB' : 'AsyncStorage fallback');