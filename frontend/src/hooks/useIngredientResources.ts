import { createSignal, onMount } from "solid-js";

type Option = { value: string; label: string };

export function useIngredientResources(
  unitsFetcher: () => Promise<Option[]>,
  productsFetcher: () => Promise<Option[]>,
) {
  const [unitsOptions, setUnitsOptions] = createSignal<Option[]>([]);
  const [productsOptions, setProductsOptions] = createSignal<Option[]>([]);

  // Fetch both on mount (you can also defer if you prefer lazy loading)
  onMount(async () => {
    try {
      const units = await unitsFetcher();
      setUnitsOptions(units);
    } catch (err) {
      console.error("Failed to load units", err);
    }

    try {
      const products = await productsFetcher();
      setProductsOptions(products);
    } catch (err) {
      console.error("Failed to load products", err);
    }
  });

  return {
    unitsOptions,
    productsOptions,
  };
}
