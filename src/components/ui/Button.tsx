import { JSX } from "solid-js";
import Span from "./Span";

// Type pour le composant générique
export type ButtonProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  label?: string;
  emoji?: string;
};

const baseButtonClasses = `
  p-2 rounded-md transition-colors flex items-center justify-center
  hover:cursor-pointer
`;
const sizeClasses = "h-full w-fit flex-1 sm:h-fit sm:w-1/4";

// Classes selon état
const activeClasses = `
  text-fresh-600 
  dark:text-harmony-200 
  hover:text-fresh-400 
  dark:hover:text-harmony-100
`;

const inactiveClasses = `
  text-forest-400 
  dark:text-forest-200 
  hover:text-forest-600 
  dark:hover:text-harmony-300
`;

const Button = (props: ButtonProps): JSX.Element => {
  return (
    <button
      {...props}
      class={`${baseButtonClasses} ${sizeClasses} relative group ${props.class || ""}`}
      aria-label={props.label}
    >
      <Span
        emoji={props.emoji}
        label={props.label}
        hideOnSmall
        colorType={props.active ? "active" : "inactive"}
      />
    </button>
  );
};

export default Button;
