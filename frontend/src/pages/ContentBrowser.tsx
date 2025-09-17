import { Component, createSignal, createResource, createEffect } from "solid-js";
import { usePublicationApi, PublicationListWithPagination } from "../hooks/usePublicationApi";
import CardList from "../components/ui/molecules/CardList";
import type {
  MappedPublicationsData,
} from "../shared-types/publication";
import { getTypesByCategory } from "../shared-types/publication";

// --- Map backend publication → frontend mapped data ---
export const mapToMappedPublicationData = (
  pub: any
): MappedPublicationsData => {
  // Flatten all segments in all contents
  const allContents = pub.contents?.map((content: any) => {
    return {
      totalPrepTime: content.totalPrepTime,
      servings: content.servings
    };
  }) || [];

  // Use first content as the "selected" one
  const selectedContent = allContents[0];

  // Extract tags names for easier display
  const tagNames = pub.tags?.map((t: any) => t.category?.str_value).filter(Boolean) || [];

  // Map other top-level info
  return {
    publicationId: pub.publication_id,
    title: pub.title,
    description: pub.description,
    note: pub.note,
    public: pub.public,
    published: pub.published,
    thumbnail: pub.thumbnail,
    tags: tagNames,
    type: pub.type?.str_value ? { ...pub.type } : null,
    style: pub.style?.str_value ? { ...pub.style } : null,
    author: pub.author?.str_value ? { ...pub.author } : null,
    averageRating: pub.averageRating ?? null,
    prepTime: selectedContent?.totalPrepTime?.toString() || "N/A",
    servings: selectedContent?.servings || 0,
    isReview: pub.type?.str_value === "Review",
  } as MappedPublicationsData;
};


export const ContentBrowser: Component<{ feeds?: boolean; foods?: boolean }> = (props) => {
  const [page, setPage] = createSignal(1);
  const limit = 12;

  // Types by category
  const types = () =>
    props.feeds ? getTypesByCategory("feeds") : props.foods ? getTypesByCategory("foods") : [];

  // Reset page when category changes
  createEffect(() => setPage(1));

  // Fetch publications using SolidJS resource
  const [publications] = createResource<PublicationListWithPagination, { page: number; limit: number; types: string[] }>(
    () => ({ page: page(), limit, types: types() }),
    async ({ page, limit, types }) => {
      if (!types.length) {
        return { data: [], pagination: { total: 0, page: 1, limit, totalPages: 1 } };
      }

      return usePublicationApi.getPublications({
        page: page.toString(),
        limit: limit.toString(),
        type: types,
      });
    }
  );

  const category: "feeds" | "foods" = props.feeds
    ? "feeds"
    : props.foods
    ? "foods"
    : (() => { throw new Error("No category selected"); })();

  // Create an array of mapped publications
  const mappedPublications = () => {
    const data = publications()?.data || [];
    return data.map(mapToMappedPublicationData);
  };

  // Prepare cards for CardList
  const cards = () => mappedPublications().map((pub) => ({
    publication: pub,
    pathPrefix: category,
  }));

  return (
    <div class="flex-1 flex flex-col w-full">
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
