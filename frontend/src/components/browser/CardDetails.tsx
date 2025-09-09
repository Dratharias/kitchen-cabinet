import { Component, Show } from "solid-js";
import Image from "../ui/Image";
import { List } from "../ui/List";
import Span from "../ui/Span";
import { Publication } from "../../types/publication";
import { surfaceTheme } from "../../theme/colors";

export interface CardDetailsProps extends Publication {}

const CardDetails: Component<CardDetailsProps> = (props) => {
  return (
    <div class={surfaceTheme.Card}>
      <h1 class={surfaceTheme.CardTitle}>
        <Span>{props.title}</Span>
      </h1>

      <Show when={props.thumbnail}>
        <Image
          src={props.thumbnail!}
          alt={props.title}
          class="w-full max-w-md rounded object-cover"
        />
      </Show>

      <Show when={props.type || props.style || props.author}>
        <p class={surfaceTheme.CardSubtitle}>
          {props.type && <Span>{props.type.strValue}</Span>}
          {props.style && <Span> • {props.style.strValue}</Span>}
          {props.author && <Span> • {props.author.strValue}</Span>}
        </p>
      </Show>

      <Show when={props.description && props.description.length > 0}>
        <List
          items={props.description.map((desc, i) => ({
            id: `desc-${i}`,
            label: <Span class={surfaceTheme.CardNotesText}>{desc}</Span>
          }))}
        />
      </Show>

      <Show when={props.note && props.note.length > 0}>
        <div class="mt-4">
          <h2 class={surfaceTheme.CardNotesTitle}>Notes</h2>
          <List
            items={props.note.map((note, i) => ({
              id: `note-${i}`,
              label: <Span class={surfaceTheme.CardNotesText}>{note}</Span>
            }))}
          />
        </div>
      </Show>
    </div>
  );
};

export default CardDetails;
