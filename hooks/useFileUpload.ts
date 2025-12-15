import * as DocumentPicker from 'expo-document-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Platform } from 'react-native';

interface FileData {
  data: string;
  name: string;
  size: number;
  ext: string;
}


const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};


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


const convertFileToBase64 = async (uri: string): Promise<string> => {
  try {
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


const compressImage = async (uri: string): Promise<string> => {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1920 } }],
      {
        compress: 0.9,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      }
    );
    return `data:image/jpeg;base64,${result.base64}`;
  } catch (error) {
    throw new Error('Failed to compress image');
  }
};


const generateCameraFilename = (): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `camera-photo-${timestamp}.jpg`;
};


const estimateBase64Size = (base64String: string): number => {
  const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
  return Math.floor((base64Data.length * 3) / 4);
};

export const useFileUpload = () => {
  const [selectedFile, setSelectedFile] = useState<FileData | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFile = async (file: DocumentPicker.DocumentPickerAsset): Promise<FileData> => {
    setIsProcessing(true);
    try {
      if (file.size && file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      let fileData: string;
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      if (isImageFile(file.mimeType, file.name)) {
        fileData = await compressImage(file.uri);
      } else {
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


  const processImagePickerResult = async (result: ImagePicker.ImagePickerAsset): Promise<FileData> => {
    setIsProcessing(true);
    try {
      const compressedData = await compressImage(result.uri);      
      const estimatedSize = estimateBase64Size(compressedData);
      
      if (estimatedSize > 5 * 1024 * 1024) {
        throw new Error('Image is too large. Please try a different image.');
      }

      const filename = result.fileName || generateCameraFilename();

      return {
        data: compressedData,
        name: filename,
        size: estimatedSize,
        ext: 'jpg',
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
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert(
          'Permission Required',
          'Permission to access photo library is required to select images.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const processedFile = await processImagePickerResult(result.assets[0]);
        setSelectedFile(processedFile);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to select image';
      Alert.alert('Error', errorMessage);
      console.error('Image selection error:', error);
    }
  };

  const selectImageFromCamera = async () => {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      
      if (cameraPermission.granted === false) {
        Alert.alert(
          'Camera Permission Required',
          'Permission to access camera is required to take photos.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => {
                if (Platform.OS === 'ios') {
                  ImagePicker.requestCameraPermissionsAsync();
                }
              }
            }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        base64: false, 
      });

      if (!result.canceled && result.assets[0]) {
        const processedFile = await processImagePickerResult(result.assets[0]);
        setSelectedFile(processedFile);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to take photo';
      Alert.alert('Error', errorMessage);
      console.error('Camera error:', error);
    }
  };

  const removeFile = () => {
    setSelectedFile(undefined);
  };

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
