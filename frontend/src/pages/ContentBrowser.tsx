import { Component, createSignal, createResource } from "solid-js";
import { useApiFetch } from "../hooks/useApiFetch";
import CardList from "../components/browser/CardList";
import { Publication, Paginated } from "../types/publication";

export const ContentBrowser: Component<{ feeds?: boolean; library?: boolean }> = (props) => {
  const section = props.feeds ? "feeds" : props.library ? "library" : null;
  const [page, setPage] = createSignal(1);
  const limit = 12;

  const [publications] = createResource(
    () => ({ page: page(), limit }),
    ({ page, limit }) =>
      useApiFetch<Paginated<Publication>>(`/api/publications/${section}`, { page, limit })
  );

  const cards = () =>
    publications()?.data.map(pub => ({
      publication: pub,
      pathPrefix: section as "feeds" | "library",
    })) ?? [];

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
