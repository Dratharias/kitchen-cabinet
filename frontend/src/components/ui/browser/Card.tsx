import { Component } from "solid-js";
import { useNavigate } from "@solidjs/router";
import Button from "../html/Button";
import Span from "../html/Span";
import Image from "../html/Image";
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

  // Use selectedContent if available
  const content = () => props.publication.selectedContent;

  const prepTime = () => props.publication.prepTime || (content()?.prepTimes?.reduce((sum, t) => sum + t.duration, 0) ?? null);
  const servings = () => content()?.servings;

  return (
    <Button
      class={`flex gap-4 p-4 max-h-48 overflow-hidden`}
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
          <h3 class={`line-clamp-2`}>
            <Span>{props.publication.title}</Span>
          </h3>

          {props.publication.description?.[0] && (
            <p class={`text-sm line-clamp-3`}>
              <Span>{props.publication.description[0]}</Span>
            </p>
          )}

          {(props.publication.type || props.publication.style) && (
            <Span class={`text-xs`}>
              {props.publication.type?.strValue}
              {props.publication.style ? ` • ${props.publication.style.strValue}` : ""}
            </Span>
          )}
        </div>

        {/* PrepTime & Yield */}
        {(prepTime() || servings()) && (
          <Span class={`mt-2 text-xs`}>
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
