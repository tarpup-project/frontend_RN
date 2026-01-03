import { Model } from '@nozbe/watermelondb';
import { date, field, readonly } from '@nozbe/watermelondb/decorators';

export default class Prompt extends Model {
  static table = 'prompts';

  @field('server_id') serverId!: string;
  @field('title') title!: string;
  @field('description') description?: string;
  @field('category_id') categoryId?: string;
  @field('category_name') categoryName?: string;
  @field('user_id') userId!: string;
  @field('user_name') userName!: string;
  @field('user_avatar') userAvatar?: string;
  @field('campus_id') campusId?: string;
  @field('state_id') stateId?: string;
  @field('is_public') isPublic!: boolean;
  @field('is_synced') isSynced!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // Helper methods
  get timeAgo(): string {
    const now = Date.now();
    const diff = now - this.createdAt.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }

  // Transform to UI format
  toUIFormat() {
    return {
      id: this.id,
      serverId: this.serverId,
      title: this.title,
      description: this.description,
      category: {
        id: this.categoryId,
        name: this.categoryName,
      },
      user: {
        id: this.userId,
        name: this.userName,
        avatar: this.userAvatar,
      },
      campusId: this.campusId,
      stateId: this.stateId,
      isPublic: this.isPublic,
      createdAt: this.createdAt.toISOString(),
      timeAgo: this.timeAgo,
    };
  }
}