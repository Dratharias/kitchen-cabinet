import { Component, createSignal, createResource, createEffect } from "solid-js";
import { PublicationsService } from "@/services/publications";
import CardList from "@/components/ui/molecules/CardList";
import type { Publication, PaginatedResponse } from "@/types";

// Map backend publication → frontend mapped data
export interface MappedPublicationsData {
  publicationId: string;
  title: string;
  description: string[];
  note: string[];
  public: boolean;
  published: boolean;
  thumbnail: string | null;
  tags: string[];
  type: { str_value: string } | null;
  style: { str_value: string } | null;
  author: { str_value: string } | null;
  averageRating: number | null;
  reviewCount: number | null;
  prepTime: string;
  servings: number;
  isReview: boolean;
}

export const mapToMappedPublicationData = (pub: Publication): MappedPublicationsData => {
  // Get first content for prep time and servings
  const firstContent = pub.contents?.[0];

  // Extract tag names
  const tagNames = pub.tags?.map(t => t.str_value).filter(Boolean) || [];

  // Format prep time
  const totalPrepTime = firstContent?.total_prep_time || 0;
  const formatPrepTime = (minutes: number) =>
    minutes === 0
      ? "0 min"
      : minutes < 60
        ? `${minutes} min`
        : `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}min` : ""}`;

  return {
    publicationId: pub.publication_id,
    title: pub.title,
    description: pub.description,
    note: pub.note,
    public: pub.public,
    published: pub.published,
    thumbnail: pub.thumbnail,
    tags: tagNames,
    type: pub.type,
    style: pub.style,
    author: pub.author,
    averageRating: pub.averageRating,
    reviewCount: pub.reviewCount,
    prepTime: formatPrepTime(totalPrepTime),
    servings: firstContent?.servings || 0,
    isReview: pub.type?.str_value === "Review",
  };
};

// Get types by category helper
const getTypesByCategory = (category: "feeds" | "reviews"): string[] => {
  // This should match your existing logic for filtering types
  // You may need to adjust this based on your actual type filtering logic
  if (category === "feeds") {
    return ["Review", "Article", "Guide"];
  }
  if (category === "reviews") {
    return ["Recipe", "Ingredient"];
  }
  return [];
};

export const ContentBrowser: Component<{ feeds?: boolean; reviews?: boolean }> = (props) => {
  const [page, setPage] = createSignal(1);
  const limit = 12;

  // Types by category
  const types = () =>
    props.feeds ? getTypesByCategory("feeds") : props.reviews ? getTypesByCategory("reviews") : [];

  // Reset page when category changes
  createEffect(() => setPage(1));

  // Fetch publications using SolidJS resource
  const [publications] = createResource<PaginatedResponse<Publication>, { page: number; limit: number; types: string[] }>(
    () => ({ page: page(), limit, types: types() }),
    async ({ page, limit, types }) => {
      if (!types.length) {
        return { items: [], total: 0, page: 1, limit, totalPages: 1 };
      }

      // Build filter for types
      const filter = types.length > 0 ? { type: types } : undefined;

      return PublicationsService.getPublications({
        page,
        limit,
        filter,
      });
    }
  );

  const category: "feeds" | "reviews" = props.feeds
    ? "feeds"
    : props.reviews
      ? "reviews"
      : (() => { throw new Error("No category selected"); })();

  // Create an array of mapped publications
  const mappedPublications = () => {
    const data = publications()?.items || [];
    return data.map(mapToMappedPublicationData);
  };

  // Prepare cards for CardList
  const cards = () => mappedPublications().map((pub) => (
    console.log(pub),
    {
      publication: pub,
      pathPrefix: category,
    }
  ));

  return (
    <div class="flex-1 flex flex-col w-full">
      <CardList
        cards={cards()}
        pagination={{
          page: publications()?.page ?? 1,
          totalPages: publications()?.totalPages ?? 1,
          onPageChange: setPage,
        }}
      />
    </div>
  );
};