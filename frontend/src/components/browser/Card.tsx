import { Component } from "solid-js";
import { useNavigate } from "@solidjs/router";
import Button from "../ui/Button";
import Image from "../ui/Image";
import Span from "../ui/Span";
import { Publication } from "../../types/publication";
import { colorTheme } from "../../theme/colors";

export interface CardProps {
  publication: Publication;
  pathPrefix: "feeds" | "library";
}

const Card: Component<CardProps> = (props) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/${props.pathPrefix}/${props.publication.publicationId}`);
  };

  return (
    <Button class={`${colorTheme.Button}`} onClick={handleClick}>
        {props.publication.thumbnail && (
            <Image
            src={props.publication.thumbnail}
            alt={props.publication.title}
            class="w-24 h-24 object-cover rounded"
            />
        )}
        <div class="flex-1 text-start">
            <h3 class={`${colorTheme.CardTitle}`}>
            <Span>{props.publication.title}</Span>
            </h3>
            {props.publication.description?.[0] && (
            <p class={`${colorTheme.CardDescription}`}>
                <Span>{props.publication.description[0]}</Span>
            </p>
            )}
            {(props.publication.type || props.publication.style) && (
            <Span class={`${colorTheme.CardMeta}`}>
                {props.publication.type?.strValue}{props.publication.style ? ` • ${props.publication.style.strValue}` : ""}
            </Span>
            )}
        </div>
        </Button>
  );
};

export default Card;
