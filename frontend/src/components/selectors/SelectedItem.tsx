import { Button } from "../ui/atoms/Button";
import { CloseIcon } from "../ui/atoms/Icons";

type SelectedItemProps = {
  label: string;
  onRemove: () => void;
};

export function SelectedItem(props: SelectedItemProps) {
  return (
    <Button
      variant="noDecoration"
      onClick={props.onRemove}
      class="bg-gray-100 text-gray-800 rounded-md text-sm w-fit"
      icon={<CloseIcon />}
      reverse
    >
      {props.label}
    </Button>
  );
}
