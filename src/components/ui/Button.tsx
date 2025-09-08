import { JSX } from "solid-js";
import Span from "./Span";

export type ButtonProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  label?: string;
  emoji?: string;
};

const Button = (props: ButtonProps): JSX.Element => {
  const classes = () => {
    const base =
      "flex-1 justify-center px-4 py-2 rounded-md border border-current font-medium transition-colors duration-200 cursor-pointer flex items-center gap-2";
    const color = props.active
      ? "bg-mintsage-60 dark:bg-forest-375 text-forest-900 dark:text-harmony-100"
      : "bg-transparent text-current hover:text-fresh-400 dark:hover:text-forest-400";

    return [base, color, props.class].filter(Boolean).join(" ");
  };

  return (
    <button {...props} class={classes()} aria-label={props.label}>
      <Span emoji={props.emoji} label={props.label} hideOnSmall />
    </button>
  );
};

export default Button;
