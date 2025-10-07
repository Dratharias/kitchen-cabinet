import { Publication, PaginatedResponse, PaginatedRequest } from "@/types";
import { CommonService } from "./common";

/**
 * Gère l'accès aux publications.
 * On sépare clairement :
 *  - API publique (/api/public/publications)
 *  - API interne (/api/publications)
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
        ? {
            filter: encodeURIComponent(JSON.stringify(params.filter)),
          }
        : {}),
    };

    return CommonService.get<PaginatedResponse<Publication>>(
      "/api/public/publications",
      safeParams,
    );
  }

  /** Détails d'une publication publique (non-auth) */
  static async getPublicPublicationById(id: string): Promise<Publication> {
    return CommonService.get<Publication>(`/api/public/publications/${id}`);
  }

  // =========================================================
  // --- INTERNAL / AUTHENTICATED ACCESS ---
  // =========================================================

  /** Liste paginée interne (admin, édition) */
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
        ? {
            filter: encodeURIComponent(JSON.stringify(params.filter)),
          }
        : {}),
    };

    return CommonService.get<PaginatedResponse<Publication>>(
      "/api/publications",
      safeParams,
    );
  }

  /** Détails d'une publication interne (admin, édition) */
  static async getPublicationById(id: string): Promise<Publication> {
    return CommonService.get<Publication>(`/api/publications/${id}`);
  }
}
