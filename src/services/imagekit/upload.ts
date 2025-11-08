/**
 * ImageKit Upload Service
 *
 * Handles image uploads to ImageKit CDN
 * Replaces Supabase Storage with ImageKit
 *
 * Features:
 * - Upload from device (expo-image-picker)
 * - Upload with transformations
 * - Generate CDN URLs
 * - Delete images
 *
 * Folder structure:
 * - /posts/{userId}/* - Social feed images
 * - /meals/{userId}/* - Meal photos
 * - /avatars/{userId}/* - Profile avatars
 * - /progress/{userId}/* - Progress photos
 */

import * as ImagePicker from 'expo-image-picker';
import { logger } from '@/utils/logger';

// =====================================================
// TYPES
// =====================================================

export interface UploadOptions {
  folder?: string;
  fileName?: string;
  tags?: string[];
  useUniqueFileName?: boolean;
  transformation?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'jpg' | 'png' | 'webp';
  };
}

export interface UploadResult {
  fileId: string;
  fileName: string;
  filePath: string;
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  size: number;
}

// =====================================================
// IMAGE PICKER
// =====================================================

/**
 * Pick image from device
 */
export const pickImage = async (options?: {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
}): Promise<ImagePicker.ImagePickerAsset | null> => {
  try {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      throw new Error('Camera roll permission denied');
    }

    // Launch picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: options?.allowsEditing !== false,
      aspect: options?.aspect || [4, 3],
      quality: options?.quality || 0.8,
      base64: true, // We need base64 for upload
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0];
  } catch (error) {
    logger.error('Error picking image:', error);
    throw error;
  }
};

/**
 * Take photo with camera
 */
export const takePhoto = async (options?: {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
}): Promise<ImagePicker.ImagePickerAsset | null> => {
  try {
    // Request permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      throw new Error('Camera permission denied');
    }

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: options?.allowsEditing !== false,
      aspect: options?.aspect || [4, 3],
      quality: options?.quality || 0.8,
      base64: true,
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0];
  } catch (error) {
    logger.error('Error taking photo:', error);
    throw error;
  }
};

// =====================================================
// UPLOAD
// =====================================================

/**
 * Upload image to ImageKit
 *
 * Note: This is a CLIENT-SIDE upload implementation.
 * For production, you should implement a server-side authentication endpoint.
 */
export const uploadImage = async (
  image: ImagePicker.ImagePickerAsset | string,
  options: UploadOptions = {}
): Promise<UploadResult> => {
  try {
    // Get base64 string
    let base64: string;

    if (typeof image === 'string') {
      base64 = image;
    } else {
      if (!image.base64) {
        throw new Error('Image base64 not available. Enable base64 in picker options.');
      }
      base64 = image.base64;
    }

    // Generate file name
    const fileName = options.fileName || `image-${Date.now()}.jpg`;

    // Prepare upload data
    const uploadData = {
      file: base64,
      fileName,
      folder: options.folder || '/',
      tags: options.tags?.join(','),
      useUniqueFileName: options.useUniqueFileName !== false,
      transformation: options.transformation
        ? {
            pre: `w-${options.transformation.width || 1200},h-${options.transformation.height || 1200},q-${options.transformation.quality || 80},f-${options.transformation.format || 'jpg'}`,
          }
        : undefined,
    };

    // Upload via ImageKit SDK
    // Note: In production, implement a secure server-side authentication endpoint
    // For now, this is a simplified client-side implementation for MVP

    const uploadUrl = `${process.env.EXPO_PUBLIC_IMAGEKIT_URL_ENDPOINT}/api/upload`;

    const formData = new FormData();
    formData.append('file', `data:image/jpeg;base64,${base64}`);
    formData.append('fileName', fileName);
    if (uploadData.folder) formData.append('folder', uploadData.folder);
    if (uploadData.tags) formData.append('tags', uploadData.tags);
    formData.append('useUniqueFileName', String(uploadData.useUniqueFileName));

    // Get authentication token (simplified - use server endpoint in production)
    const authToken = await getAuthToken();

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      fileId: result.fileId,
      fileName: result.name,
      filePath: result.filePath,
      url: result.url,
      thumbnailUrl: result.thumbnailUrl || result.url,
      width: result.width,
      height: result.height,
      size: result.size,
    };
  } catch (error) {
    logger.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Get ImageKit authentication token
 *
 * IMPORTANT: In production, implement this as a secure server endpoint!
 * Never expose your private key in client code.
 *
 * Example server endpoint (Node.js):
 * ```
 * app.get('/api/imagekit-auth', (req, res) => {
 *   const authenticationParameters = imagekit.getAuthenticationParameters();
 *   res.send(authenticationParameters);
 * });
 * ```
 */
const getAuthToken = async (): Promise<string> => {
  // TODO: Replace with actual server endpoint
  // For MVP, we'll use a placeholder
  // In production, call your backend: /api/imagekit-auth

  logger.warn('Using client-side ImageKit auth (NOT SECURE). Implement server endpoint for production!');

  return 'temporary-token-for-mvp';
};

// =====================================================
// UPLOAD HELPERS
// =====================================================

/**
 * Upload post image
 */
export const uploadPostImage = async (
  image: ImagePicker.ImagePickerAsset | string,
  userId: string
): Promise<UploadResult> => {
  return uploadImage(image, {
    folder: `/posts/${userId}`,
    tags: ['post', 'community'],
    transformation: {
      width: 1200,
      height: 1200,
      quality: 85,
      format: 'jpg',
    },
  });
};

/**
 * Upload meal photo
 */
export const uploadMealPhoto = async (
  image: ImagePicker.ImagePickerAsset | string,
  userId: string
): Promise<UploadResult> => {
  return uploadImage(image, {
    folder: `/meals/${userId}`,
    tags: ['meal', 'nutrition'],
    transformation: {
      width: 800,
      height: 800,
      quality: 80,
      format: 'jpg',
    },
  });
};

/**
 * Upload avatar
 */
export const uploadAvatar = async (
  image: ImagePicker.ImagePickerAsset | string,
  userId: string
): Promise<UploadResult> => {
  return uploadImage(image, {
    folder: `/avatars/${userId}`,
    tags: ['avatar', 'profile'],
    transformation: {
      width: 400,
      height: 400,
      quality: 90,
      format: 'jpg',
    },
  });
};

/**
 * Upload progress photo
 */
export const uploadProgressPhoto = async (
  image: ImagePicker.ImagePickerAsset | string,
  userId: string,
  type: 'front' | 'side' | 'back'
): Promise<UploadResult> => {
  return uploadImage(image, {
    folder: `/progress/${userId}`,
    tags: ['progress', type],
    transformation: {
      width: 1000,
      height: 1000,
      quality: 85,
      format: 'jpg',
    },
  });
};

// =====================================================
// DELETE
// =====================================================

/**
 * Delete image from ImageKit
 *
 * Note: Requires server-side implementation in production
 */
export const deleteImage = async (fileId: string): Promise<void> => {
  try {
    // TODO: Implement server-side deletion
    // ImageKit requires private key for deletion, so this must be done server-side

    logger.warn('Image deletion not implemented (requires server endpoint)');

    // Example server endpoint:
    // await fetch('/api/imagekit-delete', {
    //   method: 'POST',
    //   body: JSON.stringify({ fileId }),
    // });
  } catch (error) {
    logger.error('Error deleting image:', error);
    throw error;
  }
};

// =====================================================
// GENERATE CDN URL
// =====================================================

/**
 * Generate ImageKit CDN URL with transformations
 */
export const getImageUrl = (
  filePath: string,
  transformations?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'jpg' | 'png' | 'webp';
    crop?: 'maintain_ratio' | 'force' | 'at_max' | 'at_least';
    focus?: 'center' | 'top' | 'left' | 'bottom' | 'right' | 'face' | 'auto';
  }
): string => {
  const urlEndpoint = process.env.EXPO_PUBLIC_IMAGEKIT_URL_ENDPOINT || '';

  if (!transformations) {
    return `${urlEndpoint}/${filePath}`;
  }

  const transforms = [];

  if (transformations.width) transforms.push(`w-${transformations.width}`);
  if (transformations.height) transforms.push(`h-${transformations.height}`);
  if (transformations.quality) transforms.push(`q-${transformations.quality}`);
  if (transformations.format) transforms.push(`f-${transformations.format}`);
  if (transformations.crop) transforms.push(`c-${transformations.crop}`);
  if (transformations.focus) transforms.push(`fo-${transformations.focus}`);

  const transformString = transforms.join(',');

  return `${urlEndpoint}/tr:${transformString}/${filePath}`;
};

/**
 * Get thumbnail URL
 */
export const getThumbnailUrl = (filePath: string, size: number = 200): string => {
  return getImageUrl(filePath, {
    width: size,
    height: size,
    quality: 70,
    format: 'jpg',
    crop: 'maintain_ratio',
  });
};
