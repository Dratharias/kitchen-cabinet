import { JSX, splitProps } from "solid-js";
import { surfaceTheme } from "../../theme/colors";

type InputProps = JSX.InputHTMLAttributes<HTMLInputElement>;

const Input = (props: InputProps): JSX.Element => {
  const [local, rest] = splitProps(props, ["class"]);

  const inputClass = `${surfaceTheme.Input} ${local.class || ""}`;

  return <input class={inputClass} {...rest} />;
};

export default Input;
