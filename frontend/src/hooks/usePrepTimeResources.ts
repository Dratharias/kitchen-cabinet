import { useState, useEffect } from "react";

export type Option = { value: string; label: string };

async function fetchPrepStyles(): Promise<Option[]> {
  const token = localStorage.getItem("auth_token");
  if (!token) return [];

  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/api/categories?type=PrepStyle`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  if (!res.ok) return [];

  const data = await res.json();
  return (data.items || []).map((cat: any) => ({
    value: cat.category_id,
    label: cat.str_value,
  }));
}

/**
 * Hook React pour récupérer les styles de temps de préparation
 * (category.type = "PrepStyle")
 */
export function usePrepTimeResources() {
  const [prepStyles, setPrepStyles] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const data = await fetchPrepStyles();
      if (active) {
        setPrepStyles(data);
        setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  return { prepStyles, loading };
}
