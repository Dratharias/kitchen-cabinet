import { PaginatedResponse, UUID } from "./common";
import { Product } from "./product";
import { Publication } from "./publication";

export type BuyAgain = "Y" | "N" | "M" | "D";

export interface ReviewPayload {
  product_id?: UUID | null;
  publication_id?: UUID | null;
  rating?: number | null;
  comment?: string[];
  description?: string[];
  buy_again?: BuyAgain | null;
  date_review?: string;
}

export interface Review extends ReviewPayload {
  review_id: UUID;
  product_id: UUID | null;
  publication_id: UUID | null;
  rating: number | null;
  comment: string[];
  description: string[];
  buy_again: BuyAgain | null;
  date_review: string;
  product: Product | null;
  publication: Publication | null;
}

export type ListReviewsResponse = PaginatedResponse<Review>;
export type GetReviewResponse = Review;
export type CreateReviewRequest = ReviewPayload;
export type CreateReviewResponse = Review;
export type UpdateReviewRequest = Partial<ReviewPayload>;
export type UpdateReviewResponse = Review;
export type DeleteReviewResponse = { success: boolean };
