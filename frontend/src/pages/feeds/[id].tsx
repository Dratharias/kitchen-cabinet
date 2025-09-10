import { Component, Show, createResource } from "solid-js";
import { useParams } from "@solidjs/router";
import { usePublicationApi } from "../../hooks/usePublicationApi";
import FeedDetails from "../../components/browser/FeedDetails";

export const FeedPage: Component = () => {
  const params = useParams<{ id: string }>();

  const [publication] = createResource(() => params.id, (id) =>
    usePublicationApi.getFeed(id)
  );

  return (
    <div class="p-0">
      <Show when={publication()} keyed fallback={<p>Chargement...</p>}>
        {(pub) => <FeedDetails {...pub} />}
      </Show>
    </div>
  );
};
