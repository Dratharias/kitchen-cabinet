import { getAuthHeaders } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface ImageFile {
  name: string;
  url: string;
  isDefault: boolean;
}

export interface ImagesResponse {
  success: boolean;
  data?: {
    images: ImageFile[];
    hasDefault: boolean;
    count: number;
  };
  error?: string;
}

export const ImagesService = {
  /**
   * List all images in the library
   */
  async listImages(): Promise<ImagesResponse> {
    const response = await fetch(`${API_URL}/api/images`, {
      headers: getAuthHeaders(),
    });

    return response.json();
  },

  /**
   * Get full image URL
   */
  getImageUrl(imageName: string): string {
    return `${API_URL}/images/${imageName}`;
  },

  /**
   * Get default image URL
   */
  getDefaultImageUrl(): string {
    return `${API_URL}/images/default.png`;
  },
};
