import { Model } from '@nozbe/watermelondb';
import { date, field, readonly } from '@nozbe/watermelondb/decorators';

export default class User extends Model {
  static table = 'users';

  @field('server_id') serverId!: string;
  @field('fname') fname!: string;
  @field('lname') lname?: string;
  @field('email') email?: string;
  @field('avatar') avatar?: string;
  @field('campus_id') campusId?: string;
  @field('is_synced') isSynced!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // Helper methods
  get fullName(): string {
    return this.lname ? `${this.fname} ${this.lname}` : this.fname;
  }

  get initials(): string {
    const firstInitial = this.fname.charAt(0).toUpperCase();
    const lastInitial = this.lname ? this.lname.charAt(0).toUpperCase() : '';
    return firstInitial + lastInitial;
  }

  // Transform to UI format
  toUIFormat() {
    return {
      id: this.id,
      serverId: this.serverId,
      fname: this.fname,
      lname: this.lname,
      fullName: this.fullName,
      email: this.email,
      avatar: this.avatar,
      campusId: this.campusId,
      initials: this.initials,
    };
  }
}