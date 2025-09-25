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
    return CommonService.get<PaginatedResponse<Publication>>(
      "/api/publications",
      params,
    );
  }

  static async getPublicationById(id: string): Promise<Publication> {
    return CommonService.get<Publication>(`/api/publications/${id}`);
  }
}
