import { JSX } from "solid-js";

type SpanProps = JSX.HTMLAttributes<HTMLSpanElement> & {
  emoji?: string;
  label?: string;
  hideOnSmall?: boolean;
};


const Span = (props: SpanProps): JSX.Element => {
  return (
    <span
      class={`${props.class || ""}`}
    >
      {props.emoji && <span class="text-xl">{props.emoji}</span>}
      {props.emoji && props.label && <span class={`ml-2 ${props.hideOnSmall ? "hidden sm:inline" : ""}`}>{props.label}</span>}
      {!props.emoji && props.label && props.label}
    </span>
  );
};

export default Span;
