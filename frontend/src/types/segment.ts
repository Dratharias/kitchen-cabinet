import { PaginatedResponse } from "./common";
import { PrepTime } from "./prepTime";

export interface SegmentPayload {
  title?: string;
  paragraph: string;
  connect?: {
    segment_prep_time?: PrepTime[];
  };
}
export interface Segment extends SegmentPayload {
  segment_id: string;
}

export type ListSegmentsResponse = PaginatedResponse<Segment>;
export type GetSegmentResponse = Segment;
export type CreateSegmentRequest = SegmentPayload;
export type CreateSegmentResponse = Segment;
export type UpdateSegmentRequest = Partial<SegmentPayload>;
export type UpdateSegmentResponse = Segment;
export type DeleteSegmentResponse = { success: boolean };
