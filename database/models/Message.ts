import { Model } from '@nozbe/watermelondb';
import { date, field, readonly, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export default class Message extends Model {
  static table = 'messages';
  static associations: Associations = {
    group: { type: 'belongs_to', key: 'group_id' },
  };

  @field('server_id') serverId?: string;
  @field('group_id') groupId!: string;
  @field('content') content!: string;
  @field('sender_id') senderId!: string;
  @field('sender_name') senderName!: string;
  @field('sender_avatar') senderAvatar?: string;
  @field('reply_to_id') replyToId?: string;
  @field('file_url') fileUrl?: string;
  @field('file_type') fileType?: string;
  @field('temp_id') tempId?: string;
  @field('is_pending') isPending!: boolean;
  @field('is_synced') isSynced!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @relation('groups', 'group_id') group: any;

  // Helper methods
  get isFromCurrentUser(): boolean {
    // This would be determined by comparing with current user ID
    // For now, we'll use a placeholder
    return false;
  }

  get hasFile(): boolean {
    return !!this.fileUrl;
  }

  get isReply(): boolean {
    return !!this.replyToId;
  }

  get timeAgo(): string {
    const now = Date.now();
    const diff = now - this.createdAt.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return 'now';
  }

  // Transform to UI format
  toUIFormat() {
    return {
      id: this.id,
      serverId: this.serverId,
      content: this.content,
      sender: {
        id: this.senderId,
        fname: this.senderName,
        avatar: this.senderAvatar,
      },
      replyTo: this.replyToId,
      file: this.fileUrl ? {
        url: this.fileUrl,
        type: this.fileType,
      } : null,
      tempId: this.tempId,
      isPending: this.isPending,
      createdAt: this.createdAt.toISOString(),
      timeAgo: this.timeAgo,
    };
  }
}