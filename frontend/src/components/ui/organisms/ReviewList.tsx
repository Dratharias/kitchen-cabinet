import { Component, For, Show } from "solid-js";
import { ReviewCard } from "./ReviewCard";
import { PaginationNavigator } from "../utilities/PaginationNavigator";

export interface ReviewItem {
  productName: string;
  reviewId: string;
  rating?: number | null;
  comment: string[];
  description: string[];
  buyAgain?: "Y" | "N" | "M" | "I" | null;
  dateReview: string;
  publicationTitle?: string;
}

export interface ReviewListProps {
  reviews: ReviewItem[];
  pagination?: {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  class?: string;
}

const ReviewList: Component<ReviewListProps> = (props) => {
  return (
    <div class={`flex flex-col w-full ${props.class ?? ""}`}>
      <For each={props.reviews}>
        {(review) => (
            <ReviewCard
            {...review}
            publicationTitle={review.publicationTitle}
            />
        )}
        </For>

      <Show when={props.pagination}>
        <div class="flex justify-center items-center mt-4 gap-4">
          <PaginationNavigator pagination={props.pagination} />
        </div>
      </Show>
    </div>
  );
};

export default ReviewList;
