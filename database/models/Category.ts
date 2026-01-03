import { Model } from '@nozbe/watermelondb';
import { date, field, readonly } from '@nozbe/watermelondb/decorators';

export default class Category extends Model {
  static table = 'categories';

  @field('server_id') serverId!: string;
  @field('name') name!: string;
  @field('icon') icon?: string;
  @field('color') color?: string;
  @field('type') type!: string; // 'group' or 'prompt'
  @field('is_synced') isSynced!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // Transform to UI format
  toUIFormat() {
    return {
      id: this.id,
      serverId: this.serverId,
      name: this.name,
      icon: this.icon,
      color: this.color,
      type: this.type,
    };
  }
}