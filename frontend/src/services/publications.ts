import { Publication, PaginatedResponse, PaginatedRequest } from "@/types";
import { CommonService } from "./common";

export class PublicationsService {
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
      false,
    );
  }

  static async getPublicPublicationById(id: string): Promise<Publication> {
    return CommonService.get<Publication>(
      `/api/public/publications/${id}`,
      undefined,
      false,
    );
  }

  static async getPrivatePublications(
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
      "/api/private/publications",
      safeParams,
      true,
    );
  }

  static async getPrivatePublicationById(id: string): Promise<Publication> {
    return CommonService.get<Publication>(
      `/api/private/publications/${id}`,
      undefined,
      true,
    );
  }
}
