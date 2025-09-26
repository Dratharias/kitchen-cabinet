import type { Step } from "@/components/content/segment.types";
import type { PrepTime } from "@/components/content/segment.types";

export interface MappedSegment {
  title?: string;
  paragraph: string;
  prepTime?: PrepTime;
}

/**
 * Maps nested steps and segments structure to flat segments array
 * for payload builder compatibility
 */
export function mapStepsToSegments(steps: Step[]): MappedSegment[] {
  const mapped: MappedSegment[] = [];

  steps.forEach((step) => {
    step.segments.forEach((segment, segmentIndex) => {
      mapped.push({
        title: segmentIndex === 0 ? step.title : undefined,
        paragraph: segment.paragraph,
        prepTime:
          segmentIndex === 0 &&
          step.prepTime &&
          step.prepTime.duration > 0 &&
          (step.prepTime.style ||
            (step.prepTime.isNewStyle && step.prepTime.style_name))
            ? step.prepTime
            : undefined,
      });
    });
  });

  return mapped;
}

/**
 * Maps flat segments array back to steps structure
 * for form initialization (reverse mapping)
 */
export function mapSegmentsToSteps(segments: MappedSegment[]): Step[] {
  const steps: Step[] = [];
  let currentStep: Step | null = null;

  segments.forEach((segment) => {
    if (segment.title) {
      // Push l’éventuel step courant avant de démarrer un nouveau
      if (currentStep) steps.push(currentStep);

      currentStep = {
        id: `step_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        title: segment.title,
        segments: [
          {
            id: `seg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            paragraph: segment.paragraph,
          },
        ],
        prepTime: segment.prepTime ?? {
          duration: 0,
          style: "",
          isNewStyle: false,
          style_name: undefined,
        },
      };
    } else if (currentStep) {
      currentStep.segments.push({
        id: `seg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        paragraph: segment.paragraph,
      });
    }
  });

  if (currentStep) steps.push(currentStep);

  return steps;
}
