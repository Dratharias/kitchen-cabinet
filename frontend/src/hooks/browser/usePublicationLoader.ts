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
 * Loader that automatically handles public/private fetching based on auth status.
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

      try {
        const res = await PublicationsService.getPublications({
          page,
          limit,
          sortBy: "title",
          order: "asc",
          filter,
        }, isAuthenticated);
        setTotalPages(res.totalPages ?? 1);
        return (res.items ?? []) as Publication[];
      } catch (err: any) {
        console.error("Error fetching publications:", err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [loading, isAuthenticated],
  );

  return { loading, totalPages, fetchPublications };
}