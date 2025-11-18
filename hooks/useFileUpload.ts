
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
      // const result = await DocumentPicker.getDocumentAsync({
      //   type: ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '*/*'],
      //   copyToCacheDirectory: true,
      // });

      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        
        // Check file size (5MB limit like web app)
        if (file.size && file.size > 5 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Please select a file smaller than 5MB');
          return;
        }

        // // Check file type
        // if (!isValidFileType(file.name)) {
        //   Alert.alert('Invalid File Type', 'Please select an image or PDF file');
        //   return;
        // }

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