// =================================================================
// 1. Core Entities & Payloads
//    - Defines the basic shape of data models.
//    - "Payload" types are for creation/updates.
//    - Main types include server-generated fields like IDs.
// =================================================================

export interface GalleryItem {
  url: string;
  label?: string | null;
}

export type BuyAgain = "Y" | "N" | "M" | "D";

export interface User {
  user_id: string;
  username: string;
  role: string;
  created_at: string;
}

export interface UnitPayload {
  name: string;
}
export interface Unit extends UnitPayload {
  unit_id: string;
}

export interface TagPayload {
  name: string;
  slug?: string;
  description?: string | null;
}
export interface Tag extends TagPayload {
  tag_id: string;
  slug: string;
}

export interface ProductPayload {
  name: string;
}
export interface Product extends ProductPayload {
  product_id: string;
}

export interface IngredientPayload {
  quantity?: number | null;
  unit_id?: string | null;
  note?: string | null;
  section?: string | null; // Group title for visual segmentation
  product: ProductPayload; // For connect/create operations
  unit?: UnitPayload | null; // For connect/create operations
}
export interface Ingredient extends Omit<IngredientPayload, 'product' | 'unit'> {
  ingredient_id: string;
  product_id: string;
  product: Product;
  unit?: Unit | null;
  section?: string | null; // Group title for visual segmentation
}

export interface SegmentPayload {
  title?: string | null;
  paragraph: string;
  note?: string | null;
  section?: string | null; // Group title for visual segmentation
}
export interface Segment extends SegmentPayload {
  segment_id: string;
  section?: string | null; // Group title for visual segmentation
}

export interface SegmentWithPosition extends SegmentPayload {
  position: number;
  section?: string | null; // Group title for visual segmentation
}

export interface ContentPayload {
  subtitle?: string | null;
  note?: string | null;
  total_prep_time: number;
  prep_time_note?: string | null;
  serving_yield?: number | null;
  serving_value?: string | null;
  gallery?: GalleryItem[] | null;
  segments?: SegmentWithPosition[];
  ingredients?: IngredientPayload[];
}
export interface Content extends Omit<ContentPayload, 'segments' | 'ingredients'> {
  content_id: string;
  publication_id: string;
  thumbnail?: string | null;
  content_segments?: { position: number; segment: Segment }[];
  content_ingredients?: Ingredient[];
}

export interface PublicationPayload {
  publication_id?: string;
  title: string;
  description?: string[] | null;
  note?: string[] | null;
  public?: boolean;
  published?: boolean;
  thumbnail?: string | null;
  tags?: TagPayload[];
  contents?: ContentPayload[];
}
export interface Publication extends Omit<PublicationPayload, 'tags' | 'contents'> {
  publication_id: string;
  created_at: string;
  updated_at: string;
  review_count: number;
  average_rating: number;
  publication_tags?: { tag: Tag }[];
  contents?: Content[];
}

export interface ReviewPayload {
  publication_id: string;
  rating?: number | null;
  comment?: string[] | null;
  description?: string[] | null;
  buy_again?: BuyAgain | null;
  date_review?: string | null;
}
export interface Review extends ReviewPayload {
  review_id: string;
  user_id: string;
  created_at: string;
  publication: Publication;
  user: User;
}

// =================================================================
// 2. API Contracts
//    - Defines request/response types for API endpoints.
//    - Includes pagination and standard CRUD operations.
// =================================================================

// Common
export interface PaginatedRequest {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: "asc" | "desc";
  filter?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ErrorResponse {
  success: false;
  error: string;
}

export interface SuccessResponse {
  success: boolean;
  message?: string;
}

// Auth
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  username: string;
  role: string;
  token: string;
}

export type LoginEndpoint = {
  request: LoginRequest;
  response: LoginResponse | ErrorResponse;
};

// Generic CRUD API types
type EntityApi<T, TPayload> = {
  ListRequest: PaginatedRequest;
  ListResponse: PaginatedResponse<T>;
  GetResponse: T;
  CreateRequest: TPayload;
  CreateResponse: T;
  UpdateRequest: Partial<TPayload>;
  UpdateResponse: T;
  DeleteResponse: SuccessResponse;
};

// Applying generic types to each entity
export type UserApi = EntityApi<
  User,
  Omit<User, "user_id" | "created_at"> & { password?: string }
>;
export type TagApi = EntityApi<Tag, TagPayload>;
export type UnitApi = EntityApi<Unit, UnitPayload>;
export type ProductApi = EntityApi<Product, ProductPayload>;
export type IngredientApi = EntityApi<Ingredient, IngredientPayload>;
export type SegmentApi = EntityApi<Segment, SegmentPayload>;
export type ContentApi = EntityApi<Content, ContentPayload>;
export type PublicationApi = EntityApi<Publication, PublicationPayload>;
export type ReviewApi = EntityApi<Review, ReviewPayload>;

// =================================================================
// 3. Orchestrator & Complex Payloads
//    - Defines types for complex, multi-entity operations.
// =================================================================

export type OrchestratorAction = "create" | "update" | "delete";

export interface OrchestratorPayload {
  action: OrchestratorAction;
  payload: PublicationPayload;
}

export interface OrchestratorResponse {
  success: boolean;
  message?: string;
  publication?: Publication;
  error?: string;
}
