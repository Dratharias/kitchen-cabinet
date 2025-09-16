import { Component } from "solid-js";
import { useNavigate } from "@solidjs/router";
import Button from "../html/Button";
import { Span } from "../html/Span";
import Image from "../html/Image";
import Stars from "../utilities/Stars";
import { MappedPublicationData } from "../../../types/publication";

export interface CardProps {
  publication: MappedPublicationData;
  pathPrefix: "feeds" | "foods";
}

const Card: Component<CardProps> = (props) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/${props.pathPrefix}/${props.publication.publicationId}`);
  };

  const content = () => props.publication.selectedContent;
  const prepTime = () =>
    props.publication.prepTime ||
    (content()?.prepTimes?.reduce((sum, t) => sum + t.duration, 0) ?? null);
  const servings = () => content()?.servings;

  return (
    <Button
      class="flex text-left !px-0 !py-0 max-h-48 w-full overflow-hidden border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
      onClick={handleClick}
    >
      {/* Left: Thumbnail + Stars */}
      {props.publication.thumbnail && (
      <div class="flex flex-col w-24 h-full rounded-none overflow-hidden relative">
        <Image
          src={props.publication.thumbnail}
          alt={props.publication.title}
          class="w-full h-full object-cover"
        />
        {props.publication.averageRating != null && props.publication.averageRating > 0 && (
          <div class="absolute bottom-1 left-0 w-full flex flex-col items-center justify-center p-1">
            <Stars score={props.publication.averageRating * 2} readonly size={14} />
          </div>
        )}
      </div>
    )}

      {/* Right: Info */}
      <div class="flex-1 flex flex-col p-1 md:p-2 justify-between ">
        <div>
          {/* Title */}
          <h3 class="line-clamp-2 font-semibold text-sm">
            {props.publication.title}
          </h3>

          {/* Description */}
          {props.publication.description?.[0] && (
            <p class="text-xs line-clamp-2 mt-1">
              {props.publication.description[0]}
            </p>
          )}

          {/* Type & Style */}
          {(props.publication.type || props.publication.style) && (
            <div class="text-xs mt-1">
              {props.publication.type?.strValue}
              {props.publication.style ? ` • ${props.publication.style.strValue}` : ""}
            </div>
          )}

          {/* Tags */}
          {props.publication.tags.length > 0 && (
            <div class="flex flex-wrap gap-1 mt-1">
              {props.publication.tags.map((tag) => (
                <Span class="text-[9px] rounded px-1 py-0.5">{tag.strValue}</Span>
              ))}
            </div>
          )}

          {/* Author */}
          {props.publication.author?.strValue && (
            <Span class="text-xs mt-1 block">
              By {props.publication.author.strValue}
            </Span>
          )}
        </div>

        {/* Bottom: Prep Time & Yield */}
        <div class="flex items-center gap-3 text-xs text-gray-600 mt-2">
          {prepTime() && <span class="flex items-center gap-1">⏱ {prepTime()} min</span>}
          {servings() && <span class="flex items-center gap-1">🍽 {servings()}</span>}
        </div>
      </div>
    </Button>
  );
};

export default Card;
