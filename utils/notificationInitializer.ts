/**
 * Notification storage utilities - All API calls disabled
 * This file previously handled notification initialization but has been cleared
 */

/**
 * Initialize SecureStore - No longer performs any operations
 * All notification fetching has been disabled
 */
export const initializeNotificationStorage = async () => {
  try {
    console.log('🔄 Notification storage initialization disabled');
    console.log('✅ No notification storage to initialize');
  } catch (error) {
    console.error('❌ Failed to initialize notification storage:', error);
  }
};

/**
 * Clear all notification storage (for testing)
 */
export const clearNotificationStorage = async () => {
  try {
    console.log('🧹 No notification storage to clear - all disabled');
    console.log('✅ No storage to clear');
  } catch (error) {
    console.error('❌ Failed to clear notification storage:', error);
  }
};