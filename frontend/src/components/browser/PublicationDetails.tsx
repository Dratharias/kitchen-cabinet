import { Component, createSignal } from "solid-js";
import type { ContentDetails } from "../../types/publication";

interface PublicationDetailsProps {
  title: string;
  thumbnail?: string;
  prepTime?: string;
  selectedContent?: ContentDetails;
  ingredients?: string[];
  preparation?: string[];
  description?: string[];
  note?: string[];
  isReview?: boolean;
  category?: "foods" | "feeds" | "unknown";
}

export const PublicationDetails: Component<PublicationDetailsProps> = (props) => {
  const [activeTab, setActiveTab] = createSignal<"ingredients" | "prep">("ingredients");

  return (
    <div class="flex flex-col w-full">
      {props.thumbnail && (
        <img src={props.thumbnail} alt={props.title} class="w-full h-64 object-cover rounded-b" />
      )}

      <h1 class="mt-4 px-4">{props.title}</h1>

      <div class="grid grid-cols-2 gap-4 px-4 mt-2">
        <div>Prep Time: {props.prepTime ?? "-"}</div>
        <div>Yield: {props.selectedContent?.servings ?? "-"}</div>
      </div>

      <div class="grid grid-cols-2 gap-4 px-4 mt-4">
        <div>
          <h3>Description</h3>
          <ul>
            {(props.description ?? []).map((d) => (
              <li>{d}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Notes</h3>
          <ul>
            {(props.note ?? []).map((n) => (
              <li>{n}</li>
            ))}
          </ul>
        </div>
      </div>

      <div class="flex w-full mt-4 px-4 gap-2">
        <button
          class={activeTab() === "ingredients" ? "bg-blue-500 text-white" : ""}
          onClick={() => setActiveTab("ingredients")}
        >
          Ingredients
        </button>
        <button
          class={activeTab() === "prep" ? "bg-blue-500 text-white" : ""}
          onClick={() => setActiveTab("prep")}
        >
          Preparation
        </button>
      </div>

      <div class="mt-4 px-4">
        {activeTab() === "ingredients" ? (
          <ul>
            {(props.ingredients ?? []).map((i) => (
              <li>{i}</li>
            ))}
          </ul>
        ) : (
          <ul>
            {(props.preparation ?? []).map((p) => (
              <li>{p}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
