import { useApiFetch } from "./useApiFetch";
import type { Publication, Paginated } from "../types/publication";

type PublicationEndpoint = "publication" | "review";

export const usePublicationApi = {
  // --- Generic fetcher for publication ---
  async getPublications(
    endpoint: PublicationEndpoint,
    query?: Record<string, string | number>
  ) {
    const res = await useApiFetch<Paginated<Publication>>(
      `/api/publications/${endpoint}`,
      query
    );
    console.log(`[API:getPublications:${endpoint}] response:`, res);
    return res;
  },

  async getPublication(endpoint: PublicationEndpoint, id: string) {
    const res = await useApiFetch<Publication>(
      `/api/publications/${endpoint}/${id}`
    );
    console.log(`[API:getPublication] response:`, res);
    return res;
  }
};
