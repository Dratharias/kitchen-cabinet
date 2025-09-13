import { JSX, splitProps, createMemo } from "solid-js";

export type SpanProps = JSX.HTMLAttributes<HTMLSpanElement> & {
  hideOnSmall?: boolean;
};

const Span = (props: SpanProps): JSX.Element => {
  const [local, rest] = splitProps(props, ["class", "children", "hideOnSmall"]);

  const baseClass = "transition-colors duration-200";

  const classes = createMemo(() =>
    [
      baseClass,
      local.hideOnSmall ? "hidden sm:inline" : "",
      local.class, // prend les classes tailwind comme `text-prim-txt`
    ]
      .filter(Boolean)
      .join(" ")
  );

  return (
    <span {...rest} class={classes()}>
      {local.children}
    </span>
  );
};

export default Span;
