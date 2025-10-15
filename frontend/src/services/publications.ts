import { Publication, PaginatedResponse, PaginatedRequest } from "@/types";
import { CommonService } from "./common";

export class PublicationsService {
  static async getPublications(
    params?: Partial<PaginatedRequest> & {
      sortBy?: string;
      order?: "asc" | "desc";
      filter?: Record<string, any>;
    },
    isAuthenticated: boolean = false,
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
      isAuthenticated, // Pass authentication status to the service
    );
  }

  static async getPublicationById(
    id: string,
    isAuthenticated: boolean = false,
  ): Promise<Publication> {
    return CommonService.get<Publication>(
      `/api/publications/${id}`,
      undefined,
      isAuthenticated, // Pass authentication status to the service
    );
  }
}
