import { Component, For } from "solid-js";
import { Span } from "./Span";

export interface ChecklistProps {
  items: string[];
  checked?: boolean[];
  onChange?: (index: number, value: boolean) => void;
}

export const Checklist: Component<ChecklistProps> = (props) => {
  const toggle = (index: number) => {
    if (!props.onChange) return;
    props.onChange(index, !(props.checked?.[index] ?? false));
  };

  return (
    <div class="w-full">
      <For each={props.items}>
        {(item, i) => (
          <div
            class="flex items-center gap-2 p-2 border-b border-gray-200 dark:border-gray-700 cursor-pointer"
            onClick={() => toggle(i())}
          >
            <input
              type="checkbox"
              checked={props.checked?.[i()] ?? false}
              class="cursor-pointer"
              readOnly
            />
            <Span>{item}</Span>
          </div>
        )}
      </For>
    </div>
  );
};
