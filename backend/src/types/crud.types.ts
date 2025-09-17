import { Category, CategoryCore, CategoryRelations, Product, ProductCore, 
  ProductRelations, Ingredient, IngredientCore, IngredientRelations, Macro, 
  Unit, PrepTime, Segment, SegmentCore, SegmentRelations, Content, ContentCore, 
  ContentRelations, PublicationCore, PublicationRelations, Review, Publication, IngredientUnit
} from "./controller.types.js";
import { PaginatedResponse, ReadAllParams } from "./db.types.js";
import { UserUpdateDto, UserCreateDto, PublicationReadDto } from "./dto.types.js";

export interface ControllerMap {
  users: GenericController<UserUpdateDto, UserCreateDto, UserUpdateDto>;
  categories: GenericController<Category, CategoryCore, CategoryRelations>;
  products: GenericController<Product, ProductCore, ProductRelations>;
  ingredients: GenericController<Ingredient, IngredientCore, IngredientRelations>;
  macros: GenericController<Macro, Omit<Macro, "macro_id" | "products">, Partial<Pick<Macro, "products">>>;
  units: GenericController<Unit, Omit<Unit, "ingredient_units">, { ingredient_units: IngredientUnit[] | null }>;
  prepTimes: GenericController<PrepTime, Omit<PrepTime, "style" | "content_prep_times" | "segment_prep_time">, { style: Category | null; content_prep_times: any[] | null; segment_prep_time: any[] | null }>;
  segments: GenericController<Segment, SegmentCore, SegmentRelations>;
  contents: GenericController<Content, ContentCore, ContentRelations>;
  publications: GenericController<PublicationReadDto, PublicationCore, PublicationRelations>;
  reviews: GenericController<Review, Omit<Review, "product" | "publication">,{ product: Product | null; publication: Publication | null }>;
}

export const junctionOrder = [
  "contentIngredients",
  "contentPrepTimes",
  "contentSegments",
  "segmentPrepTimes",
  "ingredientUnits",
  "productCategories",
  "publicationTags"
];

export interface GenericController<T, C, U, RelationConnectDto = any, RelationSetDto = any> {
  create(payload: C): Promise<T>;
  findById(id: string): Promise<T | null>;
  findAll(params?: ReadAllParams<T>): Promise<T[]>;
  
  update(
    id: string,
    payload: Partial<C & U> & {
      connect?: Partial<RelationConnectDto>;
      set?: Partial<RelationSetDto>;
    }
  ): Promise<T>;
  
  delete(id: string): Promise<{ deleted: boolean }>;
}

export interface GenericPaginatedController<T, C, U, RelationConnectDto = any, RelationSetDto = any> {
  create(payload: C): Promise<T>;
  findById(id: string): Promise<T | null>;
  findAll(params?: ReadAllParams<T>): Promise<PaginatedResponse<T>>;
  
  update(
    id: string,
    payload: Partial<C & U> & {
      connect?: Partial<RelationConnectDto>;
      set?: Partial<RelationSetDto>;
    }
  ): Promise<T>;
  
  delete(id: string): Promise<{ deleted: boolean }>;
}

