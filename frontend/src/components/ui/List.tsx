import { JSX, ParentProps, For } from "solid-js";
import { surfaceTheme } from "../../theme/colors";

export type ListItem = {
  id?: string;
  label: string | JSX.Element;
  onClick?: () => void;
};

type ListProps = ParentProps & {
  items?: ListItem[];
  class?: string;
};

export const List = (props: ListProps) => {
  return (
    <ul class={`${surfaceTheme.List} ${props.class || ""}`}>
      {props.items ? (
        <For each={props.items}>
          {(item, index) => {
            const itemClass = [
              "px-4 py-3 text-sm transition-colors duration-200",
              item.onClick ? surfaceTheme.ListItemInteractive : surfaceTheme.ListItemStatic
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <li id={item.id ?? `list-item-${index()}`} class={itemClass} onClick={item.onClick}>
                {item.label}
              </li>
            );
          }}
        </For>
      ) : (
        props.children
      )}
    </ul>
  );
};
