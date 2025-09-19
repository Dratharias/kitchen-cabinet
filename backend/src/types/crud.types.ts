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
} from "./controller.types.js";
import { PaginatedResponse, ReadAllParams } from "./db.types.js";
import { UserUpdateDto, UserCreateDto } from "./dto.types.js";

export interface ControllerMap {
  users: GenericController<UserUpdateDto, UserCreateDto, UserUpdateDto>;
  categories: GenericController<Category, CategoryCore, CategoryRelations>;
  products: GenericController<Product, ProductCore, ProductRelations>;
  ingredients: GenericController<Ingredient, IngredientCore, IngredientRelations>;
  macros: GenericController<Macro, MacroCore, MacroRelations>;
  units: GenericController<Unit, UnitCore, UnitRelations>;
  prepTimes: GenericController<PrepTime, PrepTimeCore, PrepTimeRelations>;
  segments: GenericController<Segment, SegmentCore, SegmentRelations>;
  contents: GenericController<Content, ContentCore, ContentRelations>;
  publications: GenericPaginatedController<Publication, PublicationCore, PublicationRelations>;
  reviews: GenericController<Review, ReviewCore, ReviewRelations>;
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