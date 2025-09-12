import { Component, createSignal, createResource } from "solid-js";
import { usePublicationApi } from "../hooks/usePublicationApi";
import CardList from "../components/ui/browser/CardList";
import type { PublicationListResponse, PublicationListItem, MappedPublicationData } from "../types/publication";
import { CardProps } from "../components/ui/browser/Card";

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
        return { data: [], pagination: { total: 0, page: 1, limit, totalPages: 0 } };
      }

      return usePublicationApi.getPublications({ 
        page: page.toString(), 
        limit: limit.toString(), 
        type: types 
      });
    }
  );


  const mapToMappedPublicationData = (pub: PublicationListItem, category: "feeds" | "foods"): MappedPublicationData => ({
    ...pub,
    selectedContent: undefined,
    prepTime: "",
    ingredients: [],
    preparation: [],
    isReview: pub.type?.strValue === "Review",
    category,
    public: false,
    published: false,
    reviewsCount: 0,
    averageRating: 0,
    contents: []
  });


  const cards = () =>
    publications()?.data
      ?.map((pub) => {
        if (props.feeds)
          return { publication: mapToMappedPublicationData(pub, "feeds"), pathPrefix: "feeds" as "feeds" };
        if (props.foods)
          return { publication: mapToMappedPublicationData(pub, "foods"), pathPrefix: "foods" as "foods" };
        return null;
      })
      .filter(Boolean) as CardProps[] ?? [];



  return (
    <div class="flex-1 flex flex-col w-full p-4">
      <CardList
        cards={cards()}
        pagination={{
          page: publications()?.pagination.page ?? 1,
          totalPages: publications()?.pagination.totalPages ?? 1,
          onPageChange: setPage,
        }}
      />
    </div>
  );
};