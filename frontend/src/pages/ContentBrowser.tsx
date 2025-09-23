import { Component, createSignal, createResource, createEffect } from "solid-js";
import { PublicationsService } from "@/services/publications";
import CardList from "@/components/ui/molecules/CardList";
import type { PaginatedResponse } from "@/types";

// Helper pour déterminer les types par catégorie
const getTypesByCategory = (category: "feeds" | "reviews"): string[] => {
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

  const types = () =>
    props.feeds ? getTypesByCategory("feeds") : props.reviews ? getTypesByCategory("reviews") : [];

  createEffect(() => setPage(1));

  const [publications] = createResource<
    PaginatedResponse<any>,
    { page: number; limit: number; types: string[] }
  >(
    () => ({ page: page(), limit, types: types() }),
    async ({ page, limit, types }) => {
      if (!types.length) {
        return { items: [], total: 0, page: 1, limit, totalPages: 1 };
      }
      const filter = types.length > 0 ? { type: types } : undefined;
      return PublicationsService.getPublications({ page, limit, filter });
    }
  );

  const category: "feeds" | "reviews" = props.feeds
    ? "feeds"
    : props.reviews
      ? "reviews"
      : (() => { throw new Error("No category selected"); })();

  // Pas de mapping → envoie directement les items
  const cards = () =>
    (publications()?.items || []).map((pub: any) => ({
      publication: pub,
      pathPrefix: category,
    }));

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
