import { useTheme } from "@/contexts/ThemeContext";
// import { formatFileSize } from "@/utils/timeUtils";
import { Paperclip, Send, X } from "lucide-react-native";
import React, { useRef } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { FileData, ReplyData } from "@/components/chatComponents/chatTypes";

interface MessageInputProps {
  message: string;
  onChangeMessage: (text: string) => void;
  onSend: () => void;
  onAttachment: () => void;
  isJoined: boolean;
  onJoinGroup: () => void;
  isJoining: boolean;
  selectedFile: FileData | null | undefined;
  onRemoveFile: () => void;
  replyingTo: ReplyData | null | undefined;
  onCancelReply: () => void;
  selectImage: () => void;
  selectImageFromCamera: () => void;
  selectFile: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  message,
  onChangeMessage,
  onSend,
  onAttachment,
  isJoined,
  onJoinGroup,
  isJoining,
  selectedFile,
  onRemoveFile,
  replyingTo,
  onCancelReply,
  selectImage,
  selectImageFromCamera,
  selectFile,
}) => {
  const { isDark } = useTheme();
  const textInputRef = useRef<TextInput>(null);

  const dynamicStyles = {
    input: {
      backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5",
      borderColor: isDark ? "#333333" : "#E0E0E0",
      color: isDark ? "#FFFFFF" : "#000000",
    },
    sendButton: {
      backgroundColor: isDark ? "#FFFFFF" : "#000000",
    },
    sendIcon: {
      color: isDark ? "#000000" : "#FFFFFF",
    },
    replyPreview: {
      backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
    text: {
      color: isDark ? "#FFFFFF" : "#000000",
    },
    subtitle: {
      color: isDark ? "#CCCCCC" : "#666666",
    },
  };

  const handleAttachment = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            "Cancel",
            "Take Photo",
            "Choose from Library",
            "Choose File",
          ],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) selectImageFromCamera();
          if (buttonIndex === 2) selectImage();
          if (buttonIndex === 3) selectFile();
        }
      );
    } else {
      Alert.alert("Select File", "Choose an option", [
        { text: "Cancel", style: "cancel" },
        { text: "Take Photo", onPress: selectImageFromCamera },
        { text: "Choose from Library", onPress: selectImage },
        { text: "Choose File", onPress: selectFile },
      ]);
    }
  };

  return (
    <>
      {replyingTo && (
        <View style={[styles.replyPreview, dynamicStyles.replyPreview]}>
          <View style={styles.replyBar} />
          <View style={styles.replyContent}>
            <Text style={[styles.replyAuthor, dynamicStyles.text]}>
              Replying to {replyingTo.sender.fname}
            </Text>
            <Text
              style={[styles.replyText, dynamicStyles.subtitle]}
              numberOfLines={1}
            >
              {replyingTo.content.message}
            </Text>
          </View>
          {replyingTo.file && (
            <Image
              source={{ uri: replyingTo.file.data }}
              style={styles.replyImage}
            />
          )}
          <Pressable onPress={onCancelReply} style={styles.cancelReply}>
            <X size={20} color={dynamicStyles.subtitle.color} />
          </Pressable>
        </View>
      )}

      {selectedFile && (
        <View style={[styles.filePreview, dynamicStyles.replyPreview]}>
          <Image
            source={{ uri: selectedFile.data }}
            style={styles.previewImage}
          />
          <View style={styles.fileInfo}>
            <Text
              style={[styles.fileName, dynamicStyles.text]}
              numberOfLines={1}
            >
              {selectedFile.name}
            </Text>
            <Text style={[styles.fileSize, dynamicStyles.subtitle]}>
  {selectedFile.size} bytes
</Text>
          </View>
          <Pressable onPress={onRemoveFile} style={styles.removeFile}>
            <X size={24} color="#FF3B30" />
          </Pressable>
        </View>
      )}

      <View style={styles.inputSection}>
        <Pressable style={styles.attachButton} onPress={handleAttachment}>
          <Paperclip size={24} color={dynamicStyles.text.color} />
        </Pressable>
        <TextInput
          ref={textInputRef}
          style={[styles.input, dynamicStyles.input]}
          placeholder="Type a message..."
          placeholderTextColor={isDark ? "#666666" : "#999999"}
          value={message}
          onChangeText={onChangeMessage}
          multiline
          maxLength={1000}
        />

        {!isJoined ? (
          <Pressable
            style={[styles.sendButton, dynamicStyles.sendButton]}
            onPress={onJoinGroup}
            disabled={isJoining}
          >
            {isJoining ? (
              <ActivityIndicator
                size="small"
                color={dynamicStyles.sendIcon.color}
              />
            ) : (
              <Text
                style={[
                  { fontSize: 12, fontWeight: "600" },
                  dynamicStyles.sendIcon,
                ]}
              >
                Join
              </Text>
            )}
          </Pressable>
        ) : (
          <Pressable
            style={[
              styles.sendButton,
              dynamicStyles.sendButton,
              !message.trim() && !selectedFile && { opacity: 0.5 },
            ]}
            onPress={onSend}
            disabled={!message.trim() && !selectedFile}
          >
            <Send size={20} color={dynamicStyles.sendIcon.color} />
          </Pressable>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  replyPreview: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderTopWidth: 1,
  },
  replyBar: {
    width: 3,
    height: 30,
    backgroundColor: "#007AFF",
    marginRight: 8,
    borderRadius: 1.5,
  },
  replyContent: {
    flex: 1,
  },
  replyAuthor: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  replyText: {
    fontSize: 14,
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
  filePreview: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderTopWidth: 1,
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
    fontWeight: "500",
  },
  fileSize: {
    fontSize: 12,
    marginTop: 2,
  },
  removeFile: {
    padding: 4,
  },
  inputSection: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 16,
    gap: 8,
  },
  attachButton: {
    padding: 4,
    paddingBottom: 12,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});