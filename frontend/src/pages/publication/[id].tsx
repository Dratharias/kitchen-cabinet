import { Component, Show, createResource, createMemo } from "solid-js";
import { useParams, useLocation } from "@solidjs/router";
import { usePublicationApi } from "../../hooks/usePublicationApi";
import type { PublicationDetails, ContentDetails, MappedPublicationData } from "../../types/publication";
import { PublicationDetails as PublicationDetailsComponent } from "../../components/browser/PublicationDetails";

export interface PublicationPageProps {
  category?: "foods" | "feeds";
}

export const PublicationPage: Component<PublicationPageProps> = (props) => {
  const params = useParams<{ id: string }>();
  const location = useLocation();

  const category = createMemo<"foods" | "feeds" | "unknown">(() => {
    const path = location.pathname;
    if (path.startsWith("/foods/")) return "foods";
    if (path.startsWith("/feeds/")) return "feeds";
    if (path.startsWith("/review/")) return "feeds";
    return "unknown";
  });

  const isReview = createMemo(() => location.pathname.startsWith("/review/"));

  const [publication] = createResource<PublicationDetails, string>(
    () => params.id,
    async (id) => {
      if (!id) throw new Error("Publication ID is required");
      return usePublicationApi.getPublication(id);
    }
  );

  const mappedData = createMemo<MappedPublicationData | null>(() => {
    const pub = publication();
    if (!pub) return null;

    const content: ContentDetails | undefined = pub.contents?.[0];

    const ingredients =
      content?.ingredients.map((ingredient) => {
        const qty = ingredient.quantity ?? "";
        const units = ingredient.units?.map((u) => u.name).join(", ") ?? "";
        return `${qty} ${units} ${ingredient.product.name}`.trim();
      }) ?? [];

    const preparation =
      content?.segments
        .sort((a, b) => a.order - b.order)
        .map((seg) => (seg.title ? `${seg.title}: ` : "") + seg.paragraph) ?? [];

    const totalPrepTime = content?.prepTimes.reduce((sum, p) => sum + p.duration, 0) ?? 0;

    const formatPrepTime = (minutes: number) => {
      if (minutes === 0) return "0 min";
      if (minutes < 60) return `${minutes} min`;
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins === 0 ? `${hours}h` : `${hours}h ${mins}min`;
    };

    return {
      ...pub,
      ingredients,
      preparation,
      prepTime: formatPrepTime(totalPrepTime),
      selectedContent: content,
      isReview: !!isReview() || pub.type?.strValue === "Review",
      category: category(),
    };
  });

  return (
    <div class="p-0">
      <Show when={publication.error}>
        <div class="p-4 text-red-600">
          <h2 class="text-xl font-bold mb-2">Error loading publication</h2>
          <p>{publication.error?.message ?? "An unexpected error occurred"}</p>
        </div>
      </Show>

      <Show when={publication.loading}>
        <div class="p-4 animate-pulse">
          <div class="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div class="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div class="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
          <div class="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
      </Show>

      <Show when={mappedData()}>
        {(data) => {
          const d = data();
          if (!d) return null;

          return (
            <PublicationDetailsComponent
              title={d.title}
              thumbnail={d.thumbnail}
              prepTime={d.prepTime}
              selectedContent={d.selectedContent}
              ingredients={d.ingredients}
              preparation={d.preparation}
              description={d.description}
              note={d.note}
              isReview={d.isReview}
              category={d.category}
            />
          );
        }}
      </Show>


    </div>
  );
};
