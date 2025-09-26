import { Component } from "solid-js";
import { Button } from "../atoms/Button";
import { Span } from "../atoms/Span";
import { MinusIcon, PlusIcon } from "../atoms/Icons";

interface NumberSpinnerProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
  ariaLabel?: string;
  color?: "primary" | "secondary";
}

export const NumberSpinner: Component<NumberSpinnerProps> = (props) => {
  const min = props.min ?? 1;
  const max = props.max ?? 100;
  const step = props.step ?? 1;
  const color = props.color ?? "primary";

  const inc = () => {
    const next = Math.min(max, props.value + step);
    if (next !== props.value) props.onChange(next);
  };
  const dec = () => {
    const next = Math.max(min, props.value - step);
    if (next !== props.value) props.onChange(next);
  };

  // Couleurs héritées directement du Button
  const buttonStyle = "border-none !px-1 !py-1 text-inherit bg-transparent";

  const textColorClass =
    color === "primary"
      ? "text-prim-txt dark:text-prim-txt-d"
      : "text-sec-txt dark:text-sec-txt-d";

  return (
    <div
      class={`inline-flex items-center border rounded overflow-hidden ${textColorClass}`}
      role="group"
      aria-label={props.ariaLabel ?? "Number spinner"}
    >
      <Button
        class={buttonStyle}
        onClick={dec}
        disabled={props.value <= min}
        aria-label="Decrease"
        icon={<MinusIcon class="w-4 h-4" />}
      />
      <Span class={`px-3 ${textColorClass}`}>{props.value}</Span>
      <Button
        class={buttonStyle}
        onClick={inc}
        disabled={props.value >= max}
        aria-label="Increase"
        icon={<PlusIcon class="w-4 h-4" />}
      />
    </div>
  );
};
