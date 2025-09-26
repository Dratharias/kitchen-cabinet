import type { Step } from "@/components/content/Segment.types";

export interface MappedSegment {
  title?: string;
  paragraph: string;
  prepTimes: { duration: number; style?: string }[];
}

/**
 * Maps nested steps and segments structure to flat segments array
 * for payload builder compatibility
 */
export function mapStepsToSegments(steps: Step[]): MappedSegment[] {
  const mappedSegments: MappedSegment[] = [];

  steps.forEach((step) => {
    step.segments.forEach((segment, segmentIndex) => {
      mappedSegments.push({
        title: segmentIndex === 0 ? step.title : undefined,
        paragraph: segment.paragraph,
        prepTimes: segment.prepTimes || [],
      });
    });
  });

  return mappedSegments;
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
      if (currentStep) {
        steps.push(currentStep);
      }
      currentStep = {
        id: `step_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        title: segment.title,
        segments: [
          {
            id: `seg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            paragraph: segment.paragraph,
            prepTimes: segment.prepTimes,
          },
        ],
      };
    } else if (currentStep) {
      currentStep.segments.push({
        id: `seg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        paragraph: segment.paragraph,
        prepTimes: segment.prepTimes,
      });
    }
  });

  if (currentStep) {
    steps.push(currentStep);
  }

  return steps;
}
