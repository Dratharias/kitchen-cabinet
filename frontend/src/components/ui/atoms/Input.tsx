import { JSX, splitProps, createSignal, createMemo } from "solid-js";
import { Span } from "./Span";

export type InputProps = JSX.InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
  icon?: JSX.Element;
};

export const Input = (props: InputProps): JSX.Element => {
  const [local, rest] = splitProps(props, ["class", "error", "icon", "disabled"]);

  const [focused, setFocused] = createSignal(false);

  const baseClass =
    "flex items-center gap-2 px-4 py-2 rounded-md border font-medium outline-none transition-colors duration-200";

  const stateClasses = createMemo(() => {
    if (local.disabled) {
      return "bg-input-bg-dis text-input-txt-dis border-input-border-dis cursor-not-allowed shadow-none dark:bg-input-bg-dis-d dark:text-input-txt-dis-d dark:border-input-border-dis-d";
    }
    if (local.error) {
      return "border-input-border-error text-input-txt-error shadow-none dark:border-input-border-error-d dark:text-input-txt-error-d";
    }
    if (focused()) {
      return "border-input-border-focus text-input-txt-focus bg-input-bg-focus dark:border-input-border-focus-d dark:text-input-txt-focus-d dark:bg-input-bg-focus-d";
    }
    return "border-input-border text-input-txt bg-input-bg dark:border-input-border-d dark:text-input-txt-d dark:bg-input-bg-d";
  });

  const classes = createMemo(() => [baseClass, stateClasses(), local.class].filter(Boolean).join(" "));

  return (
    <div
      class={`flex items-center gap-2 w-full rounded-md transition-shadow duration-200 shadow-md
        ${focused() 
          ? 'shadow-container-focus dark:shadow-container-focus-d'
          : 'shadow-container dark:shadow-container-d'}`}
    >
      {local.icon && <Span class="flex items-center">{local.icon}</Span>}
      <input
        {...rest}
        disabled={local.disabled}
        class={`${classes()} flex-1 w-full ring-1`}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
};