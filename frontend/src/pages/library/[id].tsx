import { Component, Show, createResource } from "solid-js";
import { useParams } from "@solidjs/router";
import { usePublicationApi } from "../../hooks/usePublicationApi";
import { ReviewDetails } from "../../components/browser/ReviewDetails";

export const LibraryPage: Component = () => {
  const params = useParams<{ id: string }>();

  const [publication] = createResource(() => params.id, (id) =>
    usePublicationApi.getReview(id)
  );

  return (
    <div class="p-0">
      <Show when={publication()} keyed fallback={<p class="p-4">Chargement...</p>}>
        {(pub) => <ReviewDetails publication={pub} />}
      </Show>
    </div>
  );
};
