import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { MessageFile } from '../types/groups';

interface UseFileUploadOptions {
  maxSizeMB?: number;
  quality?: number;
  allowsEditing?: boolean;
}

interface UseFileUploadReturn {
  selectedFile: MessageFile | null;
  isLoading: boolean;
  error: string | null;
  selectImage: () => Promise<void>;
  selectImageFromCamera: () => Promise<void>;
  removeFile: () => void;
  clearError: () => void;
}

export const useFileUpload = ({
  maxSizeMB = 5,
  quality = 0.8,
  allowsEditing = true,
}: UseFileUploadOptions = {}): UseFileUploadReturn => {
  const [selectedFile, setSelectedFile] = useState<MessageFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Request permissions
  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      throw new Error('Camera and photo library permissions are required');
    }
  };

  // Convert bytes to base64
  const convertToBase64 = async (uri: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert image to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Compress image if needed
  const compressImage = async (uri: string, originalSize: number): Promise<string> => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    
    if (originalSize <= maxSizeBytes) {
      return uri; // No compression needed
    }

    // Calculate compression ratio
    const compressionRatio = Math.sqrt(maxSizeBytes / originalSize);
    const newWidth = Math.floor(1024 * compressionRatio); // Base width of 1024px
    
    try {
      const manipulatedImage = await manipulateAsync(
        uri,
        [
          { resize: { width: newWidth } }
        ],
        {
          compress: quality,
          format: SaveFormat.JPEG,
        }
      );
      
      return manipulatedImage.uri;
    } catch (err) {
      console.warn('Image compression failed, using original:', err);
      return uri;
    }
  };

  // Process selected image
  const processImage = async (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }

    const asset = result.assets[0];
    setIsLoading(true);
    setError(null);

    try {
      // Compress image if necessary
      const processedUri = await compressImage(asset.uri, asset.fileSize || 0);
      
      // Convert to base64
      const base64Data = await convertToBase64(processedUri);
      
      // Extract file info
      const fileName = asset.fileName || `image_${Date.now()}.jpg`;
      const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'jpg';
      
      // Get final file size
      const response = await fetch(processedUri);
      const blob = await response.blob();
      const finalSize = blob.size;
      
      const fileData: MessageFile = {
        name: fileName,
        size: finalSize,
        data: base64Data,
        ext: fileExtension,
      };
      
      setSelectedFile(fileData);
    } catch (err) {
      console.error('Error processing image:', err);
      setError(err instanceof Error ? err.message : 'Failed to process image');
    } finally {
      setIsLoading(false);
    }
  };

  // Select image from gallery
  const selectImage = useCallback(async () => {
    try {
      await requestPermissions();
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing,
        aspect: allowsEditing ? [1, 1] : undefined,
        quality,
        base64: false, // We'll handle base64 conversion manually for better control
      });
      
      await processImage(result);
    } catch (err) {
      console.error('Error selecting image:', err);
      setError(err instanceof Error ? err.message : 'Failed to select image');
    }
  }, [allowsEditing, quality]);

  // Select image from camera
  const selectImageFromCamera = useCallback(async () => {
    try {
      await requestPermissions();
      
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing,
        aspect: allowsEditing ? [1, 1] : undefined,
        quality,
        base64: false,
      });
      
      await processImage(result);
    } catch (err) {
      console.error('Error taking photo:', err);
      setError(err instanceof Error ? err.message : 'Failed to take photo');
    }
  }, [allowsEditing, quality]);

  // Remove selected file
  const removeFile = useCallback(() => {
    setSelectedFile(null);
    setError(null);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    selectedFile,
    isLoading,
    error,
    selectImage,
    selectImageFromCamera,
    removeFile,
    clearError,
  };
};

// Utility function to format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// Utility function to check if file is valid image
export const isValidImageFile = (file: MessageFile): boolean => {
  const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  return validExtensions.includes(file.ext.toLowerCase());
};