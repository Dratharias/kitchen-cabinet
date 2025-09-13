import { JSX, ParentProps, For, splitProps, createMemo } from "solid-js";
import Span from "./Span";
import Button from "./Button";

export type ListItem = {
  id?: string;
  label: string | JSX.Element;
  onClick?: () => void;
  class?: string;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  active?: boolean;
  icon?: JSX.Element;
};

type ListProps = ParentProps & {
  items?: ListItem[];
  class?: string;
  itemClass?: string;
};

export const List = (props: ListProps) => {
  const baseClass =
    "flex items-center gap-2 px-4 py-2 w-full text-left border-none rounded-none font-medium transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed";

  const variants: Record<
    NonNullable<ListItem["variant"]>,
    Record<"base" | "active" | "disabled", string>
  > = {
    primary: {
      base:
        "bg-btn-prim text-prim-txt hover:bg-btn-prim-hov hover:text-prim-txt-hov dark:bg-btn-prim-d dark:text-prim-txt-d dark:hover:bg-btn-prim-hov-d dark:hover:text-prim-txt-hov-d",
      active: "bg-btn-prim-act text-prim-txt-act dark:bg-btn-prim-act-d dark:text-prim-txt-act-d",
      disabled: "bg-btn-dis text-prim-txt-dis dark:bg-btn-dis-d dark:text-prim-txt-dis-d",
    },
    secondary: {
      base:
        "bg-btn-sec text-sec-txt hover:bg-btn-sec-hov hover:text-sec-txt-hov dark:bg-btn-sec-d dark:text-sec-txt-d dark:hover:bg-btn-sec-hov-d dark:hover:text-sec-txt-hov-d",
      active: "bg-btn-sec-act text-sec-txt-act dark:bg-btn-sec-act-d dark:text-sec-txt-act-d",
      disabled: "bg-btn-dis text-sec-txt-dis dark:bg-btn-dis-d dark:text-sec-txt-dis-d",
    },
  };

  return (
    <ul class={props.class ?? ""}>
      {props.items ? (
        <For each={props.items}>
          {(item, index) => {
            const state = createMemo<"active" | "disabled" | "base">(() =>
              item.disabled ? "disabled" : item.active ? "active" : "base"
            );

            const classes = createMemo(() => {
              const variant = item.variant ?? "secondary";
              const stateClasses = variants[variant][state()];
              return [baseClass, stateClasses, props.itemClass, item.class].filter(Boolean).join(" ");
            });

            return (
              <div class="rounded
                block w-full border border-sm
                text-prim-txt dark:text-prim-txt-d
                bg-btn-prim dark:bg-btn-prim-d
                hover:bg-btn-prim-hov dark:hover:bg-btn-prim-hov-d
              ">
                <li
                  id={item.id ?? `list-item-${index()}`}
                  class="block w-full p-1"
                >
                  <Button
                    onClick={item.onClick}
                    disabled={item.disabled}
                    class={`w-full text-inherit bg-inherit border-none`}
                  >
                    {item.icon}
                    <Span>{item.label}</Span>
                  </Button>
                </li>
              </div>
            );
          }}
        </For>
      ) : (
        props.children
      )}
    </ul>
  );
};