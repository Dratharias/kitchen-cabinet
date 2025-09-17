import { PaginatedResponse, UUID } from "./common";
import { Product } from "./product";
import { Unit } from "./unit";

export interface IngredientPayload {
  quantity?: number;
  is_recipe_id?: UUID | null;
  product_id?: UUID;
  multiply_factor?: number;
  connect?: {
    product?: Product[];
    ingredient_units?: Unit[];
  };
}
export interface Ingredient extends IngredientPayload {
  ingredient_id: UUID;
}

export type ListIngredientsResponse = PaginatedResponse<Ingredient>;
export type GetIngredientResponse = Ingredient;
export type CreateIngredientRequest = IngredientPayload;
export type CreateIngredientResponse = Ingredient;
export type UpdateIngredientRequest = Partial<IngredientPayload>;
export type UpdateIngredientResponse = Ingredient;
export type DeleteIngredientResponse = { success: boolean };
