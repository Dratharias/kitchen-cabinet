export type Segment = {
  id: string;
  paragraph: string;
  prepTimes: any[];
};

export type Step = {
  id: string;
  title: string;
  segments: Segment[];
};

export const createSegment = (): Segment => ({
  id: `seg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
  paragraph: "",
  prepTimes: [],
});

export const createStep = (): Step => ({
  id: `step_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
  title: "",
  segments: [createSegment()],
});
