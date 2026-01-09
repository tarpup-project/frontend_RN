import { CacheStatus } from "@/components/CacheStatus";
import { CachedImage } from "@/components/CachedImage";
import Header from "@/components/Header";
import NewChatModal from "@/components/NewChatModal";
import NewGroupModal from "@/components/NewGroupModal";
import { Skeleton } from "@/components/Skeleton";
import { Text } from "@/components/Themedtext";
import { useTheme } from "@/contexts/ThemeContext";
import { useCampus } from "@/hooks/useCampus";
import { useImagePreloader } from "@/hooks/useImagePreloader";
import { useUnifiedGroups } from "@/hooks/useUnifiedGroups";
import { useAuthStore } from "@/state/authStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import moment from "moment";
import React, { useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View
} from "react-native";

const GroupSkeletonCard = ({ isDark }: { isDark: boolean }) => {
  return (
    <View
      style={[
        styles.groupCard,
        {
          backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
          borderColor: isDark ? "#333333" : "#E0E0E0",
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Skeleton width={60} height={24} borderRadius={6} />
          <Skeleton width={60} height={24} borderRadius={6} />
        </View>
        <Skeleton width={70} height={24} borderRadius={12} />
      </View>

      <Skeleton
        width="100%"
        height={16}
        borderRadius={4}
        style={{ marginBottom: 8 }}
      />
      <Skeleton
        width="80%"
        height={12}
        borderRadius={4}
        style={{ marginBottom: 12 }}
      />

      <View style={styles.membersRow}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Skeleton width={28} height={28} borderRadius={14} />
          <Skeleton
            width={28}
            height={28}
            borderRadius={14}
            style={{ marginLeft: -8 }}
          />
          <Skeleton
            width={28}
            height={28}
            borderRadius={14}
            style={{ marginLeft: -8 }}
          />
          <Skeleton
            width={80}
            height={12}
            borderRadius={4}
            style={{ marginLeft: 8 }}
          />
        </View>
      </View>

      <View style={styles.footerRow}>
        <Skeleton width={100} height={12} borderRadius={4} />
        <Skeleton width={90} height={20} borderRadius={10} />
      </View>

      <Skeleton
        width="100%"
        height={36}
        borderRadius={18}
        style={{ marginTop: 8 }}
      />
    </View>
  );
};

const Groups = () => {
  const { isDark } = useTheme();
  const { user } = useAuthStore(); // Get current user for message comparison
  const {
    groups,
    uiGroups,
    isLoading,
    error,
    refresh,
    markAsRead,
    isCached,
    hasData,
  } = useUnifiedGroups();
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [showComposeMenu, setShowComposeMenu] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [showCacheStatus, setShowCacheStatus] = useState(false);
  const { selectedUniversity } = useCampus();
  const router = useRouter();

  // Preload profile pictures for better performance
  useImagePreloader(groups || []);

  const handleManualRefresh = async () => {
    setIsManualRefreshing(true);
    await refresh();
    setIsManualRefreshing(false);
  };

  const handleNewChat = () => {
    setShowComposeMenu(false);
    setShowNewChatModal(true);
  };

  const handleChatCreated = (chatData: any) => {
    console.log('Chat created successfully:', chatData);
    
    // Navigate to the group chat screen using the created chat/group ID
    if (chatData.id || chatData._id) {
      const chatId = chatData.id || chatData._id;
      try {
        router.push({
          pathname: `/group-chat/${chatId}` as any,
          params: {
            groupData: safeStringify(chatData),
          },
        });
      } catch (error) {
        console.error('Chat navigation error:', error);
        // Fallback navigation without params
        router.push(`/group-chat/${chatId}` as any);
      }
    } else {
      console.error('No chat ID found in created chat data');
    }
  };

  const handleNewGroup = () => {
    setShowComposeMenu(false);
    setShowNewGroupModal(true);
  };

  const handleGroupCreated = (groupData: any) => {
    console.log('Group created successfully:', groupData);
    
    // Navigate to the group chat screen using the created group ID
    if (groupData.id || groupData._id) {
      const groupId = groupData.id || groupData._id;
      try {
        router.push({
          pathname: `/group-chat/${groupId}` as any,
          params: {
            groupData: safeStringify(groupData),
          },
        });
      } catch (error) {
        console.error('Group navigation error:', error);
        // Fallback navigation without params
        router.push(`/group-chat/${groupId}` as any);
      }
    } else {
      console.error('No group ID found in created group data');
    }
  };

  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
    },
    text: {
      color: isDark ? "#FFFFFF" : "#0a0a0a",
    },
    subtitle: {
      color: isDark ? "#CCCCCC" : "#666666",
    },
    card: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    avatarBorder: {
      borderColor: isDark ? "#0a0a0a" : "#FFFFFF",
    },
    retryButton: {
      backgroundColor: isDark ? "#FFFFFF" : "#000000",
    },
    retryButtonText: {
      color: isDark ? "#0a0a0a" : "#FFFFFF",
    },
  };

  // Helper function to safely serialize objects with circular references
  const safeStringify = (obj: any) => {
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, val) => {
      if (val != null && typeof val === "object") {
        if (seen.has(val)) {
          return "[Circular]";
        }
        seen.add(val);
      }
      return val;
    });
  };

  // Helper function to extract essential group data for navigation
  const getEssentialGroupData = (group: any) => {
    return {
      id: group.id,
      name: group.name,
      description: group.description,
      members: group.members?.map((member: any) => ({
        id: member.id,
        fname: member.fname,
        lname: member.lname,
        bgUrl: member.bgUrl,
      })) || [],
      category: group.category?.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        bgColorHex: cat.bgColorHex,
      })) || [],
      createdAt: group.createdAt,
      lastMessageAt: group.lastMessageAt,
      messages: group.messages?.slice(-10).map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        senderID: msg.senderID,
        createdAt: msg.createdAt,
        sender: msg.sender ? {
          id: msg.sender.id,
          fname: msg.sender.fname,
          lname: msg.sender.lname,
        } : null,
      })) || [], // Only last 10 messages to avoid large payloads
    };
  };

  const renderGroupsList = () => {
    if (!uiGroups || !Array.isArray(uiGroups) || uiGroups.length === 0) {
      return null;
    }

    return uiGroups
      .slice()
      .sort((a: any, b: any) => {
        try {
          // Sort by unread count first, then by activity time
          if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
          if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
          if (a.unreadCount > 0 && b.unreadCount > 0) {
            return b.unreadCount - a.unreadCount;
          }
          
          // Sort by last message time or created time
          const aTime = a.rawGroup?.lastMessageAt || a.rawGroup?.createdAt || 0;
          const bTime = b.rawGroup?.lastMessageAt || b.rawGroup?.createdAt || 0;
          return bTime - aTime;
        } catch (error) {
          console.error('Sort error:', error);
          return 0;
        }
      })
      .map((group: any) => {
        try {
          if (!group || !group.rawGroup) {
            console.warn('Invalid group data:', group);
            return null;
          }
          
          const isGeneral = (group.category || "").toLowerCase() === "general";
        
        if (isGeneral) {
          const timestamp = group.rawGroup.lastMessageAt || group.rawGroup.createdAt || Date.now();
          const when = moment(timestamp).fromNow();
          const initial = group.title?.[0]?.toUpperCase() || "G";
          
          // For general category (personal chats), show the last message instead of description
          let displayMessage = "No messages yet";
          
          if (group.rawGroup.messages && group.rawGroup.messages.length > 0) {
            const lastMessage = group.rawGroup.messages[group.rawGroup.messages.length - 1];
            if (lastMessage) {
              // Format the last message
              const senderName = lastMessage.sender?.fname || lastMessage.senderName || "Someone";
              const messageContent = lastMessage.content || lastMessage.message || "";
              
              // Check for image
              const hasImage = lastMessage.fileUrl || lastMessage.file?.url || (typeof lastMessage.fileType === 'string' && lastMessage.fileType.startsWith('image')) || lastMessage.file;
              
              const currentUserId = user?.id;
              const isFromCurrentUser = !!currentUserId && (
                lastMessage.sender?.id === currentUserId || 
                lastMessage.senderId === currentUserId
              );
              const prefix = isFromCurrentUser ? "You" : senderName;

              if (messageContent) {
                displayMessage = `${prefix}: ${messageContent}`;
              } else if (hasImage) {
                displayMessage = `${prefix}: 📷 Image`;
              }
            }
          } else if (group.rawGroup.lastMessage) {
            // Fallback to lastMessage field if messages array is not available
            const lastMsg = group.rawGroup.lastMessage;
            if (typeof lastMsg === 'string') {
              displayMessage = lastMsg;
            } else if (lastMsg.content || lastMsg.message) {
              const senderName = lastMsg.sender?.fname || lastMsg.senderName || "Someone";
              const messageContent = lastMsg.content || lastMsg.message;

              const hasImage = lastMsg.fileUrl || lastMsg.file?.url || (typeof lastMsg.fileType === 'string' && lastMsg.fileType.startsWith('image')) || lastMsg.file;

              const currentUserId = user?.id;
              const isFromCurrentUser = !!currentUserId && (
                lastMsg.sender?.id === currentUserId || 
                lastMsg.senderId === currentUserId
              );
              const prefix = isFromCurrentUser ? "You" : senderName;
              
              if (messageContent) {
                displayMessage = `${prefix}: ${messageContent}`;
              } else if (hasImage) {
                displayMessage = `${prefix}: 📷 Image`;
              }
            }
          }
          
          // Get up to 3 members for profile pictures
          const displayMembers = group.rawGroup.members?.slice(0, 3) || [];
          
          return (
            <Pressable
              key={group.id}
              style={[styles.dmCard, dynamicStyles.card]}
              onPress={() => {
                try {
                  const essentialData = getEssentialGroupData(group.rawGroup);
                  router.push({
                    pathname: `/group-chat/${group.id}` as any,
                    params: {
                      groupData: JSON.stringify(essentialData),
                    },
                  });
                } catch (error) {
                  console.error('Navigation error:', error);
                  // Fallback navigation without params
                  router.push(`/group-chat/${group.id}` as any);
                }
              }}
            >
              <View style={styles.dmHeader}>
                <View style={styles.dmAvatarContainer}>
                  {displayMembers.length > 1 ? (
                    // Multiple profile pictures for groups
                    <View style={styles.multipleAvatars}>
                      {displayMembers.map((member: any, index: number) => (
                        <View
                          key={member.id || index}
                          style={[
                            styles.dmAvatarSmall,
                            {
                              backgroundColor: member.bgUrl
                                ? "transparent"
                                : (group.avatarColors?.[index] || ["#FF6B9D", "#4A90E2", "#9C27B0"][index] || "#ff5f6d"),
                              zIndex: displayMembers.length - index,
                              marginLeft: index > 0 ? -16 : 0,
                            },
                            dynamicStyles.avatarBorder,
                          ]}
                        >
                          {member.bgUrl ? (
                            <CachedImage
                              uri={member.bgUrl}
                              style={styles.dmAvatarSmallImage}
                              fallbackText={(member.fname?.[0] || member.name?.[0] || "U")}
                              fallbackColor={(group.avatarColors?.[index] || ["#FF6B9D", "#4A90E2", "#9C27B0"][index] || "#ff5f6d")}
                              cacheKey={`avatar_${member.id || index}_small`}
                            />
                          ) : (
                            <Text style={styles.dmAvatarSmallText}>
                              {(member.fname?.[0] || member.name?.[0] || "U").toUpperCase()}
                            </Text>
                          )}
                        </View>
                      ))}
                    </View>
                  ) : (
                    // Single avatar for 1-on-1 chats
                    <View style={[styles.dmAvatar, { backgroundColor: "#ff5f6d" }]}>
                      {displayMembers[0]?.bgUrl ? (
                        <CachedImage
                          uri={displayMembers[0].bgUrl}
                          style={styles.dmAvatarImage}
                          fallbackText={initial}
                          fallbackColor="#ff5f6d"
                          cacheKey={`avatar_${displayMembers[0].id}_large`}
                        />
                      ) : (
                        <Text style={styles.dmAvatarText}>{initial}</Text>
                      )}
                    </View>
                  )}
                </View>
                <View style={styles.dmContentContainer}>
                  <View style={styles.dmHeaderRow}>
                    <View style={styles.dmNameContainer}>
                      <Text style={[styles.dmName, dynamicStyles.text]}>
                        {group.title}
                      </Text>
                      {/* Only show member count for group chats (more than 2 members) */}
                      {group.members > 2 && (
                        <View style={[styles.memberCountBadge, { 
                          backgroundColor: isDark ? "#2A2A2A" : "#F5F5F5",
                          borderColor: isDark ? "#444444" : "#E0E0E0"
                        }]}>
                          <Ionicons name="people" size={12} color={isDark ? "#FFFFFF" : "#000000"} />
                          <Text style={[styles.memberCountText, { color: isDark ? "#FFFFFF" : "#000000" }]}>
                            {group.members}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.dmTimeContainer}>
                      <Text style={[styles.dmTime, dynamicStyles.subtitle]}>
                        {when}
                      </Text>
                    </View>
                  </View>
                  {/* Last message and counter on same line */}
                  <View style={styles.dmMessageRow}>
                    <Text 
                      style={[styles.dmMessage, dynamicStyles.subtitle]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {displayMessage}
                    </Text>
                    {group.unreadCount > 0 && (
                      <View style={[styles.newMessagesBadge, { backgroundColor: "#EF4444" }]}>
                        <Text style={[styles.newMessagesText, { color: "#FFFFFF" }]}>
                          {group.unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </Pressable>
          );
        }
        
        return (
          <Pressable
            key={group.id}
            style={[styles.groupCard, dynamicStyles.card]}
            onPress={() => {
              try {
                const essentialData = getEssentialGroupData(group.rawGroup);
                router.push({
                  pathname: `/group-chat/${group.id}` as any,
                  params: {
                    groupData: JSON.stringify(essentialData),
                  },
                });
              } catch (error) {
                console.error('Navigation error:', error);
                // Fallback navigation without params
                router.push(`/group-chat/${group.id}` as any);
              }
            }}
          >
            <View style={styles.topRow}>
              <View style={styles.badgesRow}>
                <View
                  style={[
                    styles.categoryBadge,
                    { 
                      backgroundColor: isDark ? "#FFFFFF" : "#000000",
                      borderWidth: 1,
                      borderColor: "rgba(0,0,0,0.1)"
                    }
                  ]}
                >
                  <Ionicons
                    name="home-outline"
                    size={10}
                    color={isDark ? "#000000" : "#FFFFFF"}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      { 
                        color: isDark ? "#000000" : "#FFFFFF",
                        fontWeight: "700",
                        fontSize: 9,
                      }
                    ]}
                  >
                    {group.category ? (group.category.charAt(0).toUpperCase() + group.category.slice(1).toLowerCase()) : ""}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.matchBadge, 
                  { 
                    backgroundColor: "#3B82F6",
                    borderWidth: 1,
                    borderColor: "rgba(0,0,0,0.1)"
                  }
                ]}
              >
                <Ionicons
                  name="star"
                  size={10}
                  color="#FFFFFF"
                />
                <Text
                  style={[
                    styles.matchText, 
                    { 
                      color: "#FFFFFF",
                      fontWeight: "700",
                    }
                  ]}
                >
                  {group.matchPercentage}% match
                </Text>
              </View>
            </View>

            <Text style={[styles.groupTitle, dynamicStyles.text]}>
              {group.title}
            </Text>
            <Text
              style={[styles.groupDescription, dynamicStyles.subtitle]}
            >
              {group.description}
            </Text>

            <View style={styles.membersRow}>
              <View style={styles.avatarsContainer}>
                {(group.rawGroup.members || [])
                  .slice(0, 3)
                  .map((member: any, index: number) => (
                    <View
                      key={member.id}
                      style={[
                        styles.avatar,
                        {
                          backgroundColor: member.bgUrl
                            ? "transparent"
                            : group.avatarColors?.[index] || "#E0E0E0",
                        },
                        dynamicStyles.avatarBorder,
                        index > 0 && { marginLeft: -8 },
                      ]}
                    >
                      {member.bgUrl ? (
                        <CachedImage
                          uri={member.bgUrl}
                          style={styles.avatarImage}
                          fallbackText={member.fname[0].toUpperCase()}
                          fallbackColor={group.avatarColors?.[index] || "#E0E0E0"}
                          cacheKey={`avatar_${member.id}_group`}
                        />
                      ) : (
                        <Text style={styles.avatarText}>
                          {member.fname[0].toUpperCase()}
                        </Text>
                      )}
                    </View>
                  ))}
                <Text
                  style={[styles.membersText, dynamicStyles.subtitle]}
                >
                  {group.members}{" "}
                  {group.members === 1 ? "member" : "members"}
                </Text>
              </View>
            </View>

            <View style={styles.footerRow}>
              <View style={styles.activeRow}>
                <Ionicons
                  name="time-outline"
                  size={14}
                  color={dynamicStyles.subtitle.color}
                />
                <Text
                  style={[styles.activeText, dynamicStyles.subtitle]}
                >
                  Active{" "}
                  {moment(
                    group.rawGroup.lastMessageAt ||
                      group.rawGroup.createdAt ||
                      Date.now()
                  ).fromNow()}
                </Text>
              </View>

              <View
                style={[styles.unreadBadge, { backgroundColor: "#EF4444" }]}
              >
                <Text
                  style={[styles.unreadText, { color: "#FFFFFF" }]}
                >
                  {group.unreadCount} new messages
                </Text>
              </View>
            </View>
          </Pressable>
        );
        } catch (error) {
          console.error('Group render error:', error);
          return null;
        }
      })
      .filter(Boolean); // Remove null entries
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Header />

      <Pressable 
        style={{ flex: 1 }}
        onPress={() => showComposeMenu && setShowComposeMenu(false)}
      >
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={isManualRefreshing}
              onRefresh={handleManualRefresh}
            />
          }
        >
        <View style={styles.headerSection}>
          <View style={styles.headerRow}>
            <Text style={[styles.pageTitle, dynamicStyles.text]}>
              Chats
            </Text>
            <View style={styles.composeContainer}>
              <Pressable 
                style={styles.composeButton}
                onPress={() => setShowComposeMenu(!showComposeMenu)}
              >
                <Ionicons name="create-outline" size={20} color={dynamicStyles.text.color} />
              </Pressable>
              
              {showComposeMenu && (
                <View style={[styles.composeMenu, {
                  backgroundColor: isDark ? "#1a1a1a" : "#FFFFFF",
                  borderColor: isDark ? "#333333" : "#E0E0E0",
                }]}>
                  <Pressable 
                    style={[styles.menuItem, {
                      borderBottomColor: isDark ? "#333333" : "#E0E0E0",
                      borderBottomWidth: 1,
                    }]}
                    onPress={handleNewChat}
                  >
                    <Ionicons 
                      name="chatbubble-outline" 
                      size={18} 
                      color={dynamicStyles.text.color} 
                    />
                    <Text style={[styles.menuText, dynamicStyles.text]}>
                      New Chat
                    </Text>
                  </Pressable>
                  
                  <Pressable 
                    style={[styles.menuItem, { borderBottomWidth: 0 }]}
                    onPress={handleNewGroup}
                  >
                    <Ionicons 
                      name="people-outline" 
                      size={18} 
                      color={dynamicStyles.text.color} 
                    />
                    <Text style={[styles.menuText, dynamicStyles.text]}>
                      New Group
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
          <Text style={[styles.pageSubtitle, dynamicStyles.subtitle]}>
            Prompt-matched groups and direct messages
            {selectedUniversity && ` • ${selectedUniversity.name}`}
          </Text>
        </View>

        <View style={styles.groupsList}>
          {/* Loading State */}
          {isLoading && (
            <>
              <GroupSkeletonCard isDark={isDark} />
              <GroupSkeletonCard isDark={isDark} />
              <GroupSkeletonCard isDark={isDark} />
              <GroupSkeletonCard isDark={isDark} />
            </>
          )}

          {/* Error State */}
          {!isLoading && error && !hasData ? (
            <View style={styles.centerContainer} key="error-state">
              <Ionicons
                name="alert-circle-outline"
                size={48}
                color={isDark ? "#FF6B6B" : "#E74C3C"}
              />
              <Text style={[styles.errorText, dynamicStyles.text]}>
                Unable to load groups
              </Text>
              <Text style={[styles.errorSubtext, dynamicStyles.subtitle]}>
                Something went wrong
              </Text>
              <Pressable
                style={[styles.retryButton, dynamicStyles.retryButton]}
                onPress={() => {
                  console.log('🔄 Manual retry triggered');
                  refresh();
                }}
              >
                <Text
                  style={[
                    styles.retryButtonText,
                    dynamicStyles.retryButtonText,
                  ]}
                >
                  Try Again
                </Text>
              </Pressable>
            </View>
          ) : null}

          {/* Cached Data with Error State */}
          {!isLoading && error && hasData ? (
            <View style={[styles.cacheNotice, {
              backgroundColor: isDark ? "#2A2A2A" : "#F5F5F5",
              borderColor: isDark ? "#444444" : "#E0E0E0",
            }]}>
              <Ionicons
                name="cloud-offline-outline"
                size={16}
                color={isDark ? "#CCCCCC" : "#666666"}
              />
              <Text style={[styles.cacheNoticeText, {
                color: isDark ? "#CCCCCC" : "#666666",
              }]}>
                Showing cached data - network unavailable
              </Text>
              <Pressable
                style={[styles.retrySmallButton, {
                  backgroundColor: isDark ? "#444444" : "#E0E0E0",
                }]}
                onPress={() => {
                  console.log('🔄 Manual retry from cache notice');
                  refresh();
                }}
              >
                <Text style={[styles.retrySmallButtonText, {
                  color: isDark ? "#FFFFFF" : "#000000",
                }]}>
                  Retry
                </Text>
              </Pressable>
            </View>
          ) : null}

          {/* Empty State */}
          {!isLoading && !error && (!groups || !Array.isArray(groups) || groups.length === 0) && !hasData ? (
            <View style={styles.centerContainer}>
              <Ionicons
                name="people-outline"
                size={48}
                color={dynamicStyles.subtitle.color}
              />
              <Text style={[styles.emptyText, dynamicStyles.text]}>
                No groups yet
              </Text>
              <Text style={[styles.emptySubtext, dynamicStyles.subtitle]}>
                Join or create a group to get started
              </Text>
            </View>
          ) : null}

          {/* Groups List */}
          {!isLoading && (groups && Array.isArray(groups) && groups.length > 0) || hasData ? (
            <>{renderGroupsList()}</>
          ) : null}
        </View>
      </ScrollView>
      </Pressable>
      
      {/* New Chat Modal */}
      <NewChatModal
        visible={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onChatCreated={handleChatCreated}
      />
      
      {/* New Group Modal */}
      <NewGroupModal
        visible={showNewGroupModal}
        onClose={() => setShowNewGroupModal(false)}
        onGroupCreated={handleGroupCreated}
      />
      
      {/* Cache Status */}
      <CacheStatus
        visible={showCacheStatus}
        onPress={() => {
          setShowCacheStatus(false);
          router.push('/cache-management');
        }}
      />
      
      {/* Long press to show cache status */}
      <Pressable
        style={styles.cacheToggle}
        onLongPress={() => setShowCacheStatus(!showCacheStatus)}
        delayLongPress={2000}
      >
        <View style={{ width: 20, height: 20 }} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  headerSection: {
    marginTop: 16,
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  composeContainer: {
    position: "relative",
  },
  composeButton: {
    padding: 4,
  },
  composeMenu: {
    position: "absolute",
    top: 35,
    right: 0,
    minWidth: 140,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  menuText: {
    fontSize: 14,
    fontWeight: "500",
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  pageSubtitle: {
    fontSize: 12,
  },
  groupsList: {
    gap: 16,
    marginBottom: 50,
  },
  groupCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.3,
    textAlign: "center",
  },
  matchBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  matchText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  groupDescription: {
    fontSize: 12,
    lineHeight: 18,
  },
  membersRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  membersText: {
    fontSize: 11,
    marginLeft: 8,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  activeText: {
    fontSize: 10,
  },
  unreadBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unreadText: {
    fontSize: 10,
    fontWeight: "600",
  },
  dmCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  dmHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dmContentContainer: {
    flex: 1,
    justifyContent: "center",
  },
  dmAvatarContainer: {
    width: 56,
    height: 56,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  dmAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ff5f6d",
    overflow: "hidden",
  },
  dmAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  dmAvatarText: { 
    color: "#FFFFFF", 
    fontSize: 18, 
    fontWeight: "700" 
  },
  multipleAvatars: {
    flexDirection: "row",
    alignItems: "center",
  },
  dmAvatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    overflow: "hidden",
  },
  dmAvatarSmallImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  dmAvatarSmallText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  dmHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dmNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  dmTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dmName: { 
    fontSize: 14, 
    fontWeight: "700" 
  },
  memberCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  memberCountText: {
    fontSize: 12,
    fontWeight: "600",
  },
  dmTime: { 
    fontSize: 11 
  },
  dmMessage: { 
    fontSize: 12,
    flex: 1,
    marginRight: 8,
  },
  dmMessageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dmFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  newMessagesBadge: {
    backgroundColor: "#EF4444",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    flexShrink: 0,
  },
  newMessagesText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
  },
  cacheToggle: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 20,
    height: 20,
  },
  cacheNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  cacheNoticeText: {
    fontSize: 12,
    flex: 1,
  },
  retrySmallButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retrySmallButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default Groups;