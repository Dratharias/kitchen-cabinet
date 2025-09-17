export interface FetchOptions {
  query?: Record<string, string | number | boolean | string[]>;
  apiUrl?: string;
}

export async function useApiFetch<T>(path: string, query?: Record<string, string | number | string[]>, apiUrl?: string): Promise<T> {
  try {
    const baseUrl = apiUrl ?? import.meta.env.VITE_API_URL ?? "http://localhost:3001";
    const url = new URL(path, baseUrl);

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => url.searchParams.append(key, String(v)));
        } else {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return (await res.json()) as T;
  } catch (err) {
    console.error("useApiFetch error:", err);
    throw err;
  }
}