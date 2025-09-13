import { Component } from "solid-js";
import { List } from "./List";
import Span from "./Span";

export interface AriaProps {
  title?: string;
  items: string[];
}

const Aria: Component<AriaProps> = (props) => {
  return (
    <div class="w-full">
      {props.title && <h2>{props.title}</h2>}
      <List
        items={props.items.map((item, i) => ({
          id: `${props.title ?? "aria"}-${i}`,
          label: <Span>{item}</Span>,
        }))}
      />
    </div>
  );
};

export default Aria;
