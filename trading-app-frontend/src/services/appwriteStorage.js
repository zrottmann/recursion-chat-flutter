/**
 * Appwrite Storage Service
 * Handles file uploads, image optimization, and CDN delivery
 */

import { storage, BUCKETS, handleAppwriteError, ID, getFilePreview, getFileView } from '../lib/appwrite';

class AppwriteStorageService {
  // Image Upload for Listings
  async uploadItemImage(file, userId, listingId = null) {
    try {
      console.log('📸 Uploading item image...');
      
      // Validate file object first
      if (!file) {
        throw new Error('No file provided for upload');
      }
      
      if (!(file instanceof File)) {
        throw new Error('Invalid file object - must be a File instance');
      }
      
      if (file.size === 0) {
        throw new Error('File is empty - no content to upload');
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload JPEG, PNG, or WebP images.');
      }
      
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('File too large. Please upload images smaller than 10MB.');
      }
      
      // Generate unique file ID
      const fileId = ID.unique();
      
      // Upload file
      const uploadedFile = await storage.createFile(
        BUCKETS.itemImages,
        fileId,
        file
      );
      
      // Get file URLs
      const fileUrl = getFileView(BUCKETS.itemImages, fileId);
      const thumbnailUrl = getFilePreview(BUCKETS.itemImages, fileId, 300, 300, 85);
      const previewUrl = getFilePreview(BUCKETS.itemImages, fileId, 800, 600, 90);
      
      console.log('✅ Item image uploaded:', fileId);
      
      return {
        file: uploadedFile,
        fileId: fileId,
        url: fileUrl,
        thumbnailUrl: thumbnailUrl,
        previewUrl: previewUrl,
        filename: file.name,
        size: file.size,
        mimeType: file.type,
        success: true
      };
      
    } catch (error) {
      console.error('❌ Upload item image failed:', error);
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  // Profile Image Upload
  async uploadProfileImage(file, userId) {
    try {
      console.log('👤 Uploading profile image...');
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload JPEG, PNG, or WebP images.');
      }
      
      // Validate file size (max 5MB for profiles)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('File too large. Please upload images smaller than 5MB.');
      }
      
      // Use consistent file ID for profiles (allows easy replacement)
      const fileId = `profile_${userId}`;
      
      // Delete existing profile image if it exists
      try {
        await storage.deleteFile(BUCKETS.profileImages, fileId);
        console.log('🗑️ Deleted existing profile image');
      } catch (deleteError) {
        // File doesn't exist, that's fine
        console.log('ℹ️ No existing profile image to delete');
      }
      
      // Upload new file
      const uploadedFile = await storage.createFile(
        BUCKETS.profileImages,
        fileId,
        file
      );
      
      // Get file URLs
      const fileUrl = getFileView(BUCKETS.profileImages, fileId);
      const thumbnailUrl = getFilePreview(BUCKETS.profileImages, fileId, 150, 150, 85);
      const avatarUrl = getFilePreview(BUCKETS.profileImages, fileId, 64, 64, 80);
      
      console.log('✅ Profile image uploaded:', fileId);
      
      return {
        file: uploadedFile,
        fileId: fileId,
        url: fileUrl,
        thumbnailUrl: thumbnailUrl,
        avatarUrl: avatarUrl,
        filename: file.name,
        size: file.size,
        mimeType: file.type,
        success: true
      };
      
    } catch (error) {
      console.error('❌ Upload profile image failed:', error);
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  // Delete File
  async deleteFile(bucketId, fileId) {
    try {
      console.log('🗑️ Deleting file:', fileId);
      
      await storage.deleteFile(bucketId, fileId);
      
      console.log('✅ File deleted successfully');
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Delete file failed:', error);
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  // Delete Item Images
  async deleteItemImages(fileIds) {
    try {
      console.log('🗑️ Deleting item images:', fileIds);
      
      const deletePromises = fileIds.map(fileId =>
        this.deleteFile(BUCKETS.itemImages, fileId)
      );
      
      const results = await Promise.all(deletePromises);
      
      const successCount = results.filter(r => r.success).length;
      const errors = results.filter(r => !r.success).map(r => r.error);
      
      console.log(`✅ Deleted ${successCount}/${fileIds.length} images`);
      
      return {
        deleted_count: successCount,
        total_count: fileIds.length,
        errors: errors,
        success: successCount > 0
      };
      
    } catch (error) {
      console.error('❌ Delete item images failed:', error);
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  // Get File Info
  async getFileInfo(bucketId, fileId) {
    try {
      const file = await storage.getFile(bucketId, fileId);
      
      return {
        file,
        success: true
      };
      
    } catch (error) {
      console.error('❌ Get file info failed:', error);
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  // Generate File URLs
  getImageUrls(bucketId, fileId, options = {}) {
    try {
      const {
        thumbnail = { width: 300, height: 300, quality: 85 },
        preview = { width: 800, height: 600, quality: 90 },
        avatar = { width: 64, height: 64, quality: 80 }
      } = options;
      
      return {
        original: getFileView(bucketId, fileId),
        thumbnail: getFilePreview(
          bucketId,
          fileId,
          thumbnail.width,
          thumbnail.height,
          thumbnail.quality
        ),
        preview: getFilePreview(
          bucketId,
          fileId,
          preview.width,
          preview.height,
          preview.quality
        ),
        avatar: getFilePreview(
          bucketId,
          fileId,
          avatar.width,
          avatar.height,
          avatar.quality
        )
      };
      
    } catch (error) {
      console.error('❌ Generate image URLs failed:', error);
      return null;
    }
  }

  // List User Files
  async listUserFiles(userId, bucketId = null) {
    try {
      const bucketsToCheck = bucketId ? [bucketId] : Object.values(BUCKETS);
      const allFiles = [];
      
      for (const bucket of bucketsToCheck) {
        try {
          const files = await storage.listFiles(bucket);
          
          // Filter files that belong to this user (based on naming convention)
          const userFiles = files.files
            .filter(file => {
              // Check if file belongs to user based on metadata or naming
              return (
                file.name.includes(`user_${userId}_`) ||
                file.$id.includes(`profile_${userId}`) ||
                (file.metadata && file.metadata.user_id === userId)
              );
            })
            .map(file => ({
              ...file,
              bucketId: bucket,
              urls: this.getImageUrls(bucket, file.$id)
            }));
          
          allFiles.push(...userFiles);
          
        } catch (bucketError) {
          console.warn(`❌ Failed to list files in bucket ${bucket}:`, bucketError);
        }
      }
      
      return {
        files: allFiles,
        success: true
      };
      
    } catch (error) {
      console.error('❌ List user files failed:', error);
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  // Get Storage Usage Stats
  async getStorageUsage(userId) {
    try {
      const userFilesResult = await this.listUserFiles(userId);
      
      if (!userFilesResult.success) {
        throw new Error('Failed to get user files');
      }
      
      const files = userFilesResult.files;
      
      const usage = {
        total_files: files.length,
        total_size_bytes: files.reduce((sum, file) => sum + (file.sizeOriginal || 0), 0),
        profile_images: files.filter(f => f.bucketId === BUCKETS.profileImages).length,
        item_images: files.filter(f => f.bucketId === BUCKETS.itemImages).length,
        total_size_mb: files.reduce((sum, file) => sum + (file.sizeOriginal || 0), 0) / 1024 / 1024
      };
      
      return {
        usage,
        success: true
      };
      
    } catch (error) {
      console.error('❌ Get storage usage failed:', error);
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  // Batch Upload for Multiple Images
  async uploadMultipleImages(files, userId, listingId = null, bucketType = 'item') {
    try {
      console.log(`📸 Uploading ${files.length} images...`);
      
      // Validate file count
      const maxFiles = bucketType === 'item' ? 10 : 1;
      if (files.length > maxFiles) {
        throw new Error(`Maximum ${maxFiles} files allowed`);
      }
      
      // Upload files in parallel
      const uploadPromises = files.map(file => {
        if (bucketType === 'item') {
          return this.uploadItemImage(file, userId, listingId);
        } else {
          return this.uploadProfileImage(file, userId);
        }
      });
      
      const results = await Promise.all(uploadPromises);
      
      // Separate successful and failed uploads
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      
      console.log(`✅ Uploaded ${successful.length}/${files.length} images successfully`);
      
      return {
        successful: successful,
        failed: failed,
        total_uploaded: successful.length,
        total_failed: failed.length,
        success: successful.length > 0
      };
      
    } catch (error) {
      console.error('❌ Multiple upload failed:', error);
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  // Image Optimization Helpers
  async compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          // Calculate new dimensions
          let { width, height } = img;
          
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
          }
          
          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              resolve(new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              }));
            },
            'image/jpeg',
            quality
          );
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
        
      } catch (error) {
        reject(error);
      }
    });
  }

  // Validate Image File
  validateImageFile(file, maxSize = 10 * 1024 * 1024) {
    const errors = [];
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      errors.push('Invalid file type. Please upload JPEG, PNG, or WebP images.');
    }
    
    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / 1024 / 1024;
      errors.push(`File too large. Please upload images smaller than ${maxSizeMB}MB.`);
    }
    
    // Check if file is actually an image
    if (!file.type.startsWith('image/')) {
      errors.push('Selected file is not an image.');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Create Image Thumbnail URL
  createThumbnailUrl(bucketId, fileId, size = 150) {
    return getFilePreview(bucketId, fileId, size, size, 85);
  }

  // Create Responsive Image URLs
  createResponsiveUrls(bucketId, fileId) {
    return {
      small: getFilePreview(bucketId, fileId, 300, 200, 85),
      medium: getFilePreview(bucketId, fileId, 600, 400, 85),
      large: getFilePreview(bucketId, fileId, 1200, 800, 90),
      original: getFileView(bucketId, fileId)
    };
  }
}

// Create and export singleton instance
const appwriteStorage = new AppwriteStorageService();

export default appwriteStorage;