import { PaginatedResponse } from "./common";

export interface CategoryPayload {
  category_id?: string;
  str_value: string;
  type: string;
}
export interface Category extends CategoryPayload {
  category_id: string;
}

export type ListCategoriesResponse = PaginatedResponse<Category>;
export type GetCategoryResponse = Category;
export type CreateCategoryRequest = CategoryPayload;
export type CreateCategoryResponse = Category;
export type UpdateCategoryRequest = Partial<CategoryPayload>;
export type UpdateCategoryResponse = Category;
export type DeleteCategoryResponse = { success: boolean };
