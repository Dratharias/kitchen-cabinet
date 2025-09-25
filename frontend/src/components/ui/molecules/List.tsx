import { JSX, ParentProps, For, createMemo } from "solid-js";
import { Button } from "../atoms/Button";
import { Checklist } from "../atoms/Checklist";
import { Span } from "../atoms/Span";

export type ListItem = {
  id?: string;
  label: string | JSX.Element;
  onClick?: () => void;
  class?: string;
  variant?: "primary" | "secondary";
  regularMode?: boolean;
  disabled?: boolean;
  active?: boolean;
  icon?: JSX.Element;
};

type ListProps = ParentProps & {
  items?: ListItem[] | string[]; // string[] pour checklist
  class?: string;
  itemClass?: string;
  mode?: "button" | "regular" | "checklist";
  variant?: "primary" | "secondary";
};

const isListItem = (item: string | ListItem): item is ListItem =>
  typeof item !== "string";

export const List = (props: ListProps) => {
  // Si mode checklist, on délègue à ton composant Checklist
  if (props.mode === "checklist" && props.items) {
    const checklistItems = props.items as string[];
    return <Checklist items={checklistItems} />;
  }

  const baseItemClass =
    "flex items-center text-left font-medium transition-colors duration-200 ";

  const ulVariants: Record<
    NonNullable<ListProps["variant"]>,
    Record<"base" | "active" | "disabled", string>
  > = {
    primary: {
      base: "border-primary-500 dark:border-primary-600 text-prim-txt dark:text-prim-txt-d",
      active:
        "ring-2 ring-primary-400 text-prim-txt-ac dark:text-prim-txt-ac-d",
      disabled:
        "opacity-50 cursor-not-allowed text-prim-txt-dis dark:text-prim-txt-dis-d",
    },
    secondary: {
      base: "border-secondary-500 dark:border-secondary-600 text-sec-txt dark:text-sec-txt-d",
      active: "ring-2 ring-secondary-400",
      disabled: "opacity-50 cursor-not-allowed",
    },
  };

  const ulClass = createMemo(() => {
    const variant = props.variant ?? "secondary";
    const baseUlClasses = `border rounded-md ${props.class ?? ""}`;
    const variantClasses = ulVariants[variant]?.base ?? "";
    return [baseUlClasses, variantClasses].filter(Boolean).join(" ");
  });

  return (
    <ul class={ulClass()}>
      <For each={props.items}>
        {(item, index) => {
          if (!isListItem(item)) return null; // TypeScript safe

          const state = createMemo<"active" | "disabled" | "base">(() =>
            item.disabled ? "disabled" : item.active ? "active" : "base",
          );

          const liClasses = createMemo(() => {
            const itemBase = "w-full text-left rounded-md";
            const itemState = item.disabled
              ? "opacity-50 cursor-not-allowed"
              : item.active
                ? "bg-gray-200 dark:bg-gray-700"
                : "";
            return [
              baseItemClass,
              itemBase,
              itemState,
              props.itemClass,
              item.class,
            ]
              .filter(Boolean)
              .join(" ");
          });

          const regularMode = item.regularMode ?? props.mode === "regular";

          return (
            <li id={item.id ?? `list-item-${index()}`} class={liClasses()}>
              {regularMode ? (
                <Span class="w-full block p-1 sm:p-2">{item.label}</Span>
              ) : (
                <Button
                  onClick={item.onClick}
                  disabled={item.disabled}
                  class="w-full justify-start rounded-none border-none"
                >
                  {item.icon}
                  <Span>{item.label}</Span>
                </Button>
              )}
            </li>
          );
        }}
      </For>
      {!props.items && props.children}
    </ul>
  );
};
