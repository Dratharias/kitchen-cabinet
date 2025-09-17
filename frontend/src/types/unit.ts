import { PaginatedResponse, UUID } from "./common";

export interface UnitPayload {
  name: string;
}
export interface Unit extends UnitPayload {
  unit_id: UUID;
}

export type ListUnitsResponse = PaginatedResponse<Unit>;
export type GetUnitResponse = Unit;
export type CreateUnitRequest = UnitPayload;
export type CreateUnitResponse = Unit;
export type UpdateUnitRequest = Partial<UnitPayload>;
export type UpdateUnitResponse = Unit;
export type DeleteUnitResponse = { success: boolean };
