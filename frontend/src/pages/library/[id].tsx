import { Component, Show } from "solid-js";
import { useParams } from "@solidjs/router";
import { createResource } from "solid-js";
import { useApiFetch } from "../../hooks/useApiFetch";
import CardDetails from "../../components/browser/CardDetails";
import { Publication } from "../../types/publication";

export const LibraryPage: Component = () => {
  const params = useParams<{ id: string }>();
  const [publication] = createResource(
    () => params.id,
    id => useApiFetch<Publication>(`/api/publications/${id}/details`)
  );

  return (
    <div class="p-6">
      <Show when={publication()} keyed fallback={<p>Chargement...</p>}>
        {(pub) => <CardDetails {...pub} />}
      </Show>
    </div>
  );
};