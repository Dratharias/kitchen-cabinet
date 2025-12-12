import { Publication, PaginatedResponse, PaginatedRequest } from "@/types";
import { CommonService } from "./common";

// Transform backend structure to frontend-friendly format
function transformPublication(pub: any): Publication {
  return {
    ...pub,
    contents: pub.contents?.map((content: any) => ({
      ...content,
      // Flatten content_ingredients to include ingredient data directly
      content_ingredients: content.content_ingredients?.map((ci: any) => ({
        ...ci.ingredient,
        ingredient_id: ci.ingredient.ingredient_id,
        // Keep original fields for compatibility
        product: ci.ingredient.product,
        unit: ci.ingredient.unit,
        // Map to old structure for compatibility
        ingredient_units: ci.ingredient.unit ? [ci.ingredient.unit] : [],
      })),
      // Flatten content_segments
      content_segments: content.content_segments?.map((cs: any) => ({
        ...cs.segment,
        position: cs.position,
      })),
    })),
    // Flatten publication_tags
    tags: pub.publication_tags?.map((pt: any) => pt.tag) || pub.tags,
  };
}

export class PublicationsService {
  /**
   * Get publications from public or private endpoint based on auth status
   * Public endpoint: /api/public/publications (only public: true AND published: true)
   * Private endpoint: /api/private/publications (all publications)
   */
  static async getPublications(
    params?: Partial<PaginatedRequest> & {
      sortBy?: string;
      order?: "asc" | "desc";
      filter?: Record<string, any>;
    },
    isAuthenticated: boolean = false,
  ): Promise<Publication[]> {
    const endpoint = isAuthenticated
      ? "/api/private/publications"
      : "/api/public/publications";

    const response = await CommonService.get<{ success: boolean; data: any[] }>(
      endpoint,
      params,
      isAuthenticated
    );
    return (response.data || []).map(transformPublication);
  }

  /**
   * Get a single publication by ID
   * Public endpoint: /api/public/publications/:id (only if public AND published)
   * Private endpoint: /api/private/publications/:id (any publication)
   */
  static async getPublicationById(
    id: string,
    isAuthenticated: boolean = false,
  ): Promise<Publication> {
    const endpoint = isAuthenticated
      ? `/api/private/publications/${id}`
      : `/api/public/publications/${id}`;

    const response = await CommonService.get<{ success: boolean; data: any }>(
      endpoint,
      undefined,
      isAuthenticated
    );
    return transformPublication(response.data);
  }

  /**
   * Delete a publication by ID (requires authentication)
   */
  static async deletePublication(id: string): Promise<{ success: boolean }> {
    return CommonService.delete<{ success: boolean }>(
      `/api/private/publications/${id}`,
      true,
    );
  }
}
