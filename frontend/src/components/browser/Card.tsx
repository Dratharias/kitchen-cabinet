import { Component } from "solid-js";
import { useNavigate } from "@solidjs/router";
import Button from "../ui/Button";
import Image from "../ui/Image";
import Span from "../ui/Span";
import { Publication } from "../../types/publication";
import { colorTheme } from "../../theme/colors";

export interface CardProps {
  publication: Publication;
  pathPrefix: "feeds" | "foods";
}

const Card: Component<CardProps> = (props) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/${props.pathPrefix}/${props.publication.publicationId}`);
  };

  const firstContent = () => props.publication.resources?.[0]?.contents?.[0];

  // Get total prep time from first content if available
  const prepTime = () => {
    const times = firstContent()?.prepTimes;
    if (!times || times.length === 0) return null;
    const total = times.reduce((sum, t) => sum + t.duration, 0);
    return total; // assuming duration is in minutes
  };

  const servings = () => firstContent()?.servings;

  return (
    <Button
      class={`${colorTheme.Button} flex gap-4 p-4 max-h-48 overflow-hidden`}
      onClick={handleClick}
    >
      {props.publication.thumbnail && (
        <Image
          src={props.publication.thumbnail}
          alt={props.publication.title}
          class="w-24 h-24 object-cover rounded flex-shrink-0"
        />
      )}

      <div class="flex-1 text-start flex flex-col justify-between">
        <div>
          <h3 class={`${colorTheme.CardTitle} line-clamp-2`}>
            <Span>{props.publication.title}</Span>
          </h3>

          {props.publication.description?.[0] && (
            <p class={`${colorTheme.CardDescription} text-sm line-clamp-3`}>
              <Span>{props.publication.description[0]}</Span>
            </p>
          )}

          {(props.publication.type || props.publication.style) && (
            <Span class={`${colorTheme.CardMeta} text-xs`}>
              {props.publication.type?.strValue}
              {props.publication.style ? ` • ${props.publication.style.strValue}` : ""}
            </Span>
          )}
        </div>

        {/* PrepTime & Yield */}
        {(prepTime() || servings()) && (
          <Span class={`${colorTheme.CardMeta} mt-2 text-xs`}>
            {prepTime() && <>⏱ {prepTime()} min</>}
            {prepTime() && servings() && " • "}
            {servings() && <>Yield: {servings()}</>}
          </Span>
        )}
      </div>
    </Button>
  );
};

export default Card;
