export type PrepTime = {
  duration: number;
  style?: string | number;
  isNewStyle?: boolean;
  style_name?: string;
};

export type Segment = {
  id: string;
  paragraph: string;
};

export type Step = {
  id: string;
  title: string;
  segments: Segment[];
  prepTime: PrepTime;
};

export const createSegment = (): Segment => ({
  id: `seg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
  paragraph: "",
});

export const createStep = (): Step => ({
  id: `step_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
  title: "",
  segments: [createSegment()],
  prepTime: {
    duration: 0,
    style: "",
    isNewStyle: false,
    style_name: undefined,
  },
});
