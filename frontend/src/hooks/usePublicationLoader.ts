"use client";

import { useState, useCallback } from "react";
import { PublicationsService } from "@/services/publications";
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
 * Hook de chargement paginé des publications.
 * - Centralise les appels API publics.
 * - Expose `loading`, `totalPages` et `fetchPublications`.
 */
export function usePublicationLoader(): UsePublicationLoaderResult {
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
      try {
        const filter: Record<string, any> = {};
        if (types && types.length) filter.type = types;
        if (query && query.trim() !== "") filter.q = query.trim();

        const response = await PublicationsService.getPublicPublications({
          page,
          limit,
          sortBy: "title",
          order: "asc",
          filter,
        });

        setTotalPages(response.totalPages ?? 1);
        return (response.items ?? []) as Publication[];
      } catch (error) {
        console.error("Erreur lors du chargement des publications :", error);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [loading],
  );

  return { loading, totalPages, fetchPublications };
}
