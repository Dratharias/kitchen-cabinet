import { createCrudHooks } from "../lib/createCrudHooks";
import type { ProductPayload, Product } from "../types";

export const {
  useList: useProducts,
  useOne: useProduct,
  createOne: createProduct,
  updateOne: updateProduct,
  deleteOne: deleteProduct,
} = createCrudHooks<ProductPayload, Product>({
  basePath: "/api/products",
  key: "product",
});
