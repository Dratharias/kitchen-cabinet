import { Component, For, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { Button } from "../atoms/Button";
import { Span } from "../atoms/Span";
import { Image } from "../atoms/Image";
import { Stars } from "./Stars";
import { MappedPublicationData } from "../../../shared-types/publication";

export interface CardProps {
  publication: MappedPublicationData;
  pathPrefix: "feeds" | "reviews";
}

const Card: Component<CardProps> = (props) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/${props.pathPrefix}/${props.publication.publicationId}`);
  };

  return (
    <Button
      class="flex text-left !px-0 !py-0 max-h-48 w-full overflow-hidden border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
      onClick={handleClick}
    >
      {/* Left: Thumbnail + Stars */}
      <Show when={props.publication.thumbnail}>
        <div class="flex flex-col w-24 h-full overflow-hidden relative">
          <Image
            src={props.publication.thumbnail!}
            alt={props.publication.title}
            class="w-full h-full object-cover"
          />
          <Show
            when={props.publication.averageRating != null && props.publication.averageRating > 0}
          >
            <div class="absolute bottom-1 left-0 w-full flex justify-center p-1">
              <Stars score={props.publication.averageRating * 2} readonly size={14} />
            </div>
          </Show>
        </div>
      </Show>

      {/* Right: Info */}
      <div class="flex-1 flex flex-col p-1 md:p-2 justify-between">
        <div>
          {/* Title */}
          <h3 class="line-clamp-2 font-semibold text-sm">{props.publication.title}</h3>

          {/* Description */}
          <For each={props.publication.description}>
            {(desc) => <p class="text-xs line-clamp-2 mt-1">{desc}</p>}
          </For>

          {/* Tags */}
          <Show when={props.publication.tags?.length}>
            <div class="flex flex-wrap gap-1 mt-1">
              <For each={props.publication.tags}>
                {(tag) => <Span class="text-[9px] rounded px-1 py-0.5">{tag}</Span>}
              </For>
            </div>
          </Show>
        </div>

        {/* Bottom: totalPrepTime & servings */}
        <div class="flex items-center gap-3 text-xs text-gray-600 mt-2">
          <Show when={props.publication.prepTime && props.publication.prepTime != "N/A"}>
            <span class="flex items-center gap-1">⏱ {props.publication.prepTime}</span>
          </Show>
          <Show when={props.publication.servings && props.publication.servings > 0}>
            <span class="flex items-center gap-1">🍽 {props.publication.servings}</span>
          </Show>
        </div>
      </div>
    </Button>
  );
};

export default Card;
