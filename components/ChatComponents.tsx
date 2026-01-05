import { formatTimeAgo } from "@/hooks/useEnhancedGroupMessages";
import { AlertMessage, Group, MessageFile, MessageType, UserMessage } from '@/types/groups';
import { formatFileSize } from '@/utils/timeUtils';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Dimensions,
    Image,
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Message Item Component
interface MessageItemProps {
  message: UserMessage | AlertMessage;
  isOwn: boolean;
  onReply: (message: UserMessage) => void;
  onScrollToReply: (messageId: string) => number;
  isDark: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isOwn,
  onReply,
  onScrollToReply,
  isDark,
}) => {
  const dynamicStyles = {
    text: { color: isDark ? '#FFFFFF' : '#0a0a0a' },
    subtitle: { color: isDark ? '#CCCCCC' : '#666666' },
    ownMessage: { backgroundColor: isDark ? '#007AFF' : '#007AFF' },
    otherMessage: { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' },
    ownMessageText: { color: '#FFFFFF' },
    otherMessageText: { color: isDark ? '#FFFFFF' : '#0a0a0a' },
  };

  if (message.messageType === MessageType.ALERT) {
    return (
      <View style={styles.alertContainer}>
        <Text style={[styles.alertText, dynamicStyles.subtitle]}>
          {message.content.message}
        </Text>
      </View>
    );
  }

  const userMessage = message as UserMessage;

  return (
    <View style={[styles.messageContainer, isOwn && styles.ownMessageContainer]}>
      {!isOwn && (
        <View style={styles.senderInfo}>
          <View style={[styles.senderAvatar, { backgroundColor: '#007AFF' }]}>
            {userMessage.sender.bgUrl ? (
              <Image source={{ uri: userMessage.sender.bgUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{userMessage.sender.fname[0]}</Text>
            )}
          </View>
          <Text style={[styles.senderName, dynamicStyles.subtitle]}>
            {userMessage.sender.fname}
          </Text>
        </View>
      )}

      <View style={[styles.messageBubble, isOwn ? dynamicStyles.ownMessage : dynamicStyles.otherMessage]}>
        {/* Reply Preview */}
        {userMessage.replyingTo && (
          <Pressable
            style={[
              styles.replyReference,
              isOwn ? styles.replyReferenceOwn : styles.replyReferenceOther
            ]}
            onPress={() => onScrollToReply(userMessage.replyingTo!.content.id)}
          >
            <View style={styles.replyBar} />
            <View style={styles.replyContent}>
              <Text style={[styles.replyAuthor, isOwn ? dynamicStyles.ownMessageText : dynamicStyles.otherMessageText]}>
                {userMessage.replyingTo.sender.fname}
              </Text>
              <Text
                style={[styles.replyText, isOwn ? dynamicStyles.ownMessageText : dynamicStyles.otherMessageText]}
                numberOfLines={1}
              >
                {userMessage.replyingTo.content.message}
              </Text>
            </View>
            {userMessage.replyingTo.file && (
              <Image source={{ uri: userMessage.replyingTo.file.data }} style={styles.replyImage} />
            )}
          </Pressable>
        )}

        {/* File Attachment */}
        {userMessage.file && (
          <Pressable onPress={() => Linking.openURL(userMessage.file!.data)}>
            <Image source={{ uri: userMessage.file.data }} style={styles.messageImage} />
          </Pressable>
        )}

        {/* Message Text */}
        {userMessage.content.message && (
          <Text style={[styles.messageText, isOwn ? dynamicStyles.ownMessageText : dynamicStyles.otherMessageText]}>
            {userMessage.content.message}
          </Text>
        )}

        {/* Timestamp */}
        <Text style={[styles.timestamp, isOwn ? dynamicStyles.ownMessageText : dynamicStyles.otherMessageText]}>
          {userMessage.createdAt ? formatTimeAgo(userMessage.createdAt) : 'Sending...'}
        </Text>
      </View>

      {/* Reply Button */}
      <Pressable style={styles.replyButton} onPress={() => onReply(userMessage)}>
        <Ionicons name="arrow-undo-outline" size={16} color={dynamicStyles.subtitle.color} />
      </Pressable>
    </View>
  );
};

// Reply Preview Component
interface ReplyPreviewProps {
  message: UserMessage;
  onCancel: () => void;
  isDark: boolean;
}

export const ReplyPreview: React.FC<ReplyPreviewProps> = ({ message, onCancel, isDark }) => {
  const dynamicStyles = {
    container: { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' },
    text: { color: isDark ? '#FFFFFF' : '#0a0a0a' },
    subtitle: { color: isDark ? '#CCCCCC' : '#666666' },
    border: { borderColor: isDark ? '#333333' : '#E0E0E0' },
  };

  return (
    <View style={[styles.replyPreview, dynamicStyles.container, dynamicStyles.border]}>
      <View style={styles.replyBar} />
      <View style={styles.replyContent}>
        <Text style={[styles.replyAuthor, dynamicStyles.text]}>
          Replying to {message.sender.fname}
        </Text>
        <Text style={[styles.replyText, dynamicStyles.subtitle]} numberOfLines={1}>
          {message.content.message}
        </Text>
      </View>
      {message.file && (
        <Image source={{ uri: message.file.data }} style={styles.replyImage} />
      )}
      <Pressable onPress={onCancel} style={styles.cancelReply}>
        <Ionicons name="close" size={20} color={dynamicStyles.subtitle.color} />
      </Pressable>
    </View>
  );
};

// File Preview Component
interface FilePreviewProps {
  file: MessageFile;
  onRemove: () => void;
  isDark: boolean;
}

export const FilePreview: React.FC<FilePreviewProps> = ({ file, onRemove, isDark }) => {
  const dynamicStyles = {
    container: { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' },
    text: { color: isDark ? '#FFFFFF' : '#0a0a0a' },
    subtitle: { color: isDark ? '#CCCCCC' : '#666666' },
  };

  return (
    <View style={[styles.filePreview, dynamicStyles.container]}>
      <Image source={{ uri: file.data }} style={styles.previewImage} />
      <View style={styles.fileInfo}>
        <Text style={[styles.fileName, dynamicStyles.text]} numberOfLines={1}>
          {file.name}
        </Text>
        <Text style={[styles.fileSize, dynamicStyles.subtitle]}>
          {formatFileSize(file.size)}
        </Text>
      </View>
      <Pressable onPress={onRemove} style={styles.removeFile}>
        <Ionicons name="close-circle" size={24} color="#FF3B30" />
      </Pressable>
    </View>
  );
};

// Group Info Panel Component
interface GroupInfoPanelProps {
  group: Group;
  onClose: () => void;
  onLeave: () => void;
  isLeaving: boolean;
  isDark: boolean;
}

export const GroupInfoPanel: React.FC<GroupInfoPanelProps> = ({
  group,
  onClose,
  onLeave,
  isLeaving,
  isDark,
}) => {
  const dynamicStyles = {
    container: { backgroundColor: isDark ? '#000000' : '#FFFFFF' },
    panel: { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' },
    text: { color: isDark ? '#FFFFFF' : '#0a0a0a' },
    subtitle: { color: isDark ? '#CCCCCC' : '#666666' },
    border: { borderColor: isDark ? '#333333' : '#E0E0E0' },
  };

  return (
    <View style={[styles.overlay, dynamicStyles.container]}>
      <View style={[styles.infoPanel, dynamicStyles.panel]}>
        <View style={styles.panelHeader}>
          <Text style={[styles.panelTitle, dynamicStyles.text]}>Group Info</Text>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={24} color={dynamicStyles.text.color} />
          </Pressable>
        </View>

        <ScrollView style={styles.panelContent}>
          {/* Group Details */}
          <View style={styles.groupSection}>
            <View style={[styles.groupIcon, { backgroundColor: group.category[0]?.bgColorHex || '#007AFF' }]}>
              <Ionicons 
                name="people" 
                size={24} 
                color={group.category[0]?.colorHex || '#FFFFFF'} 
              />
            </View>
            <Text style={[styles.groupTitle, dynamicStyles.text]}>{group.name}</Text>
            <Text style={[styles.groupDescription, dynamicStyles.subtitle]}>
              {group.description}
            </Text>
            <View style={styles.groupStats}>
              <View style={styles.statItem}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={[styles.statText, dynamicStyles.text]}>
                  {group.score}% match
                </Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="people" size={16} color={dynamicStyles.subtitle.color} />
                <Text style={[styles.statText, dynamicStyles.text]}>
                  {group.members.length} members
                </Text>
              </View>
            </View>
          </View>

          {/* Members List */}
          <View style={styles.membersSection}>
            <Text style={[styles.sectionTitle, dynamicStyles.text]}>Members</Text>
            {group.members.map((member, index) => (
              <View key={member.id} style={styles.memberItem}>
                <View style={[styles.memberAvatar, { backgroundColor: `hsl(${index * 60}, 60%, 50%)` }]}>
                  {member.bgUrl ? (
                    <Image source={{ uri: member.bgUrl }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarText}>{member.fname[0]}</Text>
                  )}
                </View>
                <Text style={[styles.memberName, dynamicStyles.text]}>
                  {member.fname}
                  {index === 0 && ' (Admin)'}
                </Text>
              </View>
            ))}
          </View>

          {/* Actions */}
          <View style={styles.actionsSection}>
            {group.shareLink && (
              <Pressable style={[styles.actionButton, { backgroundColor: '#007AFF' }]}>
                <Ionicons name="share-outline" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Share Group</Text>
              </Pressable>
            )}

            <Pressable
              style={[styles.actionButton, { backgroundColor: '#FF3B30' }]}
              onPress={onLeave}
              disabled={isLeaving}
            >
              <Ionicons name="exit-outline" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>
                {isLeaving ? 'Leaving...' : 'Leave Group'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

// Error Screen Component
interface ErrorScreenProps {
  message: string;
}

export const ErrorScreen: React.FC<ErrorScreenProps> = ({ message }) => (
  <View style={styles.centerContainer}>
    <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
    <Text style={styles.errorText}>{message}</Text>
  </View>
);

// Styles
const styles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },

  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupAvatars: {
    flexDirection: 'row',
    marginRight: 12,
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  groupDetails: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
  },
  memberCount: {
    fontSize: 12,
    marginTop: 2,
  },

  // Messages styles
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: SCREEN_WIDTH * 0.8,
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '500',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '100%',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    opacity: 0.7,
  },
  replyButton: {
    alignSelf: 'flex-end',
    marginTop: 4,
    padding: 4,
  },

  // Reply styles
  replyReference: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 8,
    borderRadius: 8,
    borderWidth: 0.5,
  },
  replyReferenceOwn: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  replyReferenceOther: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
  },
  replyBar: {
    width: 3,
    height: 30,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  replyContent: {
    flex: 1,
  },
  replyAuthor: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  replyText: {
    fontSize: 12,
    opacity: 0.9,
    borderRadius: 8,
  },
  replyImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginLeft: 8,
  },
  cancelReply: {
    padding: 4,
  },

  // Alert message styles
  alertContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  alertText: {
    fontSize: 12,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },

  // Input styles
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  attachButton: {
    padding: 8,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  joinButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginLeft: 8,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // File preview styles
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  previewImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 12,
    marginTop: 2,
  },
  removeFile: {
    padding: 4,
  },

  // Info panel styles
  infoPanel: {
    maxHeight: '80%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  panelContent: {
    padding: 16,
  },
  groupSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  groupIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  groupDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  groupStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
  },
  membersSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  memberName: {
    fontSize: 16,
    marginLeft: 12,
  },
  actionsSection: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Loading and error styles
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 12,
  },
});
