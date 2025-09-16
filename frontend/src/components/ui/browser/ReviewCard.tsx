import { Component, Show } from "solid-js";
import { Span } from "../html/Span";

export interface ReviewCardProps {
  reviewId: string;
  rating?: number | null;
  comment: string[];
  description: string[];
  buyAgain?: "Y" | "N" | "M" | "I" | null;
  dateReview: string;
  publicationTitle?: string;
}

export const ReviewCard: Component<ReviewCardProps> = (props) => {
  const renderStars = (rating?: number | null) => {
    const r = rating ?? 0;
    const fullStars = Math.floor(r);
    const halfStar = r % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    return (
      <>
        {"★".repeat(fullStars)}
        {halfStar && "☆"}
        {"☆".repeat(emptyStars)}
      </>
    );
  };

  const formatBuyAgain = (value?: "Y" | "N" | "M" | "I" | null): string => {
    switch (value) {
      case "Y": return "Oui";
      case "N": return "Non";
      case "M": return "Peut-être";
      case "I": return "Improbable";
      default: return "";
    }
  };

  return (
    <div class="border rounded p-4 mb-4 flex flex-col md:flex-row gap-4">
      <div class="flex-1 flex flex-col">
        <Span class="font-semibold text-lg text-prim-txt dark:text-prim-txt-d">{props.publicationTitle || "Publication inconnue"}</Span>
        <Span class="text-yellow-500">{renderStars(props.rating)}</Span>

        <Show when={props.comment.length > 0}>
          <div class="mt-2 text-prim-txt dark:text-prim-txt-d">
            {props.comment.map((c) => (
              <p>{c}</p>
            ))}
          </div>
        </Show>

        <Show when={props.description.length > 0}>
          <div class="mt-1 text-sm text-sec-txt dark:text-sec-txt-d">
            {props.description.map((d) => (
              <p>{d}</p>
            ))}
          </div>
        </Show>

        <div class="mt-2 text-sm text-prim-txt dark:text-prim-txt-d">
          Recommanderez-vous à nouveau ? {formatBuyAgain(props.buyAgain)}
        </div>

        <div class="mt-1 text-xs text-sec-txt dark:text-sec-txt-d">
          Date de la review : {new Date(props.dateReview).toLocaleDateString("fr-FR")}
        </div>
      </div>
    </div>
  );
};
