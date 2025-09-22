import { Component, Show, createResource, createMemo } from "solid-js";
import { useParams, useLocation } from "@solidjs/router";
import { PublicationsService } from "@/services/publications";
import type { Category, Content, Ingredient, Publication, Segment } from "@/types";
import { PublicationDetails as PublicationDetailsComponent } from "@/components/ui/organisms/PublicationDetails";

export interface PublicationPageProps {
  category?: "reviews" | "feeds";
}

export interface MappedPublicationData {
  publication_id: string;
  title: string;
  description: string[];
  note: string[];
  thumbnail: string | null;
  tags: Category[];
  ingredients: Ingredient[];
  preparation: Segment[];
  prepTime: number;
  selectedContent: Content[];
  isReview: boolean;
  category: "foods" | "feeds" | "unknown";
  reviewsCount: number | 0;
  averageRating: number | null;
}

export const PublicationPage: Component<PublicationPageProps> = (props) => {
  const params = useParams<{ id: string }>();
  const location = useLocation();

  const category = createMemo<"foods" | "feeds" | "unknown">(() => {
    const path = location.pathname;
    if (path.startsWith("/foods/")) return "foods";
    if (path.startsWith("/feeds/") || path.startsWith("/review/")) return "feeds";
    return "unknown";
  });

  const isReview = createMemo(() => location.pathname.startsWith("/review/"));

  const [publication] = createResource<Publication, string>(
    () => params.id,
    async (id) => {
      if (!id) throw new Error("Publication ID is required");
      try {
        return await PublicationsService.getPublicationById(id);
      } catch (e) {
        console.error("Failed to fetch publication:", e);
        throw e;
      }
    }
  );

  const mappedData = createMemo<MappedPublicationData | null>(() => {
    const pub = publication();
    if (!pub) return null;

    const content = pub.contents?.[0];

    // Map ingredients from content
    const ingredients = content?.content_ingredients?.map((contentIng) => {
      const ing = contentIng.ingredient;
      if (!ing) return "";

      const qty = ing.quantity ?? "";
      const units = ing.ingredient_units?.map(iu => iu.unit?.name).filter(Boolean).join(", ") ?? "";
      const productName = ing.product?.name ?? "";

      return `${qty} ${units} ${productName}`.trim();
    }) || [];

    // Map preparation from segments
    const preparation = content?.content_segments
      ?.sort((a, b) => (a.segment?.order_num ?? 0) - (b.segment?.order_num ?? 0))
      ?.map((cs) => {
        const seg = cs.segment;
        if (!seg) return "";
        return (seg.title ? `${seg.title}: ` : "") + seg.paragraph;
      })
      .filter(Boolean) || [];

    // Calculate total prep time
    const totalPrepTime = content?.content_prep_times?.reduce((sum, cpt) => {
      return sum + (cpt.prep_time?.duration ?? 0);
    }, 0) ?? 0;

    const formatPrepTime = (minutes: number) =>
      minutes === 0
        ? "0 min"
        : minutes < 60
          ? `${minutes} min`
          : `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}min` : ""}`;

    // Calculate average rating
    const reviews = pub.reviews || [];
    const validRatings = reviews.map(r => r.rating).filter((r): r is number => r !== null && r !== undefined);
    const averageRating = validRatings.length > 0
      ? validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length
      : null;

    return {
      publication_id: pub.publication_id,
      title: pub.title,
      description: pub.description,
      note: pub.note,
      thumbnail: pub.thumbnail,
      tags: pub.tags ?? [],
      ingredients,
      preparation,
      prepTime: formatPrepTime(totalPrepTime),
      selectedContent: content,
      isReview: !!isReview() || pub.type?.str_value === "Review",
      category: category(),
      reviewsCount: reviews.length,
      averageRating,
    };
  });

  return (
    <div>
      <Show when={publication.error}>
        <div class="text-red-600">
          <h2 class="text-xl font-bold mb-2">Error loading publication</h2>
          <p>{publication.error?.message ?? "An unexpected error occurred"}</p>
        </div>
      </Show>

      <Show when={publication.loading}>
        <div class="animate-pulse">
          <div class="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div class="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div class="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
          <div class="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
      </Show>

      <Show when={mappedData()}>
        {(d) => (
          <PublicationDetailsComponent
            publicationId={d.publication_id}
            title={d.title}
            thumbnail={d.thumbnail}
            prepTime={d.prepTime}
            selectedContent={d.selectedContent}
            preparation={d.preparation}
            description={d.description}
            note={d.note}
            isReview={d.isReview}
            category={d.category}
            reviewsCount={d.reviewsCount}
            averageRating={d.averageRating}
          />
        )}
      </Show>
    </div>
  );
};