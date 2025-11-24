import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Alert } from 'react-native';

interface ProcessedImageResult {
  uri: string;
  width: number;
  height: number;
  size?: number;
}

export const useImageUpload = () => {
  const [isLoading, setIsLoading] = useState(false);

  const requestPermissions = async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraPermission.status !== 'granted' || mediaLibraryPermission.status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please enable camera and photo library permissions in your device settings.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const showImageSourceOptions = (): Promise<'camera' | 'library' | null> => {
    return new Promise((resolve) => {
      Alert.alert(
        'Select Image Source',
        'Choose how you want to select an image',
        [
          { text: 'Camera', onPress: () => resolve('camera') },
          { text: 'Photo Library', onPress: () => resolve('library') },
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
        ]
      );
    });
  };

  const selectAndProcessImage = async (): Promise<ProcessedImageResult | null> => {
    try {
      setIsLoading(true);

      const hasPermissions = await requestPermissions();
      if (!hasPermissions) return null;

      const source = await showImageSourceOptions();
      if (!source) return null;

      let result: ImagePicker.ImagePickerResult;

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        allowsMultipleSelection: false,
      };

      result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(options)
          : await ImagePicker.launchImageLibraryAsync(options);

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];

      // 👇 **THIS IS THE IMPORTANT PART**
      const jpeg = await ImageManipulator.manipulateAsync(
        asset.uri,
        [], // no transform
        {
          compress: 0.9,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      return {
        uri: jpeg.uri,
        width: jpeg.width,
        height: jpeg.height,
      };

    } catch (error: any) {
      console.error('Error selecting/processing image:', error);

      if (error.code === 'UserCancel') return null;

      Alert.alert('Error', 'Failed to select image. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { selectAndProcessImage, isLoading };
};
