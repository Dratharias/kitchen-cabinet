import {
  Category, CategoryCore, CategoryRelations,
  Product, ProductCore, ProductRelations,
  Ingredient, IngredientCore, IngredientRelations,
  Macro, MacroCore, MacroRelations,
  Unit, UnitCore, UnitRelations,
  PrepTime, PrepTimeCore, PrepTimeRelations,
  Segment, SegmentCore, SegmentRelations,
  Content, ContentCore, ContentRelations,
  Publication, PublicationCore, PublicationRelations,
  Review, ReviewCore, ReviewRelations,
  User
} from "./controller.types.js";

import {
  UserCreateDto, UserUpdateDto,
  PublicationCreateDto, ReviewCreateDto
} from "./dto.types.js";

export type CrudAction = "create" | "read" | "readAll" | "update" | "delete";

export interface EntityPayload<_T, C, U> {
  id?: string;
  data?: C | Partial<U>;
}

/**
 * Cas 1: payload de publication
 */
export interface PublicationRequest {
  action: CrudAction;
  publications: EntityPayload<Publication, PublicationCreateDto, PublicationRelations>;
  reviews?: never;
  products?: EntityPayload<Product, ProductCore, ProductRelations>[];
  contents?: EntityPayload<Content, ContentCore, ContentRelations>[];
  ingredients?: EntityPayload<Ingredient, IngredientCore, IngredientRelations>[];
  categories?: EntityPayload<Category, CategoryCore, CategoryRelations>[];
  macros?: EntityPayload<Macro, MacroCore, MacroRelations>[];
  prepTimes?: EntityPayload<PrepTime, PrepTimeCore, PrepTimeRelations>[];
  segments?: EntityPayload<Segment, SegmentCore, SegmentRelations>[];
  units?: EntityPayload<Unit, UnitCore, UnitRelations>[];
  users?: EntityPayload<User, UserCreateDto, UserUpdateDto>[];
}

/**
 * Cas 2: payload de review lié à un product
 */
export interface ReviewOnProductRequest {
  action: CrudAction;
  reviews: EntityPayload<Review, ReviewCreateDto, ReviewRelations>;
  products: EntityPayload<Product, ProductCore, ProductRelations>[];
  publications?: never;
}

/**
 * Cas 3: payload de review lié à une publication
 */
export interface ReviewOnPublicationRequest {
  action: CrudAction;
  reviews: EntityPayload<Review, ReviewCreateDto, ReviewRelations>;
  publications: EntityPayload<Publication, PublicationCore, PublicationRelations>;
  products?: never;
}

export type OrchestratorRequest =
  | PublicationRequest
  | ReviewOnProductRequest
  | ReviewOnPublicationRequest;

export interface OrchestratorResponse {
  success: boolean;
  results?: Record<string, any[]>;
  error?: string;
}
