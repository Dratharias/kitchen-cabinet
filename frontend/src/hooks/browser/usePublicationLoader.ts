"use client";

import { useState, useCallback } from "react";
import { PublicationsService } from "@/services/publications";
import { useAuthStore } from "@/stores/authStore";
import type { Publication } from "@/types/publication";

interface UsePublicationLoaderResult {
  loading: boolean;
  totalPages: number;
  fetchPublications: (params: {
    page: number;
    limit?: number;
    types?: string[];
    query?: string;
  }) => Promise<Publication[]>;
}

/**
 * Loader qui bascule auto public/privé selon l'auth.
 */
export function usePublicationLoader(): UsePublicationLoaderResult {
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPublications = useCallback(
    async ({
      page,
      limit = 12,
      types,
      query,
    }: {
      page: number;
      limit?: number;
      types?: string[];
      query?: string;
    }): Promise<Publication[]> => {
      if (loading) return [];

      setLoading(true);
      const filter: Record<string, unknown> = {};
      if (types?.length) filter.type = types;
      if (query?.trim()) filter.q = query.trim();

      const call = isAuthenticated
        ? PublicationsService.getPrivatePublications
        : PublicationsService.getPublicPublications;

      try {
        const res = await call({
          page,
          limit,
          sortBy: "title",
          order: "asc",
          filter,
        });
        setTotalPages(res.totalPages ?? 1);
        return (res.items ?? []) as Publication[];
      } catch (err: any) {
        // Fallback public si la requête privée échoue (ex: 401/403).
        if (isAuthenticated) {
          try {
            const res = await PublicationsService.getPublicPublications({
              page,
              limit,
              sortBy: "title",
              order: "asc",
              filter,
            });
            setTotalPages(res.totalPages ?? 1);
            return (res.items ?? []) as Publication[];
          } catch (e2) {
            console.error("Échec fallback public:", e2);
          }
        }
        console.error("Erreur publications:", err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [loading, isAuthenticated],
  );

  return { loading, totalPages, fetchPublications };
}
