import { findUnitName, findProductName } from "./dataTransformers";

export const getDisplayedUnitName = (
  units: any[] | undefined,
  unit: string,
) => {
  if (!units || !unit) return unit;
  return findUnitName(units, unit);
};

export const getDisplayedProductName = (
  products: any[] | undefined,
  ing: any,
) => {
  if (ing.isNewProduct) return ing.product_name;
  if (!products || !ing.product_id) return ing.product_name;
  return findProductName(products, ing.product_id);
};
