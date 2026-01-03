import { api } from '@/api/client';
import { UrlConstants } from '@/constants/apiUrls';
import { database, groupsCollection, messagesCollection } from '@/database';
import Group from '@/database/models/Group';
import { useAuthStore } from '@/state/authStore';
import { Q } from '@nozbe/watermelondb';
import { useEffect, useState } from 'react';
import { useCampus } from './useCampus';

export const useWatermelonGroups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { selectedUniversity } = useCampus();
  const { isAuthenticated, isHydrated } = useAuthStore();

  // Subscribe to database changes
  useEffect(() => {
    if (!isAuthenticated || !isHydrated || !groupsCollection) return;

    const subscription = groupsCollection
      .query(
        Q.sortBy('last_message_at', Q.desc),
        Q.sortBy('created_at', Q.desc)
      )
      .observe()
      .subscribe(setGroups);

    // Load initial data
    loadGroups();

    return () => subscription.unsubscribe();
  }, [isAuthenticated, isHydrated, selectedUniversity?.id]);

  const loadGroups = async () => {
    if (!groupsCollection) return;

    try {
      setIsLoading(true);
      setError(null);

      // First, load from database (instant)
      const cachedGroups = await groupsCollection
        .query(
          Q.sortBy('last_message_at', Q.desc),
          Q.sortBy('created_at', Q.desc)
        )
        .fetch();

      if (cachedGroups.length > 0) {
        console.log('⚡ Using cached groups data -', cachedGroups.length, 'groups loaded from WatermelonDB');
        setGroups(cachedGroups);
        setIsLoading(false);
      }

      // Then fetch fresh data from server
      await fetchFromServer();
    } catch (err: any) {
      console.error('❌ Load groups error:', err);
      
      // If we have cached data, show it with the error
      const cachedGroups = await groupsCollection
        .query(
          Q.sortBy('last_message_at', Q.desc),
          Q.sortBy('created_at', Q.desc)
        )
        .fetch();
        
      if (cachedGroups.length > 0) {
        console.log('⚡ Network failed, using cached groups data -', cachedGroups.length, 'groups');
        setGroups(cachedGroups);
        setError('Using cached data - network unavailable');
      } else {
        setError(err.message || 'Failed to load groups');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFromServer = async () => {
    if (!database || !groupsCollection) return;

    try {
      console.log('🔄 Fetching groups from server...');
      
      const response = await api.get(
        UrlConstants.fetchAllGroups(selectedUniversity?.id)
      );

      if (!response.data?.data) {
        console.warn('⚠️ Invalid response structure:', response.data);
        return;
      }

      const serverGroups = response.data.data;
      console.log('✅ Fetched', serverGroups.length, 'groups from server');

      // Update database
      await database.write(async () => {
        const batch: any[] = [];

        for (const serverGroup of serverGroups) {
          // Check if group exists
          const existingGroup = await groupsCollection!
            .query(Q.where('server_id', serverGroup.id))
            .fetch();

          if (existingGroup.length > 0) {
            // Update existing group
            const group = existingGroup[0];
            batch.push(
              group.prepareUpdate((g: Group) => {
                g.name = serverGroup.name;
                g.description = serverGroup.description || '';
                g.categoryId = serverGroup.category?.[0]?.id;
                g.categoryName = serverGroup.category?.[0]?.name;
                g.categoryIcon = serverGroup.category?.[0]?.icon;
                g.membersCount = serverGroup.members?.length || 0;
                g.unreadCount = serverGroup.unread || 0;
                g.score = serverGroup.score || 0;
                g.lastMessageAt = serverGroup.lastMessageAt 
                  ? new Date(serverGroup.lastMessageAt).getTime()
                  : undefined;
                
                // Update last message info
                if (serverGroup.messages && serverGroup.messages.length > 0) {
                  const lastMessage = serverGroup.messages[serverGroup.messages.length - 1];
                  g.lastMessageContent = lastMessage.content || lastMessage.message;
                  g.lastMessageSender = lastMessage.sender?.fname || lastMessage.senderName;
                  g.lastMessageSenderId = lastMessage.sender?.id || lastMessage.senderId;
                }
                
                g.isSynced = true;
              })
            );
          } else {
            // Create new group
            batch.push(
              groupsCollection!.prepareCreate((g: Group) => {
                g.serverId = serverGroup.id;
                g.name = serverGroup.name;
                g.description = serverGroup.description || '';
                g.categoryId = serverGroup.category?.[0]?.id;
                g.categoryName = serverGroup.category?.[0]?.name;
                g.categoryIcon = serverGroup.category?.[0]?.icon;
                g.membersCount = serverGroup.members?.length || 0;
                g.unreadCount = serverGroup.unread || 0;
                g.score = serverGroup.score || 0;
                g.lastMessageAt = serverGroup.lastMessageAt 
                  ? new Date(serverGroup.lastMessageAt).getTime()
                  : undefined;
                
                // Set last message info
                if (serverGroup.messages && serverGroup.messages.length > 0) {
                  const lastMessage = serverGroup.messages[serverGroup.messages.length - 1];
                  g.lastMessageContent = lastMessage.content || lastMessage.message;
                  g.lastMessageSender = lastMessage.sender?.fname || lastMessage.senderName;
                  g.lastMessageSenderId = lastMessage.sender?.id || lastMessage.senderId;
                }
                
                g.isSynced = true;
              })
            );
          }

          // Also cache the latest messages for this group
          if (serverGroup.messages?.length > 0 && messagesCollection) {
            for (const serverMessage of serverGroup.messages.slice(0, 5)) { // Only cache last 5 messages
              const existingMessage = await messagesCollection
                .query(Q.where('server_id', serverMessage.id))
                .fetch();

              if (existingMessage.length === 0) {
                batch.push(
                  messagesCollection.prepareCreate((m: any) => {
                    m.serverId = serverMessage.id;
                    m.groupId = serverGroup.id;
                    m.content = serverMessage.content;
                    m.senderId = serverMessage.sender.id;
                    m.senderName = serverMessage.sender.fname;
                    m.senderAvatar = serverMessage.sender.avatar;
                    m.replyToId = serverMessage.replyTo;
                    m.fileUrl = serverMessage.file?.url;
                    m.fileType = serverMessage.file?.type;
                    m.isPending = false;
                    m.isSynced = true;
                  })
                );
              }
            }
          }
        }

        if (batch.length > 0) {
          await database!.batch(...batch);
          console.log('✅ Updated', batch.length, 'database records');
        }
      });
    } catch (err: any) {
      console.error('❌ Fetch from server error:', err);
      throw err;
    }
  };

  const refresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchFromServer();
    } catch (err: any) {
      setError(err.message || 'Failed to refresh groups');
    } finally {
      setIsRefreshing(false);
    }
  };

  const markAsRead = async (groupId: string) => {
    let group: Group[] = [];
    try {
      // Update local database immediately
      if (groupsCollection && database) {
        group = await groupsCollection
          .query(Q.where('server_id', groupId))
          .fetch();

        if (group.length > 0) {
          await database.write(async () => {
            await group[0].update((g: Group) => {
              g.unreadCount = 0;
            });
          });
        }
      }

      // Send to server
      await api.post(UrlConstants.markGroupMessageAsRead(groupId));
    } catch (err: any) {
      console.error('❌ Mark as read error:', err);
      // Revert local change if server request fails
      if (group.length > 0 && database) {
        await database.write(async () => {
          await group[0].update((g: Group) => {
            g.unreadCount = g.unreadCount; // Restore original value
          });
        });
      }
    }
  };

  return {
    groups,
    isLoading: isLoading && groups.length === 0, // Only show loading if no cached data
    error: error && groups.length === 0 ? error : null, // Only show error if no cached data
    isRefreshing,
    refresh,
    markAsRead,
    // Transform groups to UI format
    uiGroups: groups.map(group => group.toUIFormat()),
    // Additional cache info
    isCached: groups.length > 0 && !isRefreshing,
    hasData: groups.length > 0,
  };
};