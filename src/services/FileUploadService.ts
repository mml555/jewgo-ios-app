import { Alert } from 'react-native';
import { debugLog, errorLog } from '../utils/logger';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export class FileUploadService {
  private static instance: FileUploadService;

  public static getInstance(): FileUploadService {
    if (!FileUploadService.instance) {
      FileUploadService.instance = new FileUploadService();
    }
    return FileUploadService.instance;
  }

  /**
   * Upload a file (image or PDF) to a cloud storage service
   * For now, this returns a mock URL since we don't have cloud storage set up
   * In production, this would integrate with AWS S3, Google Cloud Storage, etc.
   */
  async uploadFile(
    fileUri: string,
    fileName: string,
    fileType: 'image' | 'pdf',
  ): Promise<UploadResult> {
    try {
      debugLog(`📤 Uploading file: ${fileName} (${fileType})`);

      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate mock URL based on file type and name
      const mockUrl = this.generateMockUrl(fileName, fileType);

      debugLog(`✅ File uploaded successfully: ${mockUrl}`);

      return {
        success: true,
        url: mockUrl,
      };
    } catch (error) {
      errorLog('❌ File upload failed:', error);
      return {
        success: false,
        error: 'Failed to upload file',
      };
    }
  }

  /**
   * Upload profile image
   */
  async uploadProfileImage(
    fileUri: string,
    fileName: string,
  ): Promise<UploadResult> {
    return this.uploadFile(fileUri, fileName, 'image');
  }

  /**
   * Upload resume PDF
   */
  async uploadResume(fileUri: string, fileName: string): Promise<UploadResult> {
    return this.uploadFile(fileUri, fileName, 'pdf');
  }

  /**
   * Generate mock URL for development/testing
   * In production, this would be the actual cloud storage URL
   */
  private generateMockUrl(fileName: string, fileType: 'image' | 'pdf'): string {
    const baseUrl = 'https://mock-storage.jewgo.com';
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();

    if (fileType === 'image') {
      return `${baseUrl}/images/${timestamp}_${sanitizedFileName}`;
    } else {
      return `${baseUrl}/documents/${timestamp}_${sanitizedFileName}`;
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(
    fileUri: string,
    fileName: string,
    fileType: 'image' | 'pdf',
  ): {
    isValid: boolean;
    error?: string;
  } {
    // Check file extension
    const extension = fileName.split('.').pop()?.toLowerCase();

    if (fileType === 'image') {
      const validImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      if (!extension || !validImageExtensions.includes(extension)) {
        return {
          isValid: false,
          error: 'Please select a valid image file (JPG, PNG, GIF, WebP)',
        };
      }
    } else if (fileType === 'pdf') {
      if (extension !== 'pdf') {
        return {
          isValid: false,
          error: 'Please select a PDF file',
        };
      }
    }

    // Check file size (mock validation)
    // In a real app, you'd check the actual file size
    const maxSize = fileType === 'image' ? 5 * 1024 * 1024 : 10 * 1024 * 1024; // 5MB for images, 10MB for PDFs

    return { isValid: true };
  }

  /**
   * Show file picker and upload result
   */
  async showFilePickerAndUpload(
    fileType: 'image' | 'pdf',
    onUploadComplete: (url: string) => void,
  ): Promise<void> {
    // For now, simulate file picker with mock data
    // In a real app, you'd use react-native-document-picker or react-native-image-picker

    const mockFileName =
      fileType === 'image'
        ? `profile_image_${Date.now()}.jpg`
        : `resume_${Date.now()}.pdf`;

    const mockFileUri = `file://mock/${mockFileName}`;

    Alert.alert(
      `${fileType === 'image' ? 'Profile Image' : 'Resume'} Upload`,
      `Mock upload: ${mockFileName}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Upload',
          onPress: async () => {
            const validation = this.validateFile(
              mockFileUri,
              mockFileName,
              fileType,
            );

            if (!validation.isValid) {
              Alert.alert(
                'Invalid File',
                validation.error || 'Please select a valid file',
              );
              return;
            }

            const result = await this.uploadFile(
              mockFileUri,
              mockFileName,
              fileType,
            );

            if (result.success && result.url) {
              onUploadComplete(result.url);
              Alert.alert(
                'Upload Successful',
                `${
                  fileType === 'image' ? 'Profile image' : 'Resume'
                } uploaded successfully!`,
              );
            } else {
              Alert.alert(
                'Upload Failed',
                result.error || 'Failed to upload file. Please try again.',
              );
            }
          },
        },
      ],
    );
  }
}

// Export singleton instance
export const fileUploadService = FileUploadService.getInstance();
