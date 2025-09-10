import { useApiFetch } from "./useApiFetch";
import { Publication, Paginated } from "../types/publication";

export const usePublicationApi = {
  // --- Feeds ---
  async getFeeds(query?: Record<string, string | number>) {
    const res = await useApiFetch<Paginated<Publication>>(
      "/api/publications/all",
      query
    );
    console.log("[API:getFeeds] response:", res);
    return res;
  },

  async getFeed(id: string) {
    const res = await useApiFetch<Publication>(`/api/publications/feeds/${id}`);
    console.log("[API:getFeed] response:", res);
    return res;
  },

  // --- Reviews ---
  async getReviews(query?: Record<string, string | number>) {
    const res = await useApiFetch<Paginated<Publication>>(
      "/api/publications/reviews",
      query
    );
    console.log("[API:getReviews] response:", res);
    return res;
  },

  async getReview(id: string) {
    const res = await useApiFetch<Publication>(`/api/publications/reviews/${id}`);
    console.log("[API:getReview] response:", res);
    return res;
  },
};
