import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Alert, Platform } from 'react-native';

interface FileData {
  data: string;
  name: string;
  size: number;
  ext: string;
}

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function to validate file types (basic validation)
const isValidFileType = (fileName: string): boolean => {
  const validExtensions = [
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp',
    'pdf', 'doc', 'docx', 'txt', 'rtf',
    'xls', 'xlsx', 'ppt', 'pptx',
    'mp3', 'wav', 'mp4', 'mov', 'avi'
  ];
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension ? validExtensions.includes(extension) : false;
};

// Helper function to check if file is an image
const isImageFile = (mimeType?: string, fileName?: string): boolean => {
  if (mimeType) {
    return mimeType.startsWith('image/');
  }
  if (fileName) {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension || '');
  }
  return false;
};

// Helper function to convert file to base64 using fetch + FileReader
const convertFileToBase64 = async (uri: string): Promise<string> => {
  try {
    // Fix URI for Android if needed
    let finalUri = uri;
    if (Platform.OS === 'android' && uri.startsWith('/')) {
      finalUri = `file://${uri}`;
    }

    const response = await fetch(finalUri);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status}`);
    }

    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          resolve(reader.result as string);
        } else {
          reject(new Error('Failed to read file as base64'));
        }
      };
      reader.onerror = () => reject(new Error('FileReader error'));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw new Error(`File conversion failed: ${error}`);
  }
};

// Helper function to compress images
const compressImage = async (uri: string): Promise<string> => {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1024, height: 1024 } }],
      {
        compress: 0.7,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      }
    );
    return `data:image/jpeg;base64,${result.base64}`;
  } catch (error) {
    throw new Error('Failed to compress image');
  }
};

export const useFileUpload = () => {
  const [selectedFile, setSelectedFile] = useState<FileData | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFile = async (file: DocumentPicker.DocumentPickerAsset): Promise<FileData> => {
    setIsProcessing(true);
    try {
      // Validate file size (5MB limit)
      if (file.size && file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      // Validate file type (optional - remove if you want to allow all types)
      if (!isValidFileType(file.name)) {
        throw new Error('File type not supported');
      }

      let fileData: string;
      const extension = file.name.split('.').pop()?.toLowerCase() || '';

      // Handle images with compression
      if (isImageFile(file.mimeType, file.name)) {
        fileData = await compressImage(file.uri);
      } else {
        // Handle all other files with fetch + FileReader
        fileData = await convertFileToBase64(file.uri);
      }

      return {
        data: fileData,
        name: file.name,
        size: file.size || 0,
        ext: extension,
      };
    } finally {
      setIsProcessing(false);
    }
  };

  const selectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets[0]) {
        const processedFile = await processFile(result.assets[0]);
        setSelectedFile(processedFile);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to select file';
      Alert.alert('Error', errorMessage);
      console.error('File selection error:', error);
    }
  };

  const selectImage = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets[0]) {
        const processedFile = await processFile(result.assets[0]);
        setSelectedFile(processedFile);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to select image';
      Alert.alert('Error', errorMessage);
      console.error('Image selection error:', error);
    }
  };

  const selectImageFromCamera = async () => {
    // For now, fallback to image picker since camera requires expo-image-picker
    // You can implement camera functionality later with expo-image-picker
    Alert.alert(
      'Camera',
      'Camera functionality requires expo-image-picker. Using gallery instead.',
      [{ text: 'OK', onPress: selectImage }]
    );
  };

  const removeFile = () => {
    setSelectedFile(undefined);
  };

  // Utility function to get file info for display
  const getFileInfo = () => {
    if (!selectedFile) return null;
    
    return {
      name: selectedFile.name,
      size: formatFileSize(selectedFile.size),
      extension: selectedFile.ext,
      isImage: isImageFile(undefined, selectedFile.name),
    };
  };

  return {
    selectedFile,
    isProcessing,
    selectFile,
    selectImage,
    selectImageFromCamera,
    removeFile,
    getFileInfo,
  };
};