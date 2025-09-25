import { createSignal, createResource } from "solid-js";
import {
  transformedUnitsFetcher,
  transformedProductsFetcher,
  transformedPublicationsFetcher,
} from "@/utils/fetchers";

export function useIngredientResources(
  unitsFetcher: () => Promise<any[]>,
  productsFetcher: () => Promise<any[]>,
) {
  // Units
  const [loadUnits, setLoadUnits] = createSignal(false);
  const [unitsOptions] = createResource(loadUnits, () =>
    transformedUnitsFetcher(unitsFetcher),
  );

  // Products
  const [loadProducts, setLoadProducts] = createSignal(false);
  const [productsOptions] = createResource(loadProducts, () =>
    transformedProductsFetcher(productsFetcher),
  );

  // Publications
  const [loadPublications, setLoadPublications] = createSignal(false);
  const [publicationsOptions] = createResource(
    loadPublications,
    transformedPublicationsFetcher,
  );

  return {
    // Units
    unitsOptions,
    setLoadUnits,
    // Products
    productsOptions,
    setLoadProducts,
    // Publications
    publicationsOptions,
    setLoadPublications,
  };
}
