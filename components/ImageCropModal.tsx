import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Themedtext';
import { useTheme } from '@/contexts/ThemeContext';

interface ImageUploadModalProps {
  visible: boolean;
  imageData: {
    uri: string;
    width: number;
    height: number;
    size: number;
  } | null;
  onClose: () => void;
  onUpload: (imageUri: string) => void;
  isUploading: boolean;
}

export const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  visible,
  imageData,
  onClose,
  onUpload,
  isUploading,
}) => {
  const { isDark } = useTheme();

  const dynamicStyles = {
    modal: {
      backgroundColor: isDark ? '#0a0a0a' : '#FFFFFF',
    },
    text: {
      color: isDark ? '#FFFFFF' : '#0a0a0a',
    },
    header: {
      borderBottomColor: isDark ? '#333333' : '#E0E0E0',
    },
    cancelButton: {
      backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5',
      borderColor: isDark ? '#333333' : '#E0E0E0',
    },
    primaryButton: {
      backgroundColor: '#10B981',
    },
  };

  const handleUpload = () => {
    if (imageData) {
      onUpload(imageData.uri);
    }
  };

  const handleCancel = () => {
    if (!isUploading) {
      onClose();
    }
  };

  const formatFileSize = (bytes: number): string => {
    const kb = bytes / 1024;
    const mb = kb / 1024;
    if (mb >= 1) {
      return `${mb.toFixed(1)} MB`;
    }
    return `${kb.toFixed(0)} KB`;
  };

  if (!visible || !imageData) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <View style={[styles.container, dynamicStyles.modal]}>
        <View style={[styles.header, dynamicStyles.header]}>
          <Text style={[styles.title, dynamicStyles.text]}>Upload Image</Text>
          <Pressable
            style={styles.closeButton}
            onPress={handleCancel}
            disabled={isUploading}
          >
            <Ionicons name="close" size={24} color={dynamicStyles.text.color} />
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: imageData.uri }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.imageInfo}>
            <Text style={[styles.infoText, dynamicStyles.text]}>
              Size: {imageData.width} × {imageData.height}
            </Text>
            <Text style={[styles.infoText, dynamicStyles.text]}>
              File size: {formatFileSize(imageData.size)}
            </Text>
          </View>
        </View>

        <View style={styles.buttonsContainer}>
          <Pressable
            style={[
              styles.button,
              dynamicStyles.cancelButton,
              styles.cancelButton,
              isUploading && styles.buttonDisabled,
            ]}
            onPress={handleCancel}
            disabled={isUploading}
          >
            <Text style={[styles.buttonText, dynamicStyles.text]}>Cancel</Text>
          </Pressable>

          <Pressable
            style={[
              styles.button,
              dynamicStyles.primaryButton,
              isUploading && styles.buttonDisabled,
            ]}
            onPress={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={[styles.buttonText, { color: '#FFFFFF', marginLeft: 8 }]}>
                  Uploading...
                </Text>
              </View>
            ) : (
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                Upload
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  imageInfo: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 4,
  },
  infoText: {
    fontSize: 14,
    opacity: 0.7,
  },
  buttonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});