import { Component, createSignal, createResource, Show } from "solid-js";
import { useParams } from "@solidjs/router";
import { PublicationsService } from "@/services/publications";
import { ReviewsService } from "@/services/reviews";
import ReviewList, { ReviewItem } from "@/components/ui/organisms/ReviewList";
import Image from "@/components/ui/atoms/Image";
import type { Publication, Review } from "@/types";

interface ReviewsPageData {
  title: string;
  thumbnail: string | null;
  totalCount: number;
  averageRating: number | null;
  reviews: ReviewItem[];
  page: number;
  totalPages: number;
}

export const ReviewPage: Component = () => {
  const params = useParams<{ id: string }>();
  const pageSize = 10;
  const [page, setPage] = createSignal(1);
  const fallbackThumbnail = "https://picsum.photos/640/480?random=42";

  // Fetch publication details for header
  const [publication] = createResource<Publication, string>(
    () => params.id,
    async (id) => {
      if (!id) throw new Error("Publication ID is required");
      return PublicationsService.getPublicationById(id);
    }
  );

  // Fetch reviews with pagination
  const [reviews] = createResource<ReviewsPageData, { publicationId: string; page: number }>(
    () => ({ publicationId: params.id, page: page() }),
    async ({ publicationId, page }) => {
      if (!publicationId) throw new Error("Publication ID is required");

      // Get reviews filtered by publication_id
      const reviewsData = await ReviewsService.getReviews({
        page,
        limit: pageSize,
        filter: { publication_id: publicationId }
      });

      const pub = publication();
      
      // Map reviews to ReviewItem format
      const reviewItems: ReviewItem[] = reviewsData.map((r: Review) => {
        const item: ReviewItem = {
          reviewId: r.review_id,
          rating: r.rating ?? undefined,
          comment: r.comment ?? [],
          description: r.description ?? [],
          buyAgain: r.buy_again ?? null,
          dateReview: r.date_review,
          productName: r.product.name ?? null,
          publicationTitle: r.publication.title ?? null
        };

        // Add product or publication info
        if (r.product) {
          item.productName = r.product.name;
        }
        if (r.publication) {
          item.publicationTitle = r.publication.title;
        }

        return item;
      });

      // Calculate average rating
      const validRatings = reviewsData
        .map(r => r.rating)
        .filter((r): r is number => r !== null && r !== undefined);
      
      const averageRating = validRatings.length > 0 
        ? validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length 
        : null;

      // Calculate total pages (assuming we can get total count from the response)
      // Note: The API response format for reviews doesn't include pagination info
      // You may need to adjust this based on actual API response structure
      const totalPages = Math.ceil(reviewsData.length / pageSize);

      return {
        title: pub?.title ?? "Unknown",
        thumbnail: pub?.thumbnail ?? null,
        totalCount: reviewsData.length,
        averageRating,
        reviews: reviewItems,
        page,
        totalPages: Math.max(1, totalPages),
      };
    }
  );

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
          src={reviews()!.thumbnail ?? fallbackThumbnail}
          fallbackSrc={fallbackThumbnail}
          alt={reviews()!.title}
          class="w-full max-h-20 object-cover object-center rounded-b mb-8"
        />

        <h2 class="text-2xl font-bold mb-4">
          Reviews for {reviews()!.title} ({reviews()!.totalCount} reviews)
        </h2>

        <Show when={reviews()!.averageRating !== null}>
          <p class="text-lg mb-4">
            Average Rating: {reviews()!.averageRating!.toFixed(1)}/5
          </p>
        </Show>

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