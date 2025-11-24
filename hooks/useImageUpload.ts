import { useState } from 'react';
import ImageCropPicker, { ImageOrVideo, Options } from 'react-native-image-crop-picker';
import { Alert, Platform } from 'react-native';

interface ProcessedImageResult {
  uri: string;
  width: number;
  height: number;
  size: number;
}

export const useImageUpload = () => {
  const [isLoading, setIsLoading] = useState(false);

  const showImageSourceOptions = (): Promise<'camera' | 'library' | null> => {
    return new Promise((resolve) => {
      Alert.alert(
        'Select Image Source',
        'Choose how you want to select an image',
        [
          {
            text: 'Camera',
            onPress: () => resolve('camera'),
          },
          {
            text: 'Photo Library',
            onPress: () => resolve('library'),
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(null),
          },
        ]
      );
    });
  };

  const cropperOptions: Options = {
    width: 400,
    height: 400,
    cropping: true,
    includeBase64: false,
    compressImageMaxWidth: 400,
    compressImageMaxHeight: 400,
    compressImageQuality: 0.8,
    mediaType: 'photo',
    includeExif: false,
    freeStyleCropEnabled: false,
    showCropGuidelines: true,
    showCropFrame: true,
    hideBottomControls: false,
    enableRotationGesture: true,
  };

  const selectAndProcessImage = async (): Promise<ProcessedImageResult | null> => {
    try {
      setIsLoading(true);

      const source = await showImageSourceOptions();
      if (!source) {
        return null;
      }

      let result: ImageOrVideo;

      if (source === 'camera') {
        result = await ImageCropPicker.openCamera(cropperOptions);
      } else {
        result = await ImageCropPicker.openPicker(cropperOptions);
      }

      if ('cancelled' in result && result.cancelled) {
        return null;
      }

      const imageResult = result as ImageOrVideo;

      return {
        uri: imageResult.path,
        width: imageResult.width,
        height: imageResult.height,
        size: imageResult.size,
      };

    } catch (error: any) {
      console.error('Error selecting/processing image:', error);
      
      if (error.code === 'E_PICKER_CANCELLED') {
        return null;
      }
      
      if (error.code === 'E_NO_CAMERA_PERMISSION' || error.code === 'E_NO_LIBRARY_PERMISSION') {
        Alert.alert(
          'Permission Required',
          'Please enable camera and photo library permissions in your device settings.',
          [{ text: 'OK' }]
        );
        return null;
      }

      Alert.alert('Error', 'Failed to select image. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const cleanupImageCache = () => {
    ImageCropPicker.clean()
      .then(() => {
        console.log('Removed all tmp images from tmp directory');
      })
      .catch((e) => {
        console.log('Failed to clean image cache:', e);
      });
  };

  return {
    selectAndProcessImage,
    isLoading,
    cleanupImageCache,
  };
};