import axios from 'axios';

export interface ImgBBResponse {
  success: boolean;
  data: {
    id: string;
    title: string;
    url_viewer: string;
    url: string;
    display_url: string;
    width: number;
    height: number;
    size: number;
    time: number;
    expiration: number;
    image: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    thumb: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    medium: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    delete_url: string;
  };
  status: number;
}

export interface UploadError {
  success: false;
  error: {
    message: string;
    code: number;
    context: string;
  };
  status: number;
}

class ImgBBUploader {
  private apiKey: string;
  private baseURL: string = 'https://api.imgbb.com/1/upload';

  constructor() {
    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) {
      throw new Error('IMGBB_API_KEY environment variable is required');
    }
    this.apiKey = apiKey;
  }

  /**
   * Upload image to ImgBB
   * @param imageFile - File object or base64 string
   * @param name - Optional name for the image
   * @param expiration - Optional expiration time in seconds (min: 60, max: 15552000)
   * @returns Promise<ImgBBResponse>
   */
  async uploadImage(
    imageFile: File | string,
    name?: string,
    expiration?: number
  ): Promise<ImgBBResponse> {
    try {
      // Validate file size (ImgBB max: 32MB)
      if (imageFile instanceof File && imageFile.size > 32 * 1024 * 1024) {
        throw new Error('File size exceeds 32MB limit');
      }

      // Validate file type
      if (imageFile instanceof File) {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
        if (!allowedTypes.includes(imageFile.type)) {
          throw new Error('Invalid file type. Only JPEG, PNG, GIF, WebP, and BMP are allowed');
        }
      }

      const formData = new FormData();
      formData.append('key', this.apiKey);
      
      if (imageFile instanceof File) {
        formData.append('image', imageFile);
      } else {
        // Assume it's a base64 string
        formData.append('image', imageFile);
      }

      if (name) {
        formData.append('name', name);
      }

      if (expiration) {
        if (expiration < 60 || expiration > 15552000) {
          throw new Error('Expiration must be between 60 seconds and 15552000 seconds (180 days)');
        }
        formData.append('expiration', expiration.toString());
      }

      const response = await axios.post<ImgBBResponse>(this.baseURL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 seconds timeout
      });

      if (response.data.success) {
        return response.data;
      } else {
        throw new Error('Upload failed: ' + JSON.stringify(response.data));
      }

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.data) {
          const errorData = error.response.data as UploadError;
          throw new Error(`ImgBB API Error: ${errorData.error?.message || 'Unknown error'}`);
        } else if (error.code === 'ECONNABORTED') {
          throw new Error('Upload timeout: Please try again with a smaller image');
        } else {
          throw new Error(`Network error: ${error.message}`);
        }
      }
      throw error;
    }
  }

  /**
   * Convert File to base64 string
   * @param file - File object
   * @returns Promise<string> - Base64 string
   */
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:image/...;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Validate image URL
   * @param url - Image URL to validate
   * @returns boolean
   */
  isValidImageUrl(url: string): boolean {
    const imageUrlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|bmp)$/i;
    return imageUrlPattern.test(url);
  }

  /**
   * Get image info without uploading
   * @param file - File object
   * @returns Object with file info
   */
  getImageInfo(file: File) {
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      sizeInMB: (file.size / (1024 * 1024)).toFixed(2),
      isValidSize: file.size <= 32 * 1024 * 1024,
      isValidType: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'].includes(file.type)
    };
  }
}

// Export singleton instance
const imgbbUploader = new ImgBBUploader();
export default imgbbUploader;

// Export class for custom instances
export { ImgBBUploader };
