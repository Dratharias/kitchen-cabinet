import { For, JSX } from "solid-js";
import { Input } from "@/components/ui/atoms/Input";
import { Button } from "@/components/ui/atoms/Button";
import { PlusIcon, TrashIcon } from "@/components/ui/atoms/Icons";
import { SegmentEditor } from "./SegmentEditor";
import { Step, createSegment } from "./Segment.types";

type StepEditorProps = {
  step: Step;
  stepIndex: number;
  contentIndex: number;
  setForm: (...args: any[]) => void;
  removeStep: (stepIndex: number) => void;
};

export function StepEditor(props: StepEditorProps): JSX.Element {
  const handleTitleChange = (value: string) => {
    props.setForm(
      "contents",
      props.contentIndex,
      "steps",
      props.stepIndex,
      "title",
      value,
    );
  };

  const addSegment = () => {
    const currentSegments = props.step.segments || [];
    props.setForm(
      "contents",
      props.contentIndex,
      "steps",
      props.stepIndex,
      "segments",
      [...currentSegments, createSegment()],
    );
  };

  const removeSegment = (stepIndex: number, segmentIndex: number) => {
    const currentSegments = props.step.segments || [];
    props.setForm(
      "contents",
      props.contentIndex,
      "steps",
      stepIndex,
      "segments",
      currentSegments.filter((_, idx) => idx !== segmentIndex),
    );
  };

  return (
    <div class="p-4">
      <div class="flex justify-evenly items-center mb-3 py-3 px-0.5 gap-2">
        <Input
          class="text-md font-semibold w-full"
          placeholder={`Étape ${props.stepIndex + 1}`}
          value={props.step.title}
          onInput={(e) => handleTitleChange(e.currentTarget.value)}
        />
        <Button
          class="!p-1"
          type="button"
          variant="secondary"
          icon={<TrashIcon />}
          onClick={() => props.removeStep(props.stepIndex)}
        />
      </div>

      <For each={props.step.segments}>
        {(segment, segmentIndex) => (
          <SegmentEditor
            segment={segment}
            segmentIndex={segmentIndex()}
            stepIndex={props.stepIndex}
            contentIndex={props.contentIndex}
            setForm={props.setForm}
            removeSegment={removeSegment}
            showRemoveButton={props.step.segments.length > 1}
          />
        )}
      </For>

      <Button
        class="mx-auto mt-2"
        icon={<PlusIcon class="w-4 h-4" />}
        variant="primary"
        onClick={addSegment}
      />
    </div>
  );
}
