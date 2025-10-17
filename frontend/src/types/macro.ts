import { PaginatedResponse } from "./common";

export interface MacroPayload {
  macro_id?: string;
  calories?: number;
  protein?: number;
  fiber?: number;
  sugar?: number;
  saturated?: number | null;
  trans?: number | null;
  caffein?: number | null;
}
export interface Macro extends MacroPayload {
  macro_id: string;
}

export type ListMacrosResponse = PaginatedResponse<Macro>;
export type GetMacroResponse = Macro;
export type CreateMacroRequest = MacroPayload;
export type CreateMacroResponse = Macro;
export type UpdateMacroRequest = Partial<MacroPayload>;
export type UpdateMacroResponse = Macro;
export type DeleteMacroResponse = { success: boolean };
