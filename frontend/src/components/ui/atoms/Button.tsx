import { JSX, splitProps, createMemo } from "solid-js";

export type ButtonProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  active?: boolean | null;
  icon?: JSX.Element;
  reverse?: boolean;
};

export const Button = (props: ButtonProps): JSX.Element => {
  // Split props into those we care about vs rest
  const [local, rest] = splitProps(props, [
    "variant",
    "active",
    "class",
    "icon",
    "children",
    "reverse",
    "disabled",
  ]);

  const baseClass =
    "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-current font-medium transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed";

  const variants: Record<
    NonNullable<ButtonProps["variant"]>,
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

  // Compute state reactively
  const state = createMemo<"active" | "disabled" | "base">(() =>
    local.disabled ? "disabled" : local.active ? "active" : "base"
  );

  // Compute final classes reactively
  const classes = createMemo(() => {
    const variant = local.variant ?? "primary";
    const stateClasses = variants[variant][state()];
    return [baseClass, stateClasses, local.class].filter(Boolean).join(" ");
  });

  return (
    <button {...rest} disabled={local.disabled} class={classes()}>
      {local.reverse ? (
        <>
          {local.children}
          {local.icon}
        </>
      ) : (
        <>
          {local.icon}
          {local.children}
        </>
      )}
    </button>
  );
};