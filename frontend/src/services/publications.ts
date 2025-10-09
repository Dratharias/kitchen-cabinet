import { Publication, PaginatedResponse, PaginatedRequest } from "@/types";
import { CommonService } from "./common";

/**
 * Service centralisé pour l'accès aux publications.
 * Gère à la fois les routes publiques et authentifiées.
 */
export class PublicationsService {
  // =========================================================
  // --- PUBLIC ACCESS ---
  // =========================================================

  /** Liste paginée des publications publiques (non-auth) */
  static async getPublicPublications(
    params?: Partial<PaginatedRequest> & {
      sortBy?: string;
      order?: "asc" | "desc";
      filter?: Record<string, any>;
    },
  ): Promise<PaginatedResponse<Publication>> {
    const safeParams = {
      ...params,
      ...(params?.filter
        ? { filter: encodeURIComponent(JSON.stringify(params.filter)) }
        : {}),
    };

    return CommonService.get<PaginatedResponse<Publication>>(
      "/api/public/publications",
      safeParams,
    );
  }

  /** Détails d’une publication publique */
  static async getPublicPublicationById(id: string): Promise<Publication> {
    return CommonService.get<Publication>(`/api/public/publications/${id}`);
  }

  // =========================================================
  // --- INTERNAL / AUTHENTICATED ACCESS ---
  // =========================================================

  /** Liste paginée interne (auth requise) */
  static async getPublications(
    params?: Partial<PaginatedRequest> & {
      sortBy?: string;
      order?: "asc" | "desc";
      filter?: Record<string, any>;
    },
  ): Promise<PaginatedResponse<Publication>> {
    const safeParams = {
      ...params,
      ...(params?.filter
        ? { filter: encodeURIComponent(JSON.stringify(params.filter)) }
        : {}),
    };

    return CommonService.get<PaginatedResponse<Publication>>(
      "/api/publications",
      safeParams,
    );
  }

  /** Détails d’une publication interne (auth requise) */
  static async getPublicationById(id: string): Promise<Publication> {
    return CommonService.get<Publication>(`/api/publications/${id}`);
  }
}
