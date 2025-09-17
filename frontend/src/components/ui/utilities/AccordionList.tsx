import { Component, createSignal } from "solid-js";
import { ChevronIcon } from "../atoms/Icons";
import { Span } from "../atoms/Span";
import { List, ListItem } from "../atoms/List";
import Button from "../atoms/Button";

interface AccordionListProps {
  title: string;
  items: (string | ListItem)[];
  defaultOpen?: boolean;
  class?: string;
}

export const AccordionList: Component<AccordionListProps> = (props) => {
  const [open, setOpen] = createSignal(props.defaultOpen ?? false);

  // Normalisation des items
  const normalizedItems: ListItem[] = props.items.map((item, i) =>
    typeof item === "string"
      ? { id: `toggle-item-${i}`, label: item }
      : item
  );

  const isEmpty = normalizedItems.length === 0;

  return (
    <div class={`w-full ${props.class ?? ""}`}>
      {isEmpty ? (
        // Pas de bouton ni chevron si vide
        <Button
            type="button"
            disabled
            class="flex items-center !text-sec-txt dark:!text-sec-txt-d justify-between w-full px-2 py-1 font-medium rounded"
          >
            <Span class="flex items-center w-full font-medium">
            {props.title}
            </Span>
          </Button>
      ) : (
        <>
          <Button
            type="button"
            class="flex items-center justify-between w-full px-2 py-1 font-medium rounded"
            onClick={() => setOpen((o) => !o)}
          >
            <Span>{props.title}</Span>
            <ChevronIcon
              class={`w-5 h-5 transform transition-transform ${
                open() ? "rotate-0" : "-rotate-90"
              }`}
            />
          </Button>

          {open() && (
            <List
              items={normalizedItems}
              class="mt-1 text-sm"
              itemClass="px-2 py-1"
              mode="regular"
            />
          )}
        </>
      )}
    </div>
  );
};
