import { JSX } from "solid-js";
import { Button } from "../atoms/Button";
import { CloseIcon } from "../atoms/Icons";

export type ChipProps = {
  label: string;
  onRemove?: () => void;
  class?: string;
};

/**
 * Composant réutilisable pour afficher un tag/Chip
 */
export function Chip(props: ChipProps): JSX.Element {
  return (
    <Button
      variant="noDecoration"
      class={`bg-gray-100 text-gray-800 rounded-md text-sm w-fit px-2 py-1 ${
        props.class || ""
      }`}
      icon={props.onRemove ? <CloseIcon /> : undefined}
      reverse={Boolean(props.onRemove)}
      onClick={props.onRemove}
    >
      {props.label}
    </Button>
  );
}
