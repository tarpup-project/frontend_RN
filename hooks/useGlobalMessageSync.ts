
import { api } from '@/api/client';
import { UrlConstants } from '@/constants/apiUrls';
import { asyncStorageDB, isWatermelonAvailable } from '@/database';
import { useAuthStore } from '@/state/authStore';
import { useSyncStore } from '@/state/syncStore';
import { AlertMessage, Group, GroupMessage, MessageType, UserMessage } from '@/types/groups';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export const useGlobalMessageSync = () => {
    const { user } = useAuthStore();
    const { isSyncing, setIsSyncing, setStatusMessage } = useSyncStore();
    const queryClient = useQueryClient();

    const syncAllMessages = useCallback(async () => {
        if (!user?.id || isSyncing) return;

        try {
            setIsSyncing(true);
            setStatusMessage("Getting all messages while you were away");
            console.log('🌍 Starting global message sync...');

            // 1. Fetch all groups
            const response = await api.get<{ data: Group[] }>(UrlConstants.fetchAllGroups());
            const groups = response.data?.data || [];

            if (groups.length === 0) {
                console.log('🌍 No groups to sync');
                setIsSyncing(false);
                setStatusMessage(null);
                return;
            }

            console.log(`🌍 Found ${groups.length} active groups on server`);

            // 1b. Update React Query cache for immediate UI update (Last Message & Unread Count)
            const queryCache = queryClient.getQueryCache();
            const activeGroupQueries = queryCache.findAll({ queryKey: ['groups', 'list'] });

            activeGroupQueries.forEach(query => {
                queryClient.setQueryData(query.queryKey, groups);
            });
            // Also set default key if none active
            queryClient.setQueryData(['groups', 'list', undefined], groups);

            // 2. Fetch local groups to compare timestamps
            const localGroups = await asyncStorageDB.getGroups();
            const localGroupsMap = new Map(localGroups.map(g => [g.id || g.serverId, g]));

            // 3. Filter groups that need updating
            const groupsToSync = groups.filter(serverGroup => {
                const localGroup = localGroupsMap.get(serverGroup.id);
                if (!localGroup) return true; // New group, must sync

                // Check if server has newer message
                const getServerTime = (g: Group) => {
                    const time = g.lastMessageAt || g.createdAt;
                    return time ? new Date(time).getTime() : 0;
                };

                const getLocalTime = (g: any) => {
                    // Handle both WatermelonDB and AsyncStorage formats
                    const time = g.lastMessageAt || g.createdAt || g.updatedAt;
                    return time ? new Date(time).getTime() : 0;
                };

                const serverTime = getServerTime(serverGroup);
                const localTime = getLocalTime(localGroup);

                // Use a small buffer (1 second) to prevent floating point/parsing minor diffs
                const needsUpdate = serverTime > (localTime + 1000);

                if (!needsUpdate) {
                    console.log(`⏩ Skipping group ${serverGroup.name} (Server: ${serverTime} <= Local: ${localTime})`);
                } else {
                    console.log(`🔄 Updating group ${serverGroup.name} (Diff: ${serverTime - localTime}ms)`);
                }

                return needsUpdate;
            });

            if (groupsToSync.length === 0) {
                console.log('✅ All groups are up to date');
                setIsSyncing(false);
                setStatusMessage(null);
                return;
            }

            console.log(`📥 Syncing messages for ${groupsToSync.length} updated groups`);

            // 4. Fetch messages only for needy groups
            const BATCH_SIZE = 3;
            for (let i = 0; i < groupsToSync.length; i += BATCH_SIZE) {
                const batch = groupsToSync.slice(i, i + BATCH_SIZE);

                await Promise.all(batch.map(async (group) => {
                    try {
                        // Fetch messages via REST API with increased timeout
                        const msgResponse = await api.get(UrlConstants.fetchGroupMessages(group.id), { timeout: 60000 });
                        const rawMessages = msgResponse.data?.messages || [];

                        if (rawMessages.length === 0) return;

                        // Transform messages to DB format
                        const transformedMessages = rawMessages.map((msg: any) => {
                            const contentId = msg.content?.id || msg.id;
                            const sender = msg.sender || msg.user || {};

                            return {
                                id: contentId,
                                serverId: contentId,
                                groupId: group.id,
                                content: msg.content?.message || msg.message || '',
                                senderId: sender.id || 'system',
                                senderName: sender.fname || 'System',
                                replyToId: msg.replyingTo?.content?.id,
                                fileUrl: msg.file?.data,
                                fileType: msg.file?.ext,
                                isPending: false,
                                isSynced: true,
                                createdAt: msg.createdAt ? new Date(msg.createdAt).getTime() : Date.now(),
                                updatedAt: Date.now(),
                            };
                        });

                        // 3. Sync to Database
                        if (isWatermelonAvailable) {
                            // TODO: WatermelonDB implementation
                        } else {
                            await asyncStorageDB.syncMessages(group.id, transformedMessages);
                        }

                        // 4. Preload React Query Cache for instant UI access using rawMessages (source of truth)
                        // Use a separate transformation for UI to ensure it matches GroupMessage type perfectly
                        const transformedUIMessages: GroupMessage[] = rawMessages.map((msg: any) => {
                            const contentId = msg.content?.id || msg.id;
                            const sender = msg.sender || msg.user || {};
                            const messageContent = msg.content?.message || msg.message || '';
                            const fileData = msg.file?.data;
                            const fileExt = msg.file?.ext;

                            const baseMessage = {
                                content: {
                                    id: contentId,
                                    message: messageContent
                                },
                                createdAt: msg.createdAt || new Date().toISOString()
                            };

                            if (sender.id === 'system' || !sender.id) {
                                return {
                                    messageType: MessageType.ALERT,
                                    ...baseMessage,
                                    sender: {
                                        id: 'system',
                                        fname: 'System'
                                    }
                                } as AlertMessage;
                            }

                            // Resolve replyingTo if it exists
                            let replyingTo: UserMessage | undefined = undefined;
                            if (msg.replyingTo) {
                                // Basic shape for replyingTo
                                const replyContent = msg.replyingTo.content?.message || (msg.replyingTo.file ? '📷 Image' : '');
                                replyingTo = {
                                    messageType: MessageType.USER,
                                    content: {
                                        id: msg.replyingTo.content?.id || msg.replyingTo.id,
                                        message: replyContent
                                    },
                                    sender: {
                                        id: msg.replyingTo.sender?.id || 'unknown',
                                        fname: msg.replyingTo.sender?.fname || 'Unknown'
                                    },
                                    createdAt: msg.replyingTo.createdAt || new Date().toISOString()
                                } as UserMessage;
                            }

                            return {
                                messageType: MessageType.USER,
                                ...baseMessage,
                                sender: {
                                    id: sender.id,
                                    fname: sender.fname
                                },
                                file: fileData ? {
                                    name: 'file',
                                    size: 0,
                                    data: fileData,
                                    ext: fileExt || 'image'
                                } : undefined,
                                replyingTo
                            } as UserMessage;
                        });

                        queryClient.setQueryData(['groups', 'messages', group.id], transformedUIMessages);
                        console.log(`🧠 Preloaded ${transformedUIMessages.length} messages into cache for group ${group.name}`);

                        // Do NOT invalidate queries here. 
                        // invalidating triggers useQuery to refetch via socket in the active view, 
                        // which defeats the purpose of "background" sync and causes double-fetching.
                        // The active view handles its own syncing via useEnhancedGroupMessages.
                        // queryClient.invalidateQueries({ queryKey: ['groups', 'messages', group.id] });

                        console.log(`✅ Synced ${transformedMessages.length} messages for group ${group.name}`);
                    } catch (err) {
                        console.error(`❌ Failed to sync messages for group ${group.id}:`, err);
                    }
                }));
            }


            // 5. Update local group cache with fresh server data
            await asyncStorageDB.saveGroups(groups);

            // 5b. Update React Query cache for immediate UI update
            // We iterate over potential campus IDs (or undefined) via invalidation or broad setting
            // Since we don't know the exact campus ID key active, we can match broad 'groups' and 'list'
            // But setQueryData requires exact key. 
            // Better strategy: Invalidate 'groups' lists so they refetch from cache/network?
            // No, user wants *immediate* load.
            // Let's try to update the most likely keys or all active group list queries.

            const finalActiveGroupQueries = queryCache.findAll({ queryKey: ['groups', 'list'] });

            finalActiveGroupQueries.forEach(query => {
                queryClient.setQueryData(query.queryKey, groups);
            });

            // Also set default key if none active (for next render)
            queryClient.setQueryData(['groups', 'list', undefined], groups);

            console.log(`💾 Updated local group cache with ${groups.length} groups`);

            console.log('🌍 Global message sync completed');
        } catch (error) {
            console.error('❌ Global message sync failed:', error);
        } finally {
            setIsSyncing(false);
            setStatusMessage(null);
        }
    }, [user?.id, isSyncing, queryClient]);

    return {
        syncAllMessages,
        isSyncing
    };
};
