import { For, JSX, Show } from "solid-js";
import { Input } from "@/components/ui/atoms/Input";
import { Button } from "@/components/ui/atoms/Button";
import { PlusIcon, TrashIcon } from "@/components/ui/atoms/Icons";
import { SegmentEditor } from "./SegmentEditor";
import { Step, createSegment } from "./segment.types";
import { PrepStyleSelector } from "../selectors/PrepStyleSelector";

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

  const handlePrepTimeChange = (
    field: keyof NonNullable<Step["prepTime"]>,
    value: any,
  ) => {
    props.setForm(
      "contents",
      props.contentIndex,
      "steps",
      props.stepIndex,
      "prepTime",
      field,
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

  const pt = props.step.prepTime;

  return (
    <div class="p-4">
      {/* Titre du step + suppression */}
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

      {/* Temps de préparation unique lié au Step */}
      <div class="flex gap-2 mb-4 items-center w-fit">
        <Input
          type="number"
          placeholder="Durée (min)"
          value={pt?.duration ?? ""}
          onInput={(e) =>
            handlePrepTimeChange("duration", Number(e.currentTarget.value))
          }
          class="w-32"
        />
        <PrepStyleSelector
          value={pt?.isNewStyle ? undefined : pt?.style}
          onSelect={(val) => handlePrepTimeChange("style", val)}
          onCreate={(label) => {
            handlePrepTimeChange("style", label);
            handlePrepTimeChange("isNewStyle", true);
            handlePrepTimeChange("style_name", label);
          }}
        />
        <Show when={pt?.isNewStyle}>
          <Input
            placeholder="Nom du nouveau style"
            value={pt?.style_name ?? ""}
            onInput={(e) =>
              handlePrepTimeChange("style_name", e.currentTarget.value)
            }
          />
        </Show>
      </div>

      {/* Segments de texte */}
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

      {/* Ajouter un segment */}
      <Button
        class="mx-auto mt-2"
        icon={<PlusIcon class="w-4 h-4" />}
        variant="primary"
        onClick={addSegment}
      >
        Ajouter un segment
      </Button>
    </div>
  );
}
