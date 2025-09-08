import { JSX } from "solid-js";

type SpanProps = JSX.HTMLAttributes<HTMLSpanElement> & {
  hideOnSmall?: boolean;
};

const Span = (props: SpanProps): JSX.Element => {
  return (
    <span
      class={`${props.class || ""} ${props.hideOnSmall ? "hidden sm:inline" : ""}`}
      {...props}
    >
      {props.children}
    </span>
  );
};

export default Span;