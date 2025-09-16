import { Component, createSignal, createResource, Show } from "solid-js";
import { useParams } from "@solidjs/router";
import { usePublicationApi } from "../../../hooks/usePublicationApi";
import ReviewList, { ReviewItem } from "../../../components/ui/browser/ReviewList";
import Image from "../../../components/ui/html/Image";

interface BackendReview {
  productName: string;
  reviewId: string;
  rating?: number | null;
  comment?: string[];
  description?: string[];
  buyAgain?: "Y" | "N" | "M" | "I" | null;
  dateReview: string;
  reviewedEntity?: { type: "product" | "publication"; id: string; title: string } | null;
}

interface BackendReviewResponse {
  publication?: { publication_id: string; title: string; thumbnail?: string };
  count: number;
  averageRating?: number | null;
  page: number;
  limit: number;
  totalPages: number;
  reviews: BackendReview[];
}

export const ReviewPage: Component = () => {
  const params = useParams<{ id: string }>();
  const pageSize = 10;
  const [page, setPage] = createSignal(1);
  const fallbackThumbnail = "https://picsum.photos/640/480?random=42";


  const [reviews] = createResource(page, async (p: number) => {
    const data = (await usePublicationApi.getPublicationReviews(params.id, {
      page: p,
      limit: pageSize,
    })) as BackendReviewResponse;

    const reviewItems: ReviewItem[] = (data.reviews ?? []).map((r) => {
      const item: ReviewItem = {
        reviewId: r.reviewId,
        rating: r.rating ?? undefined,
        comment: r.comment ?? [],
        description: r.description ?? [],
        buyAgain: r.buyAgain ?? null,
        dateReview: r.dateReview,
        productName: r.productName ?? undefined
      };

      if (r.reviewedEntity) {
        if (r.reviewedEntity.type === "product") {
          item.productName = r.reviewedEntity.title;
        } else if (r.reviewedEntity.type === "publication") {
          item.publicationTitle = r.reviewedEntity.title;
        }
      }

      return item;
    });

    return {
      title: data.publication?.title ?? "Unknown",
      thumbnail: data.publication?.thumbnail ?? null,
      totalCount: data.count ?? 0,
      averageRating: data.averageRating ?? null,
      reviews: reviewItems,
      page: data.page,
      totalPages: data.totalPages,
    };
  });

  return (
    <div class="p-4">
      <Show when={reviews.loading}>
        <p>Loading reviews...</p>
      </Show>

      <Show when={reviews.error}>
        <p class="text-red-600">Error loading reviews: {reviews.error.message}</p>
      </Show>

      <Show when={reviews()}>
        <Image
          src={reviews().thumbnail ?? fallbackThumbnail}
          fallbackSrc={fallbackThumbnail}
          alt={reviews().title}
          class="w-full max-h-20 object-cover object-center rounded-b mb-8"
        />

        <h2 class="text-2xl font-bold mb-4">
          Reviews for {reviews()!.title} ({reviews()!.totalCount} reviews)
        </h2>

        <ReviewList
          reviews={reviews()!.reviews}
          pagination={{
            page: reviews()!.page,
            totalPages: reviews()!.totalPages,
            onPageChange: (p) => {
              const clamped = Math.max(1, Math.min(p, reviews()!.totalPages));
              setPage(clamped);
            },
          }}
        />
      </Show>
    </div>
  );
};
