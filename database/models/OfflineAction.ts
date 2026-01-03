import { Model } from '@nozbe/watermelondb';
import { date, field, readonly } from '@nozbe/watermelondb/decorators';

export default class OfflineAction extends Model {
  static table = 'offline_actions';

  @field('action_type') actionType!: string;
  @field('data') data!: string; // JSON stringified
  @field('retry_count') retryCount!: number;
  @field('max_retries') maxRetries!: number;
  @field('is_synced') isSynced!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // Helper methods
  get parsedData(): any {
    try {
      return JSON.parse(this.data);
    } catch (error) {
      console.error('Failed to parse offline action data:', error);
      return {};
    }
  }

  get canRetry(): boolean {
    return this.retryCount < this.maxRetries;
  }

  get isExpired(): boolean {
    // Consider actions older than 7 days as expired
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    return this.createdAt.getTime() < sevenDaysAgo;
  }
}