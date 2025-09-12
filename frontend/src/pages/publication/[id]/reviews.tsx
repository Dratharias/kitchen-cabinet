import { createSignal, createResource, Component, Show, For } from "solid-js";
import { useParams } from "@solidjs/router";
import { usePublicationApi } from "../../../hooks/usePublicationApi";

// --- Frontend types ---
interface Review {
  reviewId: string;
  rating?: number | null;
  comment: string[];
  description: string[];
  buyAgain?: string | null;
  dateReview: string;
  product?: { productId: string; name: string };
  publication?: { publicationId: string; title: string };
}

interface ReviewResponse {
  title: string;
  totalCount: number;
  averageRating?: number | null;
  reviews: Review[];
}

// --- Backend response types ---
interface BackendReview {
  reviewId: string;
  rating?: number | null;
  comment?: string[];
  description?: string[];
  buyAgain?: string | null;
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

  // --- Fetch reviews and map backend to frontend ---
  const [reviews] = createResource<ReviewResponse, number>(
    page,
    async (p: number): Promise<ReviewResponse> => {
      const id = params.id;
      if (!id) throw new Error("Publication ID is required");

      const data = (await usePublicationApi.getPublicationReviews(
        `${id}?page=${p}&limit=${pageSize}`
      )) as BackendReviewResponse;

      return {
        title: data.publication?.title ?? "Unknown",
        totalCount: data.count ?? 0,
        averageRating: data.averageRating ?? null,
        reviews: (data.reviews ?? []).map((r) => {
          const review: Review = {
            reviewId: r.reviewId,
            rating: r.rating ?? undefined,
            comment: r.comment ?? [],
            description: r.description ?? [],
            buyAgain: r.buyAgain ?? undefined,
            dateReview: r.dateReview,
          };

          if (r.reviewedEntity) {
            if (r.reviewedEntity.type === "product") {
              review.product = { productId: r.reviewedEntity.id, name: r.reviewedEntity.title };
            } else if (r.reviewedEntity.type === "publication") {
              review.publication = { publicationId: r.reviewedEntity.id, title: r.reviewedEntity.title };
            }
          }

          return review;
        }),
      };
    }
  );

  // --- Pagination helpers ---
  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => p + 1);

  return (
    <div class="p-4">
      {/* Loading state */}
      <Show when={reviews.loading}>
        <p>Loading reviews...</p>
      </Show>

      {/* Error state */}
      <Show when={reviews.error}>
        <p class="text-red-600">Error loading reviews: {reviews.error.message}</p>
      </Show>

      {/* Loaded reviews */}
      <Show when={reviews() != null} fallback={<p>No reviews found.</p>}>
        <>
          <h2 class="text-2xl font-bold mb-4">
            Reviews for {reviews()!.title} ({reviews()!.totalCount} reviews, average: {reviews()!.averageRating ?? "N/A"})
          </h2>

          <For each={reviews()!.reviews}>
            {(review) => (
              <div class="border rounded p-2 mb-2">
                <div class="flex justify-between">
                  <span class="font-semibold">{review.product?.name || review.publication?.title || "Unknown"}</span>
                  <span>{review.rating ?? "No rating"} ⭐</span>
                </div>

                {review.comment.length > 0 && (
                  <div class="mt-1">
                    {review.comment.map((c) => (
                      <p class="text-gray-700">{c}</p>
                    ))}
                  </div>
                )}

                {review.description.length > 0 && (
                  <div class="mt-1 text-sm text-gray-500">
                    {review.description.map((d) => (
                      <p>{d}</p>
                    ))}
                  </div>
                )}

                <div class="mt-1 text-xs text-gray-400">
                  Reviewed on: {new Date(review.dateReview).toLocaleDateString()}
                </div>
              </div>
            )}
          </For>

          {/* Pagination controls */}
          <div class="mt-4 flex gap-2">
            <button class="px-3 py-1 bg-gray-200 rounded" disabled={page() <= 1} onClick={goPrev}>
              Previous
            </button>
            <button class="px-3 py-1 bg-gray-200 rounded" onClick={goNext}>
              Next
            </button>
          </div>
        </>
      </Show>
    </div>
  );
};
