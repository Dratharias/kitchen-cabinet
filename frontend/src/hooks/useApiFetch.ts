export interface FetchOptions {
  query?: Record<string, string | number | boolean>;
  port?: number;
}

export async function useApiFetch<T>(
  path: string,
  query?: Record<string, string | number>,
  apiUrl?: string
): Promise<T> {
  try {
    const baseUrl = apiUrl ?? import.meta.env.VITE_API_URL ?? "http://localhost:3000";
    let url = new URL(path, baseUrl);

    if (query) {
      Object.entries(query).forEach(([k, v]) => url.searchParams.append(k, String(v)));
    }

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return (await res.json()) as T;
  } catch (err) {
    console.error("useApiFetch error:", err);
    throw err;
  }
}
