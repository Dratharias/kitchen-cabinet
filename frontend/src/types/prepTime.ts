import { Category } from "./category";
import { PaginatedResponse, UUID } from "./common";

export interface PrepTimePayload {
  duration: number;
  style_id?: UUID | null;
  connect?: {
    style?: Category[];
  };
}
export interface PrepTime extends PrepTimePayload {
  prep_time_id: UUID;
}

export type ListPrepTimesResponse = PaginatedResponse<PrepTime>;
export type GetPrepTimeResponse = PrepTime;
export type CreatePrepTimeRequest = PrepTimePayload;
export type CreatePrepTimeResponse = PrepTime;
export type UpdatePrepTimeRequest = Partial<PrepTimePayload>;
export type UpdatePrepTimeResponse = PrepTime;
export type DeletePrepTimeResponse = { success: boolean };
