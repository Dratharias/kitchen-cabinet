export async function useApiUpdate<T>(
  path: string,
  body: unknown,
  apiUrl?: string
): Promise<T> {
  try {
    const baseUrl = apiUrl ?? import.meta.env.VITE_API_URL ?? "http://localhost:3001";
    const res = await fetch(new URL(path, baseUrl).toString(), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return (await res.json()) as T;
  } catch (err) {
    console.error("useApiUpdate error:", err);
    throw err;
  }
}