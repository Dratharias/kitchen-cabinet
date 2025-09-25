type Unit = {
  unit_id: string;
  name: string;
};

type Product = {
  product_id: string;
  name: string;
  en_name: string;
};

type SelectOption = {
  str_value: string;
  id?: string;
};

export const transformUnitsToOptions = (units: Unit[]): SelectOption[] => {
  return units.map((unit) => ({
    str_value: unit.name,
    id: unit.unit_id,
  }));
};

export const transformProductsToOptions = (
  products: Product[],
): SelectOption[] => {
  return products.map((product) => ({
    str_value: product.name,
    id: product.product_id,
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
