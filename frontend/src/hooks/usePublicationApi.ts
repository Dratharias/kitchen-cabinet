import { useApiFetch } from "./useApiFetch";
import type { PublicationDetails, PublicationListResponse } from "../types/publication";

export const usePublicationApi = {
  // Get all publications with pagination and filtering
  async getPublications(query?: Record<string, string | number | string[]>) {
    const res = await useApiFetch<PublicationListResponse>("/api/publications", query);
    console.log(`[API:getPublications] response:`, res);
    return res;
  },

  // Get single publication by ID
  async getPublication(id: string) {
    const res = await useApiFetch<PublicationDetails>(`/api/publications/${id}`);
    console.log(`[API:getPublication] response:`, res);
    return res;
  },

  // Get reviews for a publication
  async getPublicationReviews(id: string) {
    const res = await useApiFetch(`/api/publications/${id}/reviews`);
    console.log(`[API:getPublicationReviews] response:`, res);
    return res;
  },

  // Search publications (same as getPublications but different endpoint)
  async searchPublications(query?: Record<string, string | number | string[]>) {
    const res = await useApiFetch<PublicationListResponse>("/api/publications/search", query);
    console.log(`[API:searchPublications] response:`, res);
    return res;
  }
};