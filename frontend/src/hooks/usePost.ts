import { createSignal } from "solid-js";
import type { OrchestratorPayload, OrchestratorResponse } from "../types";

export function usePost() {
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const request = async <T>(
    url: string,
    method: "POST" | "PATCH" | "PUT" | "DELETE",
    body?: any
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed: ${res.status}`);
      }

      return (await res.json()) as T;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const postPublicate = async (
    payload: OrchestratorPayload
  ): Promise<OrchestratorResponse | null> => {
    return request<OrchestratorResponse>("/api/publicate", "POST", payload);
  };

  return { request, postPublicate, loading, error };
}