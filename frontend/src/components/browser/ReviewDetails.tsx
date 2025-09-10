import { Component, Show, For } from "solid-js";
import Image from "../ui/Image";
import Span from "../ui/Span";
import Stars from "../ui/Stars";
import Aria from "../ui/Aria";

export interface ReviewDetailsProps {
  publication: {
    title: string;
    thumbnail?: string;
    reviews?: {
      reviewId: string;
      rating?: number;
      comment?: string[];
      description?: string[];
      buyAgain?: "Oui" | "Non" | "Incertain" | "Non prioritaire";
      dateReview: string;
      product?: {
        name: string;
        thumbnail?: string;
      };
      categoryName?: string;
      authorOrSupplier?: string;
    }[];
  };
}

export const ReviewDetails: Component<ReviewDetailsProps> = (props) => {
  const publication = props.publication;

  return (
    <div class="flex flex-col w-full">
      {/* Thumbnail full width */}
      <Show when={publication.thumbnail}>
        <Image
          src={publication.thumbnail}
          alt={publication.title}
          class="w-full h-64 object-cover rounded-b"
        />
      </Show>

      {/* Title under image */}
      <h1 class="text-2xl font-semibold mt-2 px-4">{publication.title}</h1>

      {/* List all reviews */}
      <For each={publication.reviews}>
        {(r) => (
          <div class="border-t mt-4 pt-4 px-4">
            {/* Product Name */}
            <h2 class="text-lg font-medium">{r.product?.name ?? "Produit inconnu"}</h2>

            {/* Evaluated Date */}
            <div class="text-sm text-gray-500">
              Évalué le: {new Date(r.dateReview).toLocaleDateString()}
            </div>

            {/* Category / Author */}
            <div class="grid grid-cols-2 gap-4 mt-1">
              <Span>Categorie: {r.categoryName ?? "-"}</Span>
              <Span>Auteur/Fournisseur: {r.authorOrSupplier ?? "-"}</Span>
            </div>

            {/* Stars */}
            <div class="mt-2 flex justify-start">
              <Stars score={r.rating ?? 0} readonly size={24} />
            </div>

            {/* Buy Again */}
            <div class="mt-1 text-sm">
              Acheté de nouveau: {r.buyAgain ?? "Incertain"}
              <Show
                when={
                  new Date().getTime() - new Date(r.dateReview).getTime() >
                  365 * 24 * 60 * 60 * 1000
                }
              >
                <Span class="ml-2 text-red-500">(À réévaluer)</Span>
              </Show>
            </div>

            {/* Comment */}
            <Show when={r.comment?.length}>
              <Aria title="Commentaire" items={r.comment ?? []} />
            </Show>

            {/* Description */}
            <Show when={r.description?.length}>
              <Aria title="Description" items={r.description ?? []} />
            </Show>
          </div>
        )}
      </For>
    </div>
  );
};
