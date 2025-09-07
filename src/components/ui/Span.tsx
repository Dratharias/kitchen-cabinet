import { JSX } from "solid-js";

type SpanProps = JSX.HTMLAttributes<HTMLSpanElement> & {
  emoji?: string;
  label?: string;
  hideOnSmall?: boolean;
  colorType?: "primary" | "secondary" | "accent" | "active" | "inactive";
};

const colorMap: Record<
  NonNullable<SpanProps["colorType"]>,
  string
> = {
  primary: "text-fresh-600 dark:text-harmony-200",
  secondary: "text-forest-700 dark:text-harmony-100",
  accent: "text-mintsage-500 dark:text-breeze-500",
  active: "text-fresh-600 dark:text-harmony-200",
  inactive: "text-forest-400 dark:text-forest-200",
};

const Span = (props: SpanProps): JSX.Element => {
  const colorClass = props.colorType ? colorMap[props.colorType] : "";

  return (
    <span
      class={`${colorClass} ${
        props.class || ""
      }`}
    >
      {props.emoji && <span class="text-xl">{props.emoji}</span>}
      {props.emoji && props.label && <span class={`ml-2 ${props.hideOnSmall ? "hidden sm:inline" : ""}`}>{props.label}</span>}
      {!props.emoji && props.label && props.label}
    </span>
  );
};

export default Span;
