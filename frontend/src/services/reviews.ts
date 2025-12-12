import { Review, PaginatedRequest } from "@/types";
import { CommonService } from "./common";
import { getAuthHeaders } from "./auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export interface CreateReviewPayload {
  publication_id: string;
  rating?: number | null;
  comment?: string[];
  description?: string[];
}

export interface ReviewResponse {
  success: boolean;
  data?: Review;
  error?: string;
}

export interface ReviewsResponse {
  success: boolean;
  data?: Review[];
  error?: string;
}

export class ReviewsService {
  static async getReviews(
    params?: Partial<PaginatedRequest> & {
      sortBy?: string;
      order?: "asc" | "desc";
      filter?: Record<string, any>;
    },
  ): Promise<Review[]> {
    return CommonService.get<Review[]>("/api/reviews", params);
  }

  static async getReviewById(id: string): Promise<Review> {
    return CommonService.get<Review>(`/api/reviews/${id}`);
  }

  /**
   * Get all reviews for a publication
   */
  static async getByPublication(
    publicationId: string,
  ): Promise<ReviewsResponse> {
    const response = await fetch(
      `${API_URL}/api/reviews/publication/${publicationId}`,
    );
    return response.json();
  }

  /**
   * Create a new review
   */
  static async create(payload: CreateReviewPayload): Promise<ReviewResponse> {
    const response = await fetch(`${API_URL}/api/reviews`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return response.json();
  }

  /**
   * Update a review
   */
  static async update(
    reviewId: string,
    payload: Partial<CreateReviewPayload>,
  ): Promise<ReviewResponse> {
    const response = await fetch(`${API_URL}/api/reviews/${reviewId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return response.json();
  }

  /**
   * Delete a review
   */
  static async delete(reviewId: string): Promise<ReviewResponse> {
    const response = await fetch(`${API_URL}/api/reviews/${reviewId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return response.json();
  }
}
