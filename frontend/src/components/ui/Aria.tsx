import { Component } from "solid-js";
import { List } from "./List";
import Span from "./Span";
import { surfaceTheme } from "../../theme/colors";

export interface AriaProps {
  title?: string;
  items: string[];
}

const Aria: Component<AriaProps> = (props) => {
  return (
    <div class="w-full">
      {props.title && <h2 class={surfaceTheme.CardNotesTitle}>{props.title}</h2>}
      <List
        items={props.items.map((item, i) => ({
          id: `${props.title ?? "aria"}-${i}`,
          label: <Span class={surfaceTheme.CardNotesText}>{item}</Span>,
        }))}
      />
    </div>
  );
};

export default Aria;
