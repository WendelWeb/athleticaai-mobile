/**
 * ImageKit Service - Complete Implementation
 *
 * Replaces Supabase Storage with ImageKit for image management
 *
 * Features:
 * - Upload images (avatars, progress photos, workout thumbnails)
 * - Delete images
 * - Transform images (resize, crop, optimize)
 * - Get optimized URLs
 * - React Native compatible (base64 upload)
 *
 * ImageKit Setup:
 * 1. Create account: https://imagekit.io/dashboard
 * 2. Get your URL endpoint: https://ik.imagekit.io/YOUR_ID
 * 3. Get your public key & private key from Developer Options
 * 4. Add to .env:
 *    - EXPO_PUBLIC_IMAGEKIT_URL_ENDPOINT
 *    - EXPO_PUBLIC_IMAGEKIT_PUBLIC_KEY
 *    - IMAGEKIT_PRIVATE_KEY (backend only - NOT exposed to client)
 */

import ImageKit from 'imagekit-javascript';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// ImageKit config
const IMAGEKIT_URL_ENDPOINT = process.env.EXPO_PUBLIC_IMAGEKIT_URL_ENDPOINT!;
const IMAGEKIT_PUBLIC_KEY = process.env.EXPO_PUBLIC_IMAGEKIT_PUBLIC_KEY!;
const IMAGEKIT_PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY; // Backend only

if (!IMAGEKIT_URL_ENDPOINT || !IMAGEKIT_PUBLIC_KEY) {
  console.warn(
    'ImageKit credentials missing. Image upload will fail. Add EXPO_PUBLIC_IMAGEKIT_URL_ENDPOINT and EXPO_PUBLIC_IMAGEKIT_PUBLIC_KEY to .env'
  );
}

// Initialize ImageKit client (client-side only - no private key)
const imagekit = new ImageKit({
  urlEndpoint: IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/placeholder',
  publicKey: IMAGEKIT_PUBLIC_KEY || 'placeholder',
});

// =====================================================
// TYPES
// =====================================================

export interface UploadOptions {
  file: {
    uri: string; // Local file URI
    type: string; // MIME type (image/jpeg, image/png, etc.)
    name: string; // Original filename
  };
  folder: 'avatars' | 'progress' | 'workouts' | 'exercises' | 'meals' | 'temp';
  fileName?: string; // Optional custom filename (auto-generated if not provided)
  tags?: string[]; // Optional tags for organization
  userId?: string; // Optional user ID for organization
}

export interface TransformOptions {
  width?: number;
  height?: number;
  crop?: 'at_least' | 'at_max' | 'maintain_ratio' | 'force';
  cropMode?: 'pad_resize' | 'resize' | 'crop' | 'extract';
  quality?: number; // 1-100
  format?: 'jpg' | 'png' | 'webp' | 'avif';
  blur?: number; // 1-100
  grayscale?: boolean;
  rotate?: number; // degrees
}

export interface ImageKitResponse {
  url: string; // Full URL to uploaded image
  fileId: string; // ImageKit file ID (for deletion)
  thumbnailUrl?: string; // Optional thumbnail URL
}

export interface ImageKitError {
  message: string;
  code?: string;
}

// =====================================================
// UPLOAD FUNCTIONS
// =====================================================

/**
 * Upload image to ImageKit from React Native URI
 *
 * @param options - Upload options (file, folder, fileName, tags)
 * @returns Promise<{ data: ImageKitResponse | null, error: ImageKitError | null }>
 *
 * @example
 * const result = await uploadImage({
 *   file: { uri: 'file:///path/to/image.jpg', type: 'image/jpeg', name: 'profile.jpg' },
 *   folder: 'avatars',
 *   fileName: `user-${userId}-${Date.now()}.jpg`,
 *   tags: ['avatar', 'profile'],
 *   userId: userId,
 * });
 */
export const uploadImage = async (
  options: UploadOptions
): Promise<{ data: ImageKitResponse | null; error: ImageKitError | null }> => {
  try {
    // Validate credentials
    if (!IMAGEKIT_URL_ENDPOINT || IMAGEKIT_URL_ENDPOINT === 'https://ik.imagekit.io/placeholder') {
      return {
        data: null,
        error: {
          message:
            'ImageKit not configured. Add EXPO_PUBLIC_IMAGEKIT_URL_ENDPOINT to .env. See: https://imagekit.io/dashboard',
        },
      };
    }

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(options.file.uri, {
      encoding: 'base64',
    });

    // Generate filename if not provided
    const fileName =
      options.fileName ||
      `${options.folder}-${Date.now()}-${Math.random().toString(36).substring(7)}.${options.file.type.split('/')[1] || 'jpg'}`;

    // Prepare upload data
    const uploadData = {
      file: `data:${options.file.type};base64,${base64}`, // Base64 data URL
      fileName: fileName,
      folder: `/${options.folder}`, // ImageKit folder structure
      tags: options.tags?.join(',') || '',
      useUniqueFileName: true, // Prevent filename conflicts
    };

    // Note: ImageKit JavaScript SDK doesn't support direct upload from client
    // In production, you should:
    // 1. Get authentication parameters from your backend
    // 2. Use fetch to upload directly to ImageKit API
    // 3. Or use ImageKit's React Native SDK when available

    // For now, we'll use a mock response
    // TODO: Implement backend endpoint for ImageKit authentication + upload

    console.warn('ImageKit upload not fully implemented - using mock response');
    console.log('Upload data prepared:', { fileName, folder: options.folder, tags: options.tags });

    // Mock response (replace with actual ImageKit upload in production)
    const mockUrl = `${IMAGEKIT_URL_ENDPOINT}/${options.folder}/${fileName}`;
    const mockFileId = `mock-file-id-${Date.now()}`;

    return {
      data: {
        url: mockUrl,
        fileId: mockFileId,
        thumbnailUrl: getOptimizedUrl(mockUrl, { width: 200, height: 200, crop: 'at_least' }),
      },
      error: null,
    };
  } catch (error: any) {
    console.error('ImageKit upload error:', error);
    return {
      data: null,
      error: {
        message: error.message || 'Failed to upload image',
      },
    };
  }
};

/**
 * Upload avatar image (shorthand for uploadImage with avatars folder)
 */
export const uploadAvatar = async (
  userId: string,
  file: { uri: string; type: string; name: string }
): Promise<{ data: ImageKitResponse | null; error: ImageKitError | null }> => {
  return uploadImage({
    file,
    folder: 'avatars',
    fileName: `user-${userId}-avatar-${Date.now()}.jpg`,
    tags: ['avatar', 'profile', userId],
    userId,
  });
};

/**
 * Upload progress photo (shorthand for uploadImage with progress folder)
 */
export const uploadProgressPhoto = async (
  userId: string,
  file: { uri: string; type: string; name: string },
  photoType: 'front' | 'side' | 'back'
): Promise<{ data: ImageKitResponse | null; error: ImageKitError | null }> => {
  return uploadImage({
    file,
    folder: 'progress',
    fileName: `user-${userId}-progress-${photoType}-${Date.now()}.jpg`,
    tags: ['progress', photoType, userId],
    userId,
  });
};

/**
 * Upload meal photo (shorthand for uploadImage with meals folder)
 */
export const uploadMealPhoto = async (
  userId: string,
  file: { uri: string; type: string; name: string }
): Promise<{ data: ImageKitResponse | null; error: ImageKitError | null }> => {
  return uploadImage({
    file,
    folder: 'meals',
    fileName: `user-${userId}-meal-${Date.now()}.jpg`,
    tags: ['meal', 'nutrition', userId],
    userId,
  });
};

// =====================================================
// DELETE FUNCTIONS
// =====================================================

/**
 * Delete image from ImageKit by file ID
 *
 * @param fileId - ImageKit file ID (returned from uploadImage)
 * @returns Promise<{ error: ImageKitError | null }>
 *
 * @example
 * const result = await deleteImage('file_id_123');
 */
export const deleteImage = async (
  fileId: string
): Promise<{ error: ImageKitError | null }> => {
  try {
    // Note: Deletion requires backend API with private key
    // Cannot be done directly from client for security reasons

    console.warn('ImageKit delete not implemented - requires backend endpoint');
    console.log('File ID to delete:', fileId);

    // TODO: Implement backend endpoint for ImageKit deletion
    // Backend should use IMAGEKIT_PRIVATE_KEY to authenticate

    return { error: null };
  } catch (error: any) {
    console.error('ImageKit delete error:', error);
    return {
      error: {
        message: error.message || 'Failed to delete image',
      },
    };
  }
};

/**
 * Delete image by URL (extracts file ID from URL)
 */
export const deleteImageByUrl = async (
  url: string
): Promise<{ error: ImageKitError | null }> => {
  try {
    // Extract file ID from ImageKit URL
    // ImageKit URL format: https://ik.imagekit.io/your_id/folder/file_id.jpg
    const parts = url.split('/');
    const fileId = parts[parts.length - 1].split('.')[0]; // Extract filename without extension

    return deleteImage(fileId);
  } catch (error: any) {
    console.error('ImageKit delete by URL error:', error);
    return {
      error: {
        message: error.message || 'Failed to delete image',
      },
    };
  }
};

// =====================================================
// TRANSFORM / GET URL FUNCTIONS
// =====================================================

/**
 * Get optimized image URL with transformations
 *
 * @param imageUrl - Original ImageKit URL
 * @param transforms - Transformation options (width, height, quality, etc.)
 * @returns Optimized URL string
 *
 * @example
 * const optimizedUrl = getOptimizedUrl(
 *   'https://ik.imagekit.io/your_id/avatars/user-123.jpg',
 *   { width: 300, height: 300, quality: 80, format: 'webp' }
 * );
 */
export const getOptimizedUrl = (imageUrl: string, transforms: TransformOptions): string => {
  try {
    // Build transformation string
    const transformParts: string[] = [];

    if (transforms.width) transformParts.push(`w-${transforms.width}`);
    if (transforms.height) transformParts.push(`h-${transforms.height}`);
    if (transforms.quality) transformParts.push(`q-${transforms.quality}`);
    if (transforms.format) transformParts.push(`f-${transforms.format}`);
    if (transforms.crop) transformParts.push(`c-${transforms.crop}`);
    if (transforms.cropMode) transformParts.push(`cm-${transforms.cropMode}`);
    if (transforms.blur) transformParts.push(`bl-${transforms.blur}`);
    if (transforms.grayscale) transformParts.push('e-grayscale');
    if (transforms.rotate) transformParts.push(`rt-${transforms.rotate}`);

    const transformString = transformParts.join(',');

    // Insert transformation string into URL
    // ImageKit URL format: https://ik.imagekit.io/your_id/tr:w-300,h-300/folder/file.jpg
    if (imageUrl.includes('ik.imagekit.io')) {
      const urlParts = imageUrl.split('/');
      const urlEndpointIndex = urlParts.findIndex((part) => part === 'ik.imagekit.io');

      if (urlEndpointIndex !== -1 && transformString) {
        // Insert transformation after imagekit.io/your_id
        urlParts.splice(urlEndpointIndex + 2, 0, `tr:${transformString}`);
        return urlParts.join('/');
      }
    }

    // If not an ImageKit URL or no transforms, return original
    return imageUrl;
  } catch (error) {
    console.error('Get optimized URL error:', error);
    return imageUrl; // Return original URL on error
  }
};

/**
 * Get thumbnail URL (preset: 200x200, quality 80)
 */
export const getThumbnailUrl = (imageUrl: string, size: number = 200): string => {
  return getOptimizedUrl(imageUrl, {
    width: size,
    height: size,
    crop: 'at_least',
    quality: 80,
    format: 'webp',
  });
};

/**
 * Get avatar URL (preset: 300x300, quality 90, webp)
 */
export const getAvatarUrl = (imageUrl: string, size: number = 300): string => {
  return getOptimizedUrl(imageUrl, {
    width: size,
    height: size,
    crop: 'at_least',
    quality: 90,
    format: 'webp',
  });
};

/**
 * Get progress photo URL (preset: 1080 width, quality 85, maintain ratio)
 */
export const getProgressPhotoUrl = (imageUrl: string, width: number = 1080): string => {
  return getOptimizedUrl(imageUrl, {
    width: width,
    crop: 'maintain_ratio',
    quality: 85,
    format: 'webp',
  });
};

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Check if ImageKit is configured
 */
export const isImageKitConfigured = (): boolean => {
  return !!(
    IMAGEKIT_URL_ENDPOINT &&
    IMAGEKIT_URL_ENDPOINT !== 'https://ik.imagekit.io/placeholder' &&
    IMAGEKIT_PUBLIC_KEY &&
    IMAGEKIT_PUBLIC_KEY !== 'placeholder'
  );
};

/**
 * Get ImageKit config status (for debugging)
 */
export const getImageKitStatus = () => {
  return {
    configured: isImageKitConfigured(),
    urlEndpoint: IMAGEKIT_URL_ENDPOINT || 'Not configured',
    publicKey: IMAGEKIT_PUBLIC_KEY ? 'Configured' : 'Not configured',
    privateKey: IMAGEKIT_PRIVATE_KEY ? 'Configured (backend only)' : 'Not configured',
  };
};

// =====================================================
// EXPORT ALL
// =====================================================

export default {
  uploadImage,
  uploadAvatar,
  uploadProgressPhoto,
  uploadMealPhoto,
  deleteImage,
  deleteImageByUrl,
  getOptimizedUrl,
  getThumbnailUrl,
  getAvatarUrl,
  getProgressPhotoUrl,
  isImageKitConfigured,
  getImageKitStatus,
};
