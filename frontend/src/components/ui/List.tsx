import { JSX, ParentProps, For } from "solid-js";

export type ListItem = {
  id?: string;
  label: string | JSX.Element;
  onClick?: () => void;
};

type ListProps = ParentProps & {
  items?: ListItem[];
  class?: string;
};

const List = (props: ListProps) => {
  return (
    <ul class={`divide-y divide-forest-200 dark:divide-harmony-600 ${props.class || ""}`}>
      {props.items ? (
        <For each={props.items}>
          {(item, index) => (
            <li
              id={item.id ?? `list-item-${index()}`}
              class="px-4 py-3 text-sm cursor-pointer transition-colors duration-200 hover:bg-forest-200 dark:hover:bg-harmony-700"
              onClick={item.onClick}
            >
              {item.label}
            </li>
          )}
        </For>
      ) : (
        props.children
      )}
    </ul>
  );
};

export default List;
