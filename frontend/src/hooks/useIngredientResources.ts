import { useState, useEffect } from "react";

export type Option = { value: string; label: string };

export function useIngredientResources(
  unitsFetcher: () => Promise<Option[]>,
  productsFetcher: () => Promise<Option[]>,
) {
  const [unitsOptions, setUnitsOptions] = useState<Option[]>([]);
  const [productsOptions, setProductsOptions] = useState<Option[]>([]);

  useEffect(() => {
    let active = true;

    const fetchResources = async () => {
      try {
        const [units, products] = await Promise.all([
          unitsFetcher().catch(() => []),
          productsFetcher().catch(() => []),
        ]);

        if (active) {
          setUnitsOptions(units);
          setProductsOptions(products);
        }
      } catch (err) {
        console.error("Failed to load ingredient resources", err);
      }
    };

    fetchResources();

    return () => {
      active = false;
    };
  }, [unitsFetcher, productsFetcher]);

  return { unitsOptions, productsOptions };
}
