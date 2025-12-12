// Type definitions for the simplified schema

export type CrudAction = "create" | "update" | "delete";

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  skip?: number;
  take?: number;
}

export interface SortParams {
  sortBy?: string;
  order?: "asc" | "desc";
}

export interface PublicationFilter {
  q?: string; // Search query
  tagIds?: string[];
  published?: boolean;
  public?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// ENTITY PAYLOADS (for create/update)
// ============================================================================

export interface TagPayload {
  tag_id?: string;
  name: string;
  slug?: string;
  description?: string;
}

export interface ProductPayload {
  product_id?: string;
  name: string;
  description?: string;
}

export interface UnitPayload {
  unit_id?: string;
  name: string;
}

export interface IngredientPayload {
  ingredient_id?: string;
  product_id?: string;
  product?: ProductPayload; // For upsert
  quantity?: number;
  unit_id?: string;
  unit?: UnitPayload; // For upsert
  cut?: string;
  title?: string;
  note?: string;
  multiply_factor?: number;
  section?: string; // Group title for visual segmentation
}

export interface SegmentPayload {
  segment_id?: string;
  title?: string;
  paragraph: string;
  note?: string;
  section?: string; // Group title for visual segmentation
}

export interface SegmentWithPosition {
  position?: number;
  segment: SegmentPayload;
}

export interface GalleryItem {
  url: string;
  label?: string;
  order: number;
}

export interface ContentPayload {
  content_id?: string;
  subtitle?: string;
  thumbnail?: string;
  note?: string;

  // Prep time
  total_prep_time: number;
  prep_time_note?: string;

  // Servings
  serving_yield?: number;
  serving_value?: string;

  // Gallery
  gallery?: GalleryItem[];

  // Relations
  segments?: SegmentWithPosition[];
  ingredients?: IngredientPayload[];
}

export interface PublicationPayload {
  publication_id?: string;
  title: string;
  description?: string[];
  note?: string[];
  public?: boolean;
  published?: boolean;
  thumbnail?: string;

  // Relations
  tags?: TagPayload[];
  contents?: ContentPayload[];
}

// ============================================================================
// ORCHESTRATOR TYPES
// ============================================================================

export interface OrchestratorRequest {
  action: CrudAction;
  payload: Record<string, PublicationPayload | null>;
}

export interface OrchestratorResponse {
  success: boolean;
  results?: Record<string, any>;
  errors?: Record<string, string>;
  error?: string;
}

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  username: string;
  role: string;
  token: string;
}

export interface JWTPayload {
  userId: string;
  username: string;
  role: string;
}
