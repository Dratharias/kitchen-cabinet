import { JSX } from "solid-js";
import { Button } from "@/components/ui/atoms/Button";
import { TrashIcon } from "@/components/ui/atoms/Icons";
import { Segment } from "./segment.types";

type SegmentEditorProps = {
  segment: Segment;
  segmentIndex: number;
  stepIndex: number;
  contentIndex: number;
  setForm: (...args: any[]) => void;
  removeSegment: (stepIndex: number, segmentIndex: number) => void;
  showRemoveButton: boolean;
};

export function SegmentEditor(props: SegmentEditorProps): JSX.Element {
  const handleParagraphChange = (value: string) => {
    props.setForm(
      "contents",
      props.contentIndex,
      "steps",
      props.stepIndex,
      "segments",
      props.segmentIndex,
      "paragraph",
      value,
    );
  };

  return (
    <div class="flex mb-4 last:border-0 justify-center items-center">
      <textarea
        class="w-full px-3 py-2 ring-1 ring-prim-txt/40 dark:ring-prim-txt-d-40 rounded-md mt-2 mr-4 text-sm"
        rows={3}
        placeholder="Description"
        value={props.segment.paragraph}
        onInput={(e) => handleParagraphChange(e.currentTarget.value)}
      />

      <div class="flex mt-1 w-fit">
        {props.showRemoveButton ? (
          <Button
            class="!p-0"
            type="button"
            variant="secondary"
            icon={<TrashIcon />}
            onClick={() =>
              props.removeSegment(props.stepIndex, props.segmentIndex)
            }
          />
        ) : (
          <div class="p-4" />
        )}
      </div>
    </div>
  );
}
