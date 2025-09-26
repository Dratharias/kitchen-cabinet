// Normalized shape
export type Option = { value: string; label: string };

// --- Types ---
export type Unit = {
  unit_id: string;
  name: string;
};

export type Product = {
  product_id: string;
  name: string;
  en_name: string;
};

// --- Transforms ---
export const transformUnitsToOptions = (units: Unit[]) =>
  units.map((u) => ({ unit_id: u.unit_id, name: u.name }));

export const transformProductsToOptions = (products: Product[]) =>
  products.map((p) => ({ product_id: p.product_id, name: p.name }));

// --- Finders ---
export const findUnitName = (units: Unit[], unitId: string) =>
  units.find((u) => u.unit_id === unitId)?.name || unitId;

export const findProductName = (products: Product[], productId: string) =>
  products.find((p) => p.product_id === productId)?.name || productId;

// --- Display helpers ---
export const getDisplayedUnitName = (
  units: Option[] | undefined,
  unit: string,
) => {
  if (!units || !unit) return unit;
  const found = units.find((u) => u.value === unit);
  return found?.label || unit;
};

export const getDisplayedProductName = (
  products: Option[] | undefined,
  ing: { isNewProduct: boolean; product_name: string; product_id: string },
) => {
  if (ing.isNewProduct) return ing.product_name;
  if (!products || !ing.product_id) return ing.product_name;
  const found = products.find((p) => p.value === ing.product_id);
  return found?.label || ing.product_name;
};
