import { createSignal } from "solid-js";

type Option = { value: string; label: string };
type CacheKey = "products" | "units" | "publications" | "prepStyles";

const cache: Record<CacheKey, Option[]> = {
  products: [],
  units: [],
  publications: [],
  prepStyles: [],
};

const loaded: Record<CacheKey, boolean> = {
  products: false,
  units: false,
  publications: false,
  prepStyles: false,
};

const [signals, setSignals] = createSignal<Record<CacheKey, Option[]>>(cache);

async function fetchResource(
  key: CacheKey,
  endpoint: string,
): Promise<Option[]> {
  if (loaded[key]) return cache[key];

  const token = localStorage.getItem("auth_token");
  if (!token) return [];

  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return [];

  const data = await res.json();

  let mapped: Option[] = [];
  if (key === "publications") {
    mapped = (data.items || []).map((pub: any) => ({
      value: pub.publication_id,
      label: pub.title,
    }));
  } else if (key === "prepStyles") {
    mapped = (data.items || []).map((cat: any) => ({
      value: cat.category_id,
      label: cat.str_value,
    }));
  } else if (key === "products") {
    mapped = (data.items || []).map((prod: any) => ({
      value: prod.product_id,
      label: prod.name,
    }));
  } else if (key === "units") {
    mapped = (data.items || []).map((u: any) => ({
      value: u.unit_id,
      label: u.name,
    }));
  }

  cache[key] = mapped;
  loaded[key] = true;
  setSignals({ ...cache });
  return mapped;
}

export { signals as formCacheSignals, fetchResource };
export type { Option, CacheKey };
