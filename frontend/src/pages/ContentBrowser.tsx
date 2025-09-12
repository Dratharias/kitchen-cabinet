import { Component, createSignal, createResource } from "solid-js";
import { usePublicationApi } from "../hooks/usePublicationApi";
import CardList from "../components/browser/CardList";
import type { PublicationListResponse, PublicationListItem } from "../types/publication";

export const ContentBrowser: Component<{ feeds?: boolean; foods?: boolean }> = (props) => {
  const [page, setPage] = createSignal(1);
  const limit = 12;
  
  const types = () => {
    if (props.feeds) return ["Article", "Review", "Book"];
    if (props.foods) return ["Recipe", "Cookbook", "FoodPost"];
    return [];
  };

  const [publications] = createResource<PublicationListResponse, { page: number; limit: number; types: string[] }>(
    () => ({ page: page(), limit, types: types() }),
    async ({ page, limit, types }) => {
      if (!types.length) {
        return {
          data: [],
          pagination: {
            total: 0,
            page: 1,
            limit,
            totalPages: 0
          }
        };
      }
      
      return usePublicationApi.getPublications({ 
        page: page.toString(), 
        limit: limit.toString(), 
        type: types 
      });
    }
  );

  const cards = () =>
    publications()?.data
      ?.map((pub: PublicationListItem) => {       
        if (props.feeds) return { publication: pub, pathPrefix: "feeds" as const };
        if (props.foods) return { publication: pub, pathPrefix: "foods" as const };
        return null;
      })
      .filter((c) => c !== null) ?? [];

  return (
    <div class="flex-1 flex flex-col w-full p-4">
      <CardList
        cards={cards()}
        pagination={{
          page: publications()?.pagination?.page ?? 1,
          totalPages: publications()?.pagination?.totalPages ?? 1,
          onPageChange: setPage,
        }}
      />
    </div>
  );
};