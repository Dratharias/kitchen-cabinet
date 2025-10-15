import { Publication, PaginatedResponse, PaginatedRequest } from "@/types";
import { CommonService } from "./common";

export class PublicationsService {
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
      false,
    );
  }

  static async getPublicationById(id: string): Promise<Publication> {
    return CommonService.get<Publication>(
      `/api/publications/${id}`,
      undefined,
      false,
    );
  }
}
