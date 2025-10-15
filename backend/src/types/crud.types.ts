import {
  Category,
  CategoryCore,
  CategoryRelations,
  Product,
  ProductCore,
  ProductRelations,
  Ingredient,
  IngredientCore,
  IngredientRelations,
  Macro,
  MacroCore,
  MacroRelations,
  Unit,
  UnitCore,
  UnitRelations,
  PrepTime,
  PrepTimeCore,
  PrepTimeRelations,
  Segment,
  SegmentCore,
  SegmentRelations,
  Content,
  ContentCore,
  ContentRelations,
  Publication,
  PublicationCore,
  PublicationRelations,
  Review,
  ReviewCore,
  ReviewRelations,
  Servings,
  ServingsCore,
  ServingsRelations,
} from "./controller.types.js";
import { PaginatedResponse, ReadAllParams } from "./db.types.js";
import { UserUpdateDto, UserCreateDto, CategoryConnect, ProductConnect, ProductSet, IngredientConnect, UnitConnect, PrepTimeConnect, SegmentConnect, ContentConnect, PublicationConnect, PublicationUpdateDto, ReviewConnect, ServingsConnect } from "./dto.types.js";

// Les DTOs de Relation Connect/Set ne sont pas modifiés car ils sont
// utilisés par les DTOs générés dans dto.types.ts

// Mappage pour les interfaces DTO de relations
type CategoryRelationDTO = { connect: CategoryConnect, set: CategoryConnect };
type ProductRelationDTO = { connect: ProductConnect, set: ProductSet };
type IngredientRelationDTO = { connect: IngredientConnect, set: IngredientConnect };
type UnitRelationDTO = { connect: UnitConnect, set: UnitConnect };
type PrepTimeRelationDTO = { connect: PrepTimeConnect, set: PrepTimeConnect };
type SegmentRelationDTO = { connect: SegmentConnect, set: SegmentConnect };
type ContentRelationDTO = { connect: ContentConnect, set: ContentConnect };
type PublicationRelationDTO = { connect: PublicationConnect, set: PublicationConnect };
type ReviewRelationDTO = { connect: ReviewConnect, set: ReviewConnect };
type ServingsRelationDTO = { connect: ServingsConnect, set: ServingsConnect };


export interface ControllerMap {
  users: GenericController<UserUpdateDto, UserCreateDto, UserUpdateDto>;
  categories: GenericController<Category, CategoryCore, CategoryRelations, CategoryConnect, CategoryConnect>;
  products: GenericController<Product, ProductCore, ProductRelations, ProductConnect, ProductSet>;
  ingredients: GenericController<
    Ingredient,
    IngredientCore,
    IngredientRelations,
    IngredientConnect,
    IngredientConnect
  >;
  macros: GenericController<Macro, MacroCore, MacroRelations>;
  units: GenericController<Unit, UnitCore, UnitRelations, UnitConnect, UnitConnect>;
  prepTimes: GenericController<PrepTime, PrepTimeCore, PrepTimeRelations, PrepTimeConnect, PrepTimeConnect>;
  segments: GenericController<Segment, SegmentCore, SegmentRelations, SegmentConnect, SegmentConnect>;
  contents: GenericController<Content, ContentCore, ContentRelations, ContentConnect, ContentConnect>;
  publications: GenericPaginatedController<
    Publication,
    PublicationCore,
    PublicationRelations,
    PublicationConnect,
    PublicationConnect
  >;
  reviews: GenericController<Review, ReviewCore, ReviewRelations, ReviewConnect, ReviewConnect>;
  servings: GenericController<Servings, ServingsCore, ServingsRelations, ServingsConnect, ServingsConnect>;
}

export const junctionOrder = [
  "contentIngredients",
  "contentPrepTimes",
  "contentSegments",
  "segmentPrepTimes",
  "ingredientUnits",
  "productCategories",
  "publicationTags",
];

// Mise à jour : le payload pour l'update est maintenant un Partial de C & U pour supporter le PATCH
export interface GenericController<
  T,
  C,
  U,
  RelationConnectDto = any,
  RelationSetDto = any,
> {
  create(payload: C & { connect?: RelationConnectDto }): Promise<T>;
  findById(id: string): Promise<T | null>;
  findAll(params?: ReadAllParams<T>): Promise<T[]>;

  // PATCH Support: Le payload est Partiel de Core (C) et Relations (U) + connect/set
  update(
    id: string,
    payload: Partial<C & U> & {
      connect?: Partial<RelationConnectDto>;
      set?: Partial<RelationSetDto>;
    },
  ): Promise<T>;

  delete(id: string): Promise<{ deleted: boolean }>;
}

// Mise à jour : le payload pour l'update est maintenant un Partial de C & U pour supporter le PATCH
export interface GenericPaginatedController<
  T,
  C,
  U,
  RelationConnectDto = any,
  RelationSetDto = any,
> {
  create(payload: C & { connect?: RelationConnectDto }): Promise<T>;
  findById(id: string): Promise<T | null>;
  findAll(params?: ReadAllParams<T>): Promise<PaginatedResponse<T>>;

  // PATCH Support: Le payload est Partiel de Core (C) et Relations (U) + connect/set
  update(
    id: string,
    payload: Partial<C & U> & {
      connect?: Partial<RelationConnectDto>;
      set?: Partial<RelationSetDto>;
    },
  ): Promise<T>;

  delete(id: string): Promise<{ deleted: boolean }>;
}
