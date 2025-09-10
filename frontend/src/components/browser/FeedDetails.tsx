import { Component, createSignal, Show } from "solid-js";
import Image from "../ui/Image";
import Span from "../ui/Span";
import Button from "../ui/Button";
import Aria from "../ui/Aria";
import Checklist from "../ui/Checklist";
import { Publication } from "../../types/publication";
import { surfaceTheme } from "../../theme/colors";

export interface FeedDetailsProps extends Publication {
  ingredients?: string[];   // array of ingredient strings
  preparation?: string[];   // array of preparation steps
  prepTime?: string;        // optional prep time
  yield?: string;           // optional yield
}

const FeedDetails: Component<FeedDetailsProps> = (props) => {
  const [activeTab, setActiveTab] = createSignal<"ingredients" | "prep">("ingredients");

  return (
    <div class="flex flex-col w-full">
      {/* Thumbnail top full width */}
      <Show when={props.thumbnail}>
        <Image
          src={props.thumbnail!}
          alt={props.title}
          class="w-full h-64 object-cover rounded-b"
        />
      </Show>

      {/* Title */}
      <h1 class={`${surfaceTheme.CardTitle} mt-4 px-4`}>{props.title}</h1>

      {/* Two-column stats: prep time & yield */}
      <div class="grid grid-cols-2 gap-4 px-4 mt-2">
        <div>
          <Span class={surfaceTheme.CardNotesText}>Prep Time: {props.prepTime ?? "-"}</Span>
        </div>
        <div>
          <Span class={surfaceTheme.CardNotesText}>Yield: {props.yield ?? "-"}</Span>
        </div>
      </div>

      {/* Two-column Aria: Description / Note */}
      <div class="grid grid-cols-2 gap-4 px-4 mt-4">
        <Aria title="Description" items={props.description ?? []} />
        <Aria title="Notes" items={props.note ?? []} />
      </div>

      {/* Toggle Buttons */}
      <div class="flex w-full mt-4 px-4 gap-2">
        <Button
          class={activeTab() === "ingredients" ? "bg-blue-500 text-white" : ""}
          onClick={() => setActiveTab("ingredients")}
        >
          Ingredients
        </Button>
        <Button
          class={activeTab() === "prep" ? "bg-blue-500 text-white" : ""}
          onClick={() => setActiveTab("prep")}
        >
          Preparation
        </Button>
      </div>

      {/* Checklist full width */}
      <div class="mt-4 px-4">
        <Show when={activeTab() === "ingredients"}>
          <Checklist items={props.ingredients ?? []} />
        </Show>
        <Show when={activeTab() === "prep"}>
          <Checklist items={props.preparation ?? []} />
        </Show>
      </div>
    </div>
  );
};

export default FeedDetails;
