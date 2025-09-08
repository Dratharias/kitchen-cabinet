import { JSX, splitProps } from "solid-js";

type InputProps = JSX.InputHTMLAttributes<HTMLInputElement>;

const Input = (props: InputProps): JSX.Element => {
  const [local, rest] = splitProps(props, ["class"]);

  const inputClass = `
    w-full flex-1 text-lg sm:text-xl rounded-lg p-2
    border border-fresh-300 dark:border-fresh-600
    bg-fresh-50 dark:bg-forest-400
    text-forest-700 dark:text-harmony-100
    focus:outline-none focus:ring-2
    focus:ring-fresh-400 dark:focus:ring-harmony-300
    ${local.class || ""}
  `;

  return <input class={inputClass} {...rest} />;
};

export default Input;
