import { useState, useEffect, createContext, useContext, ReactNode } from "react";

export type Option = { value: string; label: string };
export type CacheKey = "products" | "units" | "publications" | "prepStyles";

type CacheContextType = {
  cache: Record<CacheKey, Option[]>;
  fetchResource: (key: CacheKey, endpoint: string) => Promise<Option[]>;
};

const CacheContext = createContext<CacheContextType | undefined>(undefined);

export function FormCacheProvider({ children }: { children: ReactNode }) {
  const [cache, setCache] = useState<Record<CacheKey, Option[]>>({
    products: [],
    units: [],
    publications: [],
    prepStyles: [],
  });

  const loaded: Record<CacheKey, boolean> = {
    products: false,
    units: false,
    publications: false,
    prepStyles: false,
  };

  const fetchResource = async (key: CacheKey, endpoint: string): Promise<Option[]> => {
    if (loaded[key]) return cache[key];

    const token = localStorage.getItem("auth_token");
    if (!token) return [];

    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return [];

    const data = await res.json();
    let mapped: Option[] = [];

    switch (key) {
      case "publications":
        mapped = (data.items || []).map((pub: any) => ({
          value: pub.publication_id,
          label: pub.title,
        }));
        break;
      case "prepStyles":
        mapped = (data.items || []).map((cat: any) => ({
          value: cat.category_id,
          label: cat.str_value,
        }));
        break;
      case "products":
        mapped = (data.items || []).map((prod: any) => ({
          value: prod.product_id,
          label: prod.name,
        }));
        break;
      case "units":
        mapped = (data.items || []).map((u: any) => ({
          value: u.unit_id,
          label: u.name,
        }));
        break;
    }

    loaded[key] = true;
    setCache(prev => ({ ...prev, [key]: mapped }));
    return mapped;
  };

  return (
    <CacheContext.Provider value={{ cache, fetchResource }}>
      {children}
    </CacheContext.Provider>
  );
}

export function useFormCache() {
  const ctx = useContext(CacheContext);
  if (!ctx) throw new Error("useFormCache must be used within FormCacheProvider");
  return ctx;
}
