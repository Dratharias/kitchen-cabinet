import {
  CategoryCore,
  CategoryRelations,
  ProductCore,
  ProductRelations,
  UnitCore,
  UnitRelations,
  SegmentCore,
  SegmentRelations,
} from "./controller.types.js";

export type CrudAction = "create" | "read" | "readAll" | "update" | "delete";

interface NestedEntityPayload<T, C, U> {
  id?: string;
  data?: C | Partial<U>;
  relations?: T;
}

interface NestedPublicationRequest {
  publication_id?: string;
  title?: string;
  description?: string[];
  note?: string[];
  thumbnail?: string;
  gallery?: string[];
  type?: NestedEntityPayload<
    CategoryRelations,
    CategoryCore,
    CategoryRelations
  >;
  style?: NestedEntityPayload<
    CategoryRelations,
    CategoryCore,
    CategoryRelations
  >;
  author?: NestedEntityPayload<
    CategoryRelations,
    CategoryCore,
    CategoryRelations
  >;
  contents?: NestedContentRequest[];
  reviewCount?: number;
  reviewAverageScore?: number;
  tags?: NestedEntityPayload<
    CategoryRelations,
    CategoryCore,
    CategoryRelations
  >[];
}

interface NestedContentRequest {
  content_id?: string;
  total_prep_time?: number;
  servings?: number;
  content_segments?: NestedContentSegmentRequest[];
  content_ingredients?: NestedContentIngredientRequest[];
  content_prep_times?: NestedContentPrepTimeRequest[];
}

interface NestedContentSegmentRequest {
  position?: number;
  segment?: NestedEntityPayload<
    SegmentRelations,
    SegmentCore,
    SegmentRelations
  >;
}

interface NestedContentIngredientRequest {
  ingredient_id?: string;
  quantity?: number;
  product?: NestedEntityPayload<
    ProductRelations,
    ProductCore,
    ProductRelations
  >;
  ingredient_units?: NestedEntityPayload<
    UnitRelations,
    UnitCore,
    UnitRelations
  >[];
}

interface NestedContentPrepTimeRequest {
  prep_time_id?: string;
  duration?: number;
  style?: NestedEntityPayload<
    CategoryRelations,
    CategoryCore,
    CategoryRelations
  >;
}

export interface OrchestratorRequest {
  action: CrudAction;
  payload: Record<string, NestedPublicationRequest>;
}

export interface OrchestratorResponse {
  success: boolean;
  results?: Record<string, any>;
  error?: string;
}
