import { Category } from "./category";
import { PaginatedResponse } from "./common";
import { Macro } from "./macro";

export interface ProductPayload {
  name: string;
  macro_id?: string | null;
  is_recipe_id: string | null;
  connect?: {
    macro?: Macro[];
    product_categories?: Category[];
  };
}
export interface Product extends ProductPayload {
  product_id: string;
}

export type ListProductsResponse = PaginatedResponse<Product>;
export type GetProductResponse = Product;
export type CreateProductRequest = ProductPayload;
export type CreateProductResponse = Product;
export type UpdateProductRequest = Partial<ProductPayload>;
export type UpdateProductResponse = Product;
export type DeleteProductResponse = { success: boolean };
