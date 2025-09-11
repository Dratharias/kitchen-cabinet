import { Component, Show, createResource } from "solid-js";
import { useParams, useLocation } from "@solidjs/router";
import { usePublicationApi } from "../../hooks/usePublicationApi";
import { PublicationDetails } from "../../components/browser/PublicationDetails";
import type { Publication, ContentDetails } from "../../types/publication";

export const PublicationPage: Component = () => {
  const params = useParams<{ id: string }>();
  const location = useLocation();

  const isReview = () => location.pathname.startsWith('/review/');

  const [publication] = createResource<Publication, string>(
    () => params.id,
    async (id) => {
      const endpoint = isReview() ? "review" : "publication";
      return usePublicationApi.getPublication(endpoint, id);
    }
  );

  const mappedData = () => {
    const pub = publication();
    if (!pub) return null;

    const content: ContentDetails | undefined = pub.contents?.[0];
    if (!content) {
      return { ...pub, ingredients: [], preparation: [], prepTime: "0 min" };
    }

    const ingredients = content.ingredients.map(
      (i) =>
        `${i.quantity ?? ""} ${i.units.map((u) => u.name).join(", ")} ${i.product.name}`
    );

    const preparation = content.segments
      .sort((a, b) => a.order - b.order)
      .map((s) => s.paragraph);

    const totalPrepTime = content.prepTimes.reduce((sum, p) => sum + p.duration, 0);

    return {
      ...pub,
      ingredients,
      preparation,
      prepTime: `${totalPrepTime} min`,
      selectedContent: content,
    };
  };

  return (
    <div class="p-0">
      <Show
        when={mappedData()}
        keyed
        fallback={<p class="p-4">Chargement...</p>}
      >
        {(pub) => (
          <PublicationDetails {...pub} isReview={isReview()} />
        )}
      </Show>
    </div>
  );
};