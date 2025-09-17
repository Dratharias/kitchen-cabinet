import { PaginatedResponse, UUID } from "./common";

export interface CategoryPayload {
  str_value: string;
  type: string;
}
export interface Category extends CategoryPayload {
  category_id: UUID;
}

export type ListCategoriesResponse = PaginatedResponse<Category>;
export type GetCategoryResponse = Category;
export type CreateCategoryRequest = CategoryPayload;
export type CreateCategoryResponse = Category;
export type UpdateCategoryRequest = Partial<CategoryPayload>;
export type UpdateCategoryResponse = Category;
export type DeleteCategoryResponse = { success: boolean };