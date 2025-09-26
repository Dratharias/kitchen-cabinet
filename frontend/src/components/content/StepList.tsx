import { For } from "solid-js";
import { Button } from "@/components/ui/atoms/Button";
import { Span } from "@/components/ui/atoms/Span";
import { PlusIcon } from "@/components/ui/atoms/Icons";
import { StepEditor } from "./StepEditor";
import { Step, createStep } from "./Segment.types";

type StepListProps = {
  contentIndex: number;
  steps: Step[];
  setForm: (...args: any[]) => void;
};

export function StepList(props: StepListProps) {
  const addStep = () => {
    const currentSteps = props.steps || [];
    props.setForm("contents", props.contentIndex, "steps", [
      ...currentSteps,
      createStep(),
    ]);
  };

  const removeStep = (stepIndex: number) => {
    const currentSteps = props.steps || [];
    props.setForm(
      "contents",
      props.contentIndex,
      "steps",
      currentSteps.filter((_, idx) => idx !== stepIndex),
    );
  };

  return (
    <div class="mb-8 rounded-xl p-4 pb-8">
      <div class="flex justify-between items-center mb-4">
        <Span class="text-lg font-semibold">Instructions</Span>
      </div>

      <For each={props.steps}>
        {(step, stepIndex) => (
          <StepEditor
            step={step}
            stepIndex={stepIndex()}
            contentIndex={props.contentIndex}
            setForm={props.setForm}
            removeStep={removeStep}
          />
        )}
      </For>

      <Button
        class="mx-auto mt-2"
        icon={<PlusIcon class="w-4 h-4" />}
        variant="primary"
        onClick={addStep}
      >
        Ajouter une étape
      </Button>
    </div>
  );
}
