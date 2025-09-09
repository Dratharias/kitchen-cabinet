import { JSX, splitProps } from "solid-js";
import { colorTheme } from "../../theme/colors";

export type ButtonProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  icon?: JSX.Element;
  reverse?: boolean;
};

const Button = (props: ButtonProps): JSX.Element => {
  const [local, rest] = splitProps(props, ["active", "class", "icon", "children", "reverse"]);

  const classes = () => {
    const base =
      "flex-1 justify-center px-4 py-2 rounded-md border border-current font-medium transition-colors duration-200 cursor-pointer flex items-center gap-2";
    const color = local.active ? colorTheme.ButtonActive : colorTheme.Button;

    return [base, color, local.class].filter(Boolean).join(" ");
  };

  return (
    <button {...rest} class={classes()}>
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

export default Button;
