import { Model } from '@nozbe/watermelondb';
import { children, date, field, readonly } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export default class Group extends Model {
  static table = 'groups';
  static associations: Associations = {
    messages: { type: 'has_many', foreignKey: 'group_id' },
  };

  @field('server_id') serverId!: string;
  @field('name') name!: string;
  @field('description') description?: string;
  @field('category_id') categoryId?: string;
  @field('category_name') categoryName?: string;
  @field('category_icon') categoryIcon?: string;
  @field('members_count') membersCount!: number;
  @field('unread_count') unreadCount!: number;
  @field('score') score!: number;
  @field('last_message_at') lastMessageAt?: number;
  @field('last_message_content') lastMessageContent?: string;
  @field('last_message_sender') lastMessageSender?: string;
  @field('last_message_sender_id') lastMessageSenderId?: string;
  @field('is_synced') isSynced!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @children('messages') messages: any;

  // Helper methods
  get isUnread(): boolean {
    return this.unreadCount > 0;
  }

  get lastMessageDate(): Date | null {
    return this.lastMessageAt ? new Date(this.lastMessageAt) : null;
  }

  get categoryIconName(): string {
    const iconMap: Record<string, string> = {
      'gift': 'gift-outline',
      'car': 'car-outline', 
      'book': 'book-outline',
      'home': 'home-outline',
      'basketball': 'basketball-outline',
      'calendar': 'calendar-outline',
      'musical-notes': 'musical-notes-outline',
      'heart': 'heart-outline',
      'cart': 'cart-outline',
    };
    
    return iconMap[this.categoryIcon || ''] || 'pricetag-outline';
  }

  // Transform to UI format
  toUIFormat() {
    const serverCreatedAt = this.createdAt?.toISOString?.() || new Date().toISOString();
    const serverUpdatedAt = this.updatedAt?.toISOString?.() || serverCreatedAt;
    const serverLastMessageAt = this.lastMessageAt
      ? new Date(this.lastMessageAt).toISOString()
      : undefined;

    return {
      serverId: this.serverId,
      id: this.serverId,
      category: this.categoryName || 'General',
      title: this.name,
      description: this.description,
      members: this.membersCount,
      unreadCount: this.unreadCount,
      matchPercentage: `${this.score}%`,
      activeTime: this.lastMessageAt 
        ? `Active ${this.getTimeAgo(this.lastMessageAt)}`
        : `Created ${this.getTimeAgo(this.createdAt.getTime())}`,
      categoryIcon: this.categoryIconName,
      rawGroup: {
        id: this.serverId,
        name: this.name,
        description: this.description || '',
        score: this.score,
        unread: this.unreadCount,
        isComplete: false,
        isJoined: true,
        isAdmin: false,
        createdAt: serverCreatedAt,
        updatedAt: serverUpdatedAt,
        lastMessageAt: serverLastMessageAt,
        members: [],
        category: this.categoryId
          ? [
              {
                id: this.categoryId,
                name: this.categoryName || 'General',
                icon: this.categoryIcon || '',
                bgColorHex: '#2563EB',
              },
            ]
          : [],
        // Include last message data for UI
        lastMessage: this.lastMessageContent ? {
          content: this.lastMessageContent,
          sender: {
            fname: this.lastMessageSender,
            id: this.lastMessageSenderId,
          },
          senderId: this.lastMessageSenderId,
          senderName: this.lastMessageSender,
        } : null,
      },
    };
  }

  private getTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }
}
