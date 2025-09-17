import { PaginatedResponse, UUID } from "./common";

export interface ReviewPayload {
  publication_id: UUID;
  rating: number;
  comment?: string;
}
export interface Review extends ReviewPayload {
  review_id: UUID;
  user_id: UUID;
}

export type ListReviewsResponse = PaginatedResponse<Review>;
export type GetReviewResponse = Review;
export type CreateReviewRequest = ReviewPayload;
export type CreateReviewResponse = Review;
export type UpdateReviewRequest = Partial<ReviewPayload>;
export type UpdateReviewResponse = Review;
export type DeleteReviewResponse = { success: boolean };
