import { useState, useMemo } from "react";
import { ChevronIcon } from "../atoms/Icons";
import { Span } from "../atoms/Span";
import { Button } from "../atoms/Button";
import { ListItem, List } from "../molecules/List";

interface AccordionListProps {
  title: string;
  items: (string | ListItem)[];
  defaultOpen?: boolean;
  className?: string;
}

export function AccordionList({
  title,
  items,
  defaultOpen = false,
  className,
}: AccordionListProps) {
  const [open, setOpen] = useState(defaultOpen);

  // Normalise les items
  const normalizedItems = useMemo<ListItem[]>(
    () =>
      items.map((item, i) =>
        typeof item === "string"
          ? { id: `toggle-item-${i}`, label: item }
          : item
      ),
    [items]
  );

  const isEmpty = normalizedItems.length === 0;

  return (
    <div className={`w-full ${className ?? ""}`}>
      {isEmpty ? (
        <Button
          type="button"
          disabled
          className="flex items-center !text-sec-txt dark:!text-sec-txt-d justify-between w-full px-2 py-1 font-medium rounded"
        >
          <Span className="flex items-center w-full font-medium">
            {title}
          </Span>
        </Button>
      ) : (
        <>
          <Button
            type="button"
            className="flex items-center justify-between w-full px-2 py-1 font-medium rounded"
            onClick={() => setOpen((o) => !o)}
          >
            <Span>{title}</Span>
            <ChevronIcon
              className={`w-5 h-5 transform transition-transform ${open ? "rotate-0" : "-rotate-90"
                }`}
            />
          </Button>

          {open && (
            <List
              items={normalizedItems}
              className="mt-1 text-sm"
              itemClass="px-2 py-1"
              mode="regular"
            />
          )}
        </>
      )}
    </div>
  );
}
