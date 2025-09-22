import { createSignal } from "solid-js";
import type { OrchestratorRequest, OrchestratorResponse } from "../types/orchestrator";

export function usePost() {
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  /**
   * Generic API call
   * @param url API endpoint
   * @param method HTTP method
   * @param body optional request body
   */
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

  /**
   * Post publication or review to /api/publicate
   */
  const postPublicate = async (
    payload: OrchestratorRequest,
    isReview: boolean
  ): Promise<OrchestratorResponse | null> => {
    return request<OrchestratorResponse>("/api/publicate", "POST", {
      action: "create",
      ...(isReview
        ? { reviews: payload.reviews, products: payload.products, publications: payload.publications }
        : {
            publications: payload.publications,
            contents: payload.contents,
            segments: payload.segments,
            ingredients: payload.ingredients,
            products: payload.products,
            categories: payload.categories,
            units: payload.units,
            prepTimes: payload.prepTimes,
            macros: payload.macros,
          }),
    });
  };

  return { request, postPublicate, loading, error };
}
