type Unit = {
  unit_id: string;
  name: string;
};

type Product = {
  product_id: string;
  name: string;
  en_name: string;
};

export const transformUnitsToOptions = (
  units: Unit[],
): { unit_id: string; name: string }[] => {
  return units.map((unit) => ({
    unit_id: unit.unit_id,
    name: unit.name,
  }));
};

export const transformProductsToOptions = (
  products: Product[],
): { product_id: string; name: string }[] => {
  return products.map((product) => ({
    product_id: product.product_id,
    name: product.name,
  }));
};

export const findUnitName = (units: Unit[], unitId: string): string => {
  const unit = units.find((u) => u.unit_id === unitId);
  return unit?.name || unitId;
};

export const findProductName = (
  products: Product[],
  productId: string,
): string => {
  const product = products.find((p) => p.product_id === productId);
  return product?.name || productId;
};
