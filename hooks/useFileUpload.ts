// import { useState, useCallback } from 'react';
// import * as ImagePicker from 'expo-image-picker';
// import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
// import { MessageFile } from '../types/groups';

// interface UseFileUploadOptions {
//   maxSizeMB?: number;
//   quality?: number;
//   allowsEditing?: boolean;
// }

// interface UseFileUploadReturn {
//   selectedFile: MessageFile | null;
//   isLoading: boolean;
//   error: string | null;
//   selectImage: () => Promise<void>;
//   selectImageFromCamera: () => Promise<void>;
//   removeFile: () => void;
//   clearError: () => void;
// }

// export const useFileUpload = ({
//   maxSizeMB = 5,
//   quality = 0.8,
//   allowsEditing = true,
// }: UseFileUploadOptions = {}): UseFileUploadReturn => {
//   const [selectedFile, setSelectedFile] = useState<MessageFile | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   // Request permissions
//   const requestPermissions = async () => {
//     const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
//     const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
//     if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
//       throw new Error('Camera and photo library permissions are required');
//     }
//   };

//   // Convert bytes to base64
//   const convertToBase64 = async (uri: string): Promise<string> => {
//     const response = await fetch(uri);
//     const blob = await response.blob();
    
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         if (typeof reader.result === 'string') {
//           resolve(reader.result);
//         } else {
//           reject(new Error('Failed to convert image to base64'));
//         }
//       };
//       reader.onerror = reject;
//       reader.readAsDataURL(blob);
//     });
//   };

//   // Compress image if needed
//   const compressImage = async (uri: string, originalSize: number): Promise<string> => {
//     const maxSizeBytes = maxSizeMB * 1024 * 1024;
    
//     if (originalSize <= maxSizeBytes) {
//       return uri; // No compression needed
//     }

//     // Calculate compression ratio
//     const compressionRatio = Math.sqrt(maxSizeBytes / originalSize);
//     const newWidth = Math.floor(1024 * compressionRatio); // Base width of 1024px
    
//     try {
//       const manipulatedImage = await manipulateAsync(
//         uri,
//         [
//           { resize: { width: newWidth } }
//         ],
//         {
//           compress: quality,
//           format: SaveFormat.JPEG,
//         }
//       );
      
//       return manipulatedImage.uri;
//     } catch (err) {
//       console.warn('Image compression failed, using original:', err);
//       return uri;
//     }
//   };

//   // Process selected image
//   const processImage = async (result: ImagePicker.ImagePickerResult) => {
//     if (result.canceled || !result.assets || result.assets.length === 0) {
//       return;
//     }

//     const asset = result.assets[0];
//     setIsLoading(true);
//     setError(null);

//     try {
//       // Compress image if necessary
//       const processedUri = await compressImage(asset.uri, asset.fileSize || 0);
      
//       // Convert to base64
//       const base64Data = await convertToBase64(processedUri);
      
//       // Extract file info
//       const fileName = asset.fileName || `image_${Date.now()}.jpg`;
//       const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'jpg';
      
//       // Get final file size
//       const response = await fetch(processedUri);
//       const blob = await response.blob();
//       const finalSize = blob.size;
      
//       const fileData: MessageFile = {
//         name: fileName,
//         size: finalSize,
//         data: base64Data,
//         ext: fileExtension,
//       };
      
//       setSelectedFile(fileData);
//     } catch (err) {
//       console.error('Error processing image:', err);
//       setError(err instanceof Error ? err.message : 'Failed to process image');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Select image from gallery
//   const selectImage = useCallback(async () => {
//     try {
//       await requestPermissions();
      
//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         allowsEditing,
//         aspect: allowsEditing ? [1, 1] : undefined,
//         quality,
//         base64: false, // We'll handle base64 conversion manually for better control
//       });
      
//       await processImage(result);
//     } catch (err) {
//       console.error('Error selecting image:', err);
//       setError(err instanceof Error ? err.message : 'Failed to select image');
//     }
//   }, [allowsEditing, quality]);

//   // Select image from camera
//   const selectImageFromCamera = useCallback(async () => {
//     try {
//       await requestPermissions();
      
//       const result = await ImagePicker.launchCameraAsync({
//         allowsEditing,
//         aspect: allowsEditing ? [1, 1] : undefined,
//         quality,
//         base64: false,
//       });
      
//       await processImage(result);
//     } catch (err) {
//       console.error('Error taking photo:', err);
//       setError(err instanceof Error ? err.message : 'Failed to take photo');
//     }
//   }, [allowsEditing, quality]);

//   // Remove selected file
//   const removeFile = useCallback(() => {
//     setSelectedFile(null);
//     setError(null);
//   }, []);

//   // Clear error
//   const clearError = useCallback(() => {
//     setError(null);
//   }, []);

//   return {
//     selectedFile,
//     isLoading,
//     error,
//     selectImage,
//     selectImageFromCamera,
//     removeFile,
//     clearError,
//   };
// };


// // Utility function to format file size
// export const formatFileSize = (bytes: number): string => {
//   if (bytes === 0) return '0 B';
  
//   const k = 1024;
//   const sizes = ['B', 'KB', 'MB', 'GB'];
//   const i = Math.floor(Math.log(bytes) / Math.log(k));
  
//   return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
// };

// // Utility function to check if file is valid image
// export const isValidImageFile = (file: MessageFile): boolean => {
//   const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
//   return validExtensions.includes(file.ext.toLowerCase());
// };





import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Alert } from 'react-native';
import { formatFileSize, isValidFileType } from '@/utils/timeUtils';

interface FileData {
  data: string;
  name: string;
  size: number;
  ext: string;
}

export const useFileUpload = () => {
  const [selectedFile, setSelectedFile] = useState<FileData | undefined>(undefined);
  const [isCompressing, setIsCompressing] = useState(false);

  const compressImage = async (uri: string): Promise<string> => {
    setIsCompressing(true);
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width: 1024,
              height: 1024,
            },
          },
        ],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );
      return `data:image/jpeg;base64,${result.base64}`;
    } catch (error) {
      throw new Error('Failed to compress image');
    } finally {
      setIsCompressing(false);
    }
  };

  const selectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        
        // Check file size (5MB limit like web app)
        if (file.size && file.size > 5 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Please select a file smaller than 5MB');
          return;
        }

        // Check file type
        if (!isValidFileType(file.name)) {
          Alert.alert('Invalid File Type', 'Please select an image or PDF file');
          return;
        }

        let fileData: string;
        
        // If it's an image, compress it
        if (file.mimeType?.startsWith('image/')) {
          fileData = await compressImage(file.uri);
        } else {
          // For PDFs and other files, convert to base64
          const response = await fetch(file.uri);
          const blob = await response.blob();
          const reader = new FileReader();
          
          fileData = await new Promise((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(blob);
          });
        }

        const extension = file.name.split('.').pop()?.toLowerCase() || '';
        
        setSelectedFile({
          data: fileData,
          name: file.name,
          size: file.size || 0,
          ext: extension,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select file. Please try again.');
      console.error('File selection error:', error);
    }
  };

  const selectImage = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        
        if (file.size && file.size > 5 * 1024 * 1024) {
          Alert.alert('Image Too Large', 'Please select an image smaller than 5MB');
          return;
        }

        const compressedData = await compressImage(file.uri);
        const extension = file.name.split('.').pop()?.toLowerCase() || '';
        
        setSelectedFile({
          data: compressedData,
          name: file.name,
          size: file.size || 0,
          ext: extension,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image. Please try again.');
      console.error('Image selection error:', error);
    }
  };

  const selectImageFromCamera = async () => {
    // This would use expo-image-picker for camera functionality
    // For now, we'll use the same file picker
    await selectImage();
  };

  const removeFile = () => {
    setSelectedFile(undefined);
  };

  return {
    selectedFile,
    isCompressing,
    selectFile,
    selectImage,
    selectImageFromCamera,
    removeFile,
  };
};