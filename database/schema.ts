import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 3, // Increment version for new fields
  tables: [
    // Groups table
    tableSchema({
      name: 'groups',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'category_id', type: 'string', isOptional: true },
        { name: 'category_name', type: 'string', isOptional: true },
        { name: 'category_icon', type: 'string', isOptional: true },
        { name: 'members_count', type: 'number' },
        { name: 'unread_count', type: 'number' },
        { name: 'score', type: 'number' },
        { name: 'last_message_at', type: 'number', isOptional: true },
        { name: 'last_message_content', type: 'string', isOptional: true },
        { name: 'last_message_sender', type: 'string', isOptional: true },
        { name: 'last_message_sender_id', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'is_synced', type: 'boolean' },
      ],
    }),

    // Messages table
    tableSchema({
      name: 'messages',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true, isOptional: true },
        { name: 'group_id', type: 'string', isIndexed: true },
        { name: 'content', type: 'string' },
        { name: 'sender_id', type: 'string' },
        { name: 'sender_name', type: 'string' },
        { name: 'sender_avatar', type: 'string', isOptional: true },
        { name: 'reply_to_id', type: 'string', isOptional: true },
        { name: 'file_url', type: 'string', isOptional: true },
        { name: 'file_type', type: 'string', isOptional: true },
        { name: 'temp_id', type: 'string', isOptional: true },
        { name: 'is_pending', type: 'boolean' },
        { name: 'is_synced', type: 'boolean' },
        { name: 'last_message_at', type: 'number', isOptional: true },
        { name: 'message_id', type: 'string', isIndexed: true },
        { name: 'deleted_at', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Prompts table
    tableSchema({
      name: 'prompts',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'category_id', type: 'string', isOptional: true },
        { name: 'category_name', type: 'string', isOptional: true },
        { name: 'user_id', type: 'string' },
        { name: 'user_name', type: 'string' },
        { name: 'user_avatar', type: 'string', isOptional: true },
        { name: 'campus_id', type: 'string', isOptional: true },
        { name: 'state_id', type: 'string', isOptional: true },
        { name: 'is_public', type: 'boolean' },
        { name: 'is_synced', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Categories table
    tableSchema({
      name: 'categories',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'icon', type: 'string', isOptional: true },
        { name: 'color', type: 'string', isOptional: true },
        { name: 'type', type: 'string' }, // 'group' or 'prompt'
        { name: 'is_synced', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Offline actions table for sync queue
    tableSchema({
      name: 'offline_actions',
      columns: [
        { name: 'action_type', type: 'string' }, // 'message', 'reaction', 'read_status', etc.
        { name: 'data', type: 'string' }, // JSON stringified data
        { name: 'retry_count', type: 'number' },
        { name: 'max_retries', type: 'number' },
        { name: 'is_synced', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // User cache table
    tableSchema({
      name: 'users',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'fname', type: 'string' },
        { name: 'lname', type: 'string', isOptional: true },
        { name: 'email', type: 'string', isOptional: true },
        { name: 'avatar', type: 'string', isOptional: true },
        { name: 'campus_id', type: 'string', isOptional: true },
        { name: 'is_synced', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});