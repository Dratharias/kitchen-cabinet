import { findUnitName, findProductName } from "./dataTransformers";

export const getDisplayedUnitName = (units: any[] | undefined, unit: string) =>
  !units || !unit ? unit : findUnitName(units as any, unit);

export const getDisplayedProductName = (
  products: any[] | undefined,
  ing: any,
) => {
  if (ing.isNewProduct) return ing.product_name;
  if (!products || !ing.product_id) return ing.product_name;
  return findProductName(products as any, ing.product_id);
};
