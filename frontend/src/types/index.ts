// =================================================================
// 1. Core Entities & Payloads
//    - Defines the basic shape of data models.
//    - "Payload" types are for creation/updates.
//    - Main types include server-generated fields like IDs.
// =================================================================

export interface GalleryItem {
  gallery_id: string;
  order_num: number;
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

export interface MacroPayload {
  calories?: number;
  protein?: number;
  carbs?: number;
  fiber?: number;
  sugar?: number;
  saturated?: number | null;
  trans?: number | null;
  caffein?: number | null;
  alcohol?: number;
}
export interface Macro extends MacroPayload {
  macro_id: string;
}

export interface CategoryPayload {
  str_value: string;
  type: string;
}
export interface Category extends CategoryPayload {
  category_id: string;
}

export interface Servings {
  serving_id?: string;
  yield: number;
  value: string;
}

export interface PrepTimePayload {
  duration: number;
  style_id?: string | null;
  style?: CategoryPayload; // For connect/create operations
}
export interface PrepTime extends PrepTimePayload {
  prep_time_id: string;
}

export interface ProductPayload {
  name: string;
  is_recipe?: boolean;
  macro_id?: string | null;
  macro?: MacroPayload | null; // For connect/create operations
}
export interface Product extends ProductPayload {
  product_id: string;
}

export interface IngredientPayload {
  quantity?: number;
  multiply_factor?: number;
  cut?: string;
  title?: string;
  product_id?: string;
  product: ProductPayload; // For connect/create operations
  ingredient_units?: UnitPayload[]; // For connect/create operations
}
export interface Ingredient extends IngredientPayload {
  ingredient_id: string;
  product: Product;
  ingredient_units?: Unit[];
}

export interface SegmentPayload {
  title?: string;
  paragraph: string;
  segment_prep_time?: { prep_time: PrepTimePayload }[]; // For connect/create
}
export interface Segment extends SegmentPayload {
  segment_id: string;
  segment_prep_time?: { prep_time: PrepTime }[];
}

export interface ContentPayload {
  total_prep_time: number;
  servings?: Servings | null;
  gallery?: GalleryItem[] | null;
  subtitle?: string;
  is_ingredient?: boolean;
  publication_id?: string;
  content_segments?: { position: number; segment: SegmentPayload }[];
  content_ingredients?: IngredientPayload[];
  content_prep_times?: PrepTimePayload[];
}
export interface Content extends ContentPayload {
  content_id: string;
  thumbnail?: string;
  content_segments?: { position: number; segment: Segment }[];
  content_ingredients?: Ingredient[];
  content_prep_times?: PrepTime[];
}

export interface PublicationPayload {
  title: string;
  description?: string[];
  note?: string[];
  public?: boolean;
  published?: boolean;
  thumbnail?: string;
  type_id?: string | null;
  style_id?: string | null;
  author_id?: string | null;
  tags?: CategoryPayload[];
  contents?: ContentPayload[];
}
export interface Publication extends PublicationPayload {
  publication_id: string;
  reviewCount: number;
  averageRating: number;
  type: Category;
  style: Category;
  author: Category;
  contents: Content[];
  productsRef?: Product[];
  tags?: Category[];
}

export interface ReviewPayload {
  product_id?: string | null;
  publication_id?: string | null;
  rating?: number | null;
  comment?: string[];
  description?: string[];
  buy_again?: BuyAgain | null;
  date_review?: string;
}
export interface Review extends ReviewPayload {
  review_id: string;
  product: Product | null;
  publication: Publication | null;
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
  error: string;
}

export interface SuccessResponse {
    success: boolean;
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
export type UserApi = EntityApi<User, Omit<User, 'user_id' | 'created_at'> & { password?: string }>;
export type CategoryApi = EntityApi<Category, CategoryPayload>;
export type UnitApi = EntityApi<Unit, UnitPayload>;
export type MacroApi = EntityApi<Macro, MacroPayload>;
export type ProductApi = EntityApi<Product, ProductPayload>;
export type PrepTimeApi = EntityApi<PrepTime, PrepTimePayload>;
export type IngredientApi = EntityApi<Ingredient, IngredientPayload>;
export type SegmentApi = EntityApi<Segment, SegmentPayload>;
export type ContentApi = EntityApi<Content, ContentPayload>;
export type PublicationApi = EntityApi<Publication, PublicationPayload> & { ListRequest: PaginatedRequest & { tagIds?: string[], contentIds?: string[] } };
export type ReviewApi = EntityApi<Review, ReviewPayload>;


// =================================================================
// 3. Orchestrator & Complex Payloads
//    - Defines types for complex, multi-entity operations.
// =================================================================

export type OrchestratorAction = "create" | "update" | "delete";

export interface OrchestratorPayload {
  action: OrchestratorAction;
  payload: {
    publications?: Record<string, PublicationPayload | null>;
    reviews?: Record<string, ReviewPayload | null>;
    // Add other entities here as needed for orchestration
  };
}

export interface OrchestratorResponse {
  success: boolean;
  message?: string;
  results?: {
    publications?: Publication[];
    contents?: Content[];
    segments?: Segment[];
    ingredients?: Ingredient[];
    products?: Product[];
    categories?: Category[];
    units?: Unit[];
    prepTimes?: PrepTime[];
    reviews?: Review[];
    macros?: Macro[];
    users?: User[];
  };
  error?: string;
}

