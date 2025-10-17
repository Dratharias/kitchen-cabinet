import { PaginatedResponse } from "./common";
import { Product } from "./product";
import { Unit } from "./unit";

export interface IngredientPayload {
  ingredient_id?: string;
  quantity?: number;
  product_id?: string;
  multiply_factor?: number;
  ingredient_units?: Unit[];
  connect?: {
    product?: Product[];
    ingredient_units?: Unit[];
  };
}
export interface Ingredient extends IngredientPayload {
  product: any;
  ingredient_id: string;
}

export type ListIngredientsResponse = PaginatedResponse<Ingredient>;
export type GetIngredientResponse = Ingredient;
export type CreateIngredientRequest = IngredientPayload;
export type CreateIngredientResponse = Ingredient;
export type UpdateIngredientRequest = Partial<IngredientPayload>;
export type UpdateIngredientResponse = Ingredient;
export type DeleteIngredientResponse = { success: boolean };