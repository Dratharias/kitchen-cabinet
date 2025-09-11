import { Component, createSignal, createResource } from "solid-js";
import { usePublicationApi } from "../hooks/usePublicationApi";
import CardList from "../components/browser/CardList";
import type { Paginated, Publication } from "../types/publication";
import { CardProps } from "../components/browser/Card";

export const ContentBrowser: Component<{ feeds?: boolean; foods?: boolean }> = (props) => {
  const [page, setPage] = createSignal(1);
  const limit = 12;

  const types = () => {
    if (props.feeds) return ["Article", "Review", "Book"];
    if (props.foods) return ["Recipe", "Cookbook", "FoodPost"];
    return [];
  };

  const [publications] = createResource<Paginated<Publication>, { page: number; limit: number; types: string[] }>(
    () => ({ page: page(), limit, types: types() }),
    async ({ page, limit, types }) => {
      if (!types.length) {
        return {
          items: [],
          total: 0,
          page: 1,
          pageSize: limit,
          data: null,
          pagination: {}
        };
      }
      const endpoint = "publication";
      return usePublicationApi.getPublications(endpoint, { page, limit, types: types.join(',') });
    }
  );

  const cards = () =>
    publications()?.items
      .map((pub) => {
        const isReview = pub.type?.type === "Review";
        const baseUrl = isReview ? "/review" : "/read";
        
        if (props.feeds) return { publication: pub, pathPrefix: "feeds" as const, baseUrl };
        if (props.foods) return { publication: pub, pathPrefix: "foods" as const, baseUrl };
        return null;
      })
      .filter((c) => c !== null) ?? [];

  return (
    <div class="flex-1 flex flex-col w-full p-4">
      <CardList
        cards={cards()}
        pagination={{
          page: publications()?.page ?? 1,
          totalPages: Math.ceil((publications()?.total ?? 1) / limit), 
          onPageChange: setPage,
        }}
      />
    </div>
  );
};