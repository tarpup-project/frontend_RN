/**
 * Utility functions for managing unread message counts
 */

export interface UnreadCounterOptions {
  userId: string;
  activeGroupId?: string | null;
  isUserMessage: boolean;
  senderId: string;
  groupId: string;
}

/**
 * Determines if a message should increment the unread counter
 * 
 * Rules:
 * 1. Only count user messages (not system alerts)
 * 2. Don't count messages from the current user
 * 3. Don't count messages when user is actively in the group chat
 * 4. Only count "unseen" messages (when user is not in the group)
 */
export const shouldIncrementUnread = (options: UnreadCounterOptions): boolean => {
  const { userId, activeGroupId, isUserMessage, senderId, groupId } = options;

  // Rule 1: Only count user messages (not system alerts)
  if (!isUserMessage) {
    return false;
  }

  // Rule 2: Don't count messages from the current user
  if (senderId === userId) {
    return false;
  }

  // Rule 3: Don't count messages when user is actively in the group chat
  const isActiveGroup = String(activeGroupId || '') === String(groupId);
  if (isActiveGroup) {
    return false;
  }

  // Rule 4: This is an unseen message - increment counter
  return true;
};

/**
 * Logs unread counter decisions for debugging
 */
export const logUnreadDecision = (
  options: UnreadCounterOptions, 
  shouldIncrement: boolean, 
  senderName?: string
): void => {
  const { userId, activeGroupId, isUserMessage, senderId, groupId } = options;
  
  if (shouldIncrement) {
    console.log(`📬 UNREAD: Message from ${senderName || senderId} in group ${groupId} (user not in group)`);
  } else {
    const reason = !isUserMessage 
      ? 'system message'
      : senderId === userId 
        ? 'own message'
        : String(activeGroupId || '') === String(groupId)
          ? 'user in group'
          : 'unknown';
    
    console.log(`👁️ SEEN: Message from ${senderName || senderId} in group ${groupId} (${reason})`);
  }
};

/**
 * Resets unread count for a specific group
 */
export const resetUnreadCount = (groupId: string, currentCount: number = 0): void => {
  if (currentCount > 0) {
    console.log(`📬 RESET: Group ${groupId} unread count: ${currentCount} → 0`);
  }
};