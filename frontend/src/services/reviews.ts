import { Review, PaginatedRequest } from "@/types";
import { CommonService } from "./common";

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
}
