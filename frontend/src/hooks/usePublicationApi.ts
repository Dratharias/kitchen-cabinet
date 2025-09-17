import { useApiFetch } from "./useApiFetch";
import type {
  PublicationDetails,
  PublicationListItem,
  PaginationInfo,
} from "../shared-types/publication";

// --- Types internes ---
export interface PublicationListWithPagination {
  data: PublicationListItem[];
  pagination: PaginationInfo;
}

// Types possibles de réponse brute
type RawPublicationListResponse =
  | { data: PublicationListItem[]; pagination?: PaginationInfo }
  | { data: { data: PublicationListItem[]; pagination?: PaginationInfo }; pagination?: PaginationInfo };

// --- Normalisation TS-safe ---
function normalizePublicationListResponse(
  res: RawPublicationListResponse,
  query?: Record<string, string | number | string[]>
): PublicationListWithPagination {
  const page = Number(query?.page) || 1;
  const limit = Number(query?.limit) || 12;

  let data: PublicationListItem[] = [];
  let pagination: PaginationInfo = { page, limit, total: 0, totalPages: 1 };

  // Cas où res.data est un tableau
  if (Array.isArray(res.data)) {
    data = res.data;
    pagination = res.pagination ?? pagination;
  }
  // Cas où res.data est un objet { data: [...], pagination? }
  else if (res.data && typeof res.data === "object" && Array.isArray(res.data.data)) {
    data = res.data.data;
    pagination = res.data.pagination ?? res.pagination ?? pagination;
  }

  // Tri par titre
  data.sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));

  // Pagination complète
  pagination.total = pagination.total || data.length;
  pagination.totalPages = Math.ceil(pagination.total / limit);

  return { data, pagination };
}

// --- API composable ---
export const usePublicationApi = {
  // --- Récupérer toutes les publications ---
  async getPublications(query?: Record<string, string | number | string[]>): Promise<PublicationListWithPagination> {
    const res = await useApiFetch<RawPublicationListResponse>("/api/publications", query);
    return normalizePublicationListResponse(res, query);
  },

  // --- Récupérer une publication par ID ---
  async getPublication(id: string): Promise<PublicationDetails> {
    const res = await useApiFetch<PublicationDetails>(`/api/publications/${id}`);
    console.log("[API:getPublication] response:", res);
    return res;
  },

  // --- Récupérer les avis d'une publication ---
  async getPublicationReviews(id: string, query?: { page?: number; limit?: number }): Promise<any> {
    const res = await useApiFetch(`/api/publications/${id}/reviews`, query);
    console.log("[API:getPublicationReviews] response:", res);
    return res;
  },

  // --- Rechercher des publications ---
  async searchPublications(query?: Record<string, string | number | string[]>): Promise<PublicationListWithPagination> {
    const res = await useApiFetch<RawPublicationListResponse>("/api/publications/search", query);
    return normalizePublicationListResponse(res, query);
  },
};
