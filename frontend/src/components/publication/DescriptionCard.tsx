import { Button } from "../ui/atoms/Button";
import { TrashIcon } from "../ui/atoms/Icons";
import { Span } from "../ui/atoms/Span";

export function DescriptionCard(props: {
  index: number;
  item: { text: string; id: string };
  label: string;
  placeholder: string;
  actions: {
    updateDescription?: (index: number, text: string) => void;
    updateNote?: (index: number, text: string) => void;
    removeDescription?: (index: number) => void;
    removeNote?: (index: number) => void;
  };
  type: "description" | "note";
}) {
  const updateAction =
    props.type === "description"
      ? props.actions.updateDescription
      : props.actions.updateNote;

  const removeAction =
    props.type === "description"
      ? props.actions.removeDescription
      : props.actions.removeNote;

  return (
    <div class="mb-6">
      <div class="flex items-center justify-between mb-2">
        <Span class="text-sm font-medium w-full">
          {props.label} {props.index + 1}
        </Span>
        <Button
          type="button"
          variant="secondary"
          icon={<TrashIcon />}
          onClick={() => removeAction?.(props.index)}
          class="!p-0"
        />
      </div>

      <textarea
        class="w-full px-3 py-2 rounded-md resize-none ring-1 ring-prim-txt/40 dark:ring-prim-txt-d-40"
        rows={props.type === "description" ? "3" : "2"}
        placeholder={props.placeholder}
        value={props.item.text}
        onInput={(e) => {
          const target = e.currentTarget;
          updateAction?.(props.index, target.value);
        }}
      />
    </div>
  );
}
