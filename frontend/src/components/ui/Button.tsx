import { JSX, splitProps } from "solid-js";

export type ButtonProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  icon?: JSX.Element;
};

const Button = (props: ButtonProps): JSX.Element => {
  const [local, rest] = splitProps(props, ["active", "class", "icon", "children"]);

  const classes = () => {
    const base =
      "flex-1 justify-center px-4 py-2 rounded-md border border-current font-medium transition-colors duration-200 cursor-pointer flex items-center gap-2";
    const color = local.active
      ? "bg-mintsage-60 dark:bg-forest-375 text-forest-900 dark:text-harmony-100"
      : "bg-transparent text-current hover:text-fresh-400 dark:hover:text-forest-400";

    return [base, color, local.class].filter(Boolean).join(" ");
  };

  return (
    <button {...rest} class={classes()}>
      {local.icon}
      {local.children}
    </button>
  );
};

export default Button;
