import {
  transformUnitsToOptions,
  transformProductsToOptions,
} from "./dataTransformers";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  `http://localhost:${import.meta.env.VITE_API_PORT}`;

export const transformedUnitsFetcher = async (
  unitsFetcher: () => Promise<any[]>,
) => {
  const units = await unitsFetcher();
  return transformUnitsToOptions(units);
};

export const transformedProductsFetcher = async (
  productsFetcher: () => Promise<any[]>,
) => {
  const products = await productsFetcher();
  return transformProductsToOptions(products);
};

export const transformedPublicationsFetcher = async () => {
  const token = localStorage.getItem("auth_token");
  if (!token) return [];
  const res = await fetch(`${API_BASE}/api/publications`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.items.map((p: any) => ({
    str_value: p.publication_id,
    label: p.title,
  }));
};
