import { JSX } from "solid-js";
import { Input } from "@/components/ui/atoms/Input";
import { Button } from "@/components/ui/atoms/Button";
import { TrashIcon } from "@/components/ui/atoms/Icons";

type SegmentInputProps = {
  title?: string;
  paragraph: string;
  showTitle: boolean;
  showRemoveButton: boolean;
  onTitleChange: (value: string) => void;
  onParagraphChange: (value: string) => void;
  onRemove: () => void;
};

export function SegmentInput(props: SegmentInputProps): JSX.Element {
  return (
    <div class="flex flex-col pb-4 mb-4 last:border-0 justify-center items-center">
      {props.showTitle && (
        <Input
          placeholder="Titre de l'étape"
          value={props.title ?? ""}
          onInput={(e) => props.onTitleChange(e.currentTarget.value)}
        />
      )}

      <textarea
        class="w-full px-3 py-2 ring-1 ring-prim-txt/40 dark:ring-prim-txt-d-40 rounded-md mt-2 text-sm"
        rows={3}
        placeholder="Description"
        value={props.paragraph}
        onInput={(e) => props.onParagraphChange(e.currentTarget.value)}
      />

      <div class="flex mt-1 w-fit">
        {props.showRemoveButton && (
          <Button
            class="!p-0"
            type="button"
            variant="secondary"
            icon={<TrashIcon />}
            onClick={props.onRemove}
          />
        )}
      </div>
    </div>
  );
}
