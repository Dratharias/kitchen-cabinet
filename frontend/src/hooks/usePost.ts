import { useState, useCallback } from "react";
import type { OrchestratorPayload, OrchestratorResponse } from "../types";
import { API_BASE } from "@/config/api";

const TOKEN_KEY = "auth_token";

export function usePost() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logoutAndRedirect = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = "/login";
  }, []);

  const request = useCallback(
    async <T>(
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
            Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY) || ""}`,
          },
          body: body ? JSON.stringify(body) : undefined,
        });

        if (res.status === 401) {
          logoutAndRedirect();
          return null;
        }

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
    },
    [logoutAndRedirect]
  );

  const postPublicate = useCallback(
    async (payload: OrchestratorPayload): Promise<OrchestratorResponse | null> => {
      return request<OrchestratorResponse>(
        `${API_BASE}/api/publicate`,
        "POST",
        payload
      );
    },
    [request]
  );

  return { request, postPublicate, loading, error };
}
