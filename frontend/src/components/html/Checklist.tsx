import { Component, createSignal, For } from "solid-js";
import { List } from "./List";
import Span from "./Span";
import { surfaceTheme } from "../../../theme/colors";

export interface ChecklistProps {
  items: string[];
}

const Checklist: Component<ChecklistProps> = (props) => {
  const [checked, setChecked] = createSignal<boolean[]>(props.items.map(() => false));

  const toggle = (index: number) => {
    setChecked((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  return (
    <div class="w-full">
      <For each={props.items}>
        {(item, i) => (
          <div class="flex items-center gap-2 p-2 border-b border-gray-200 dark:border-gray-700 cursor-pointer" onClick={() => toggle(i())}>
            <input type="checkbox" checked={checked()[i()]} class="cursor-pointer" readOnly />
            <Span class={surfaceTheme.CardNotesText}>{item}</Span>
          </div>
        )}
      </For>
    </div>
  );
};

export default Checklist;
