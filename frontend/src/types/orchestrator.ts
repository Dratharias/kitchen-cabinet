import { Category, Content, Ingredient, Macro, PrepTime, Product, Publication, Review, Segment, Unit, User } from '.';

export interface OrchestratorEntity<T> {
  id?: string;
  data: T;
}

export interface PublicationCreate {
  title: string;
  description: string[];
  note: string[];
  public: boolean;
  published: boolean;
  thumbnail: string | null;
  type_id: string | null;
  style_id: string | null;
  author_id: string | null;
}

export interface ContentCreate {
  publication_id: string;
  total_prep_time: number;
  servings: number | null;
}

export interface SegmentCreate {
  title: string | null;
  paragraph: string;
  order_num: number | null;
}

export interface IngredientCreate {
  quantity: number | null;
  is_recipe_id: string | null;
  product_id: string;
  multiply_factor: number;
}

export interface ProductCreate {
  name: string;
  en_name: string | null;
  macro_id: string | null;
}

export interface CategoryCreate {
  str_value: string;
  type: string;
}

export interface UnitCreate {
  name: string;
}

export interface PrepTimeCreate {
  duration: number;
  style_id: string | null;
}

export interface MacroCreate {
  calories: number | null;
  protein: number | null;
  fiber: number | null;
  sugar: number | null;
  saturated: number | null;
  trans: number | null;
  caffein: number | null;
}

export interface ReviewCreate {
  rating: number | null;
  comment: string[];
  description: string[];
  buy_again: 'Y' | 'N' | 'M' | 'D' | null;
  date_review: string;
  product_id: string | null;
  publication_id: string | null;
}

export interface OrchestratorRequest {
  action: 'create';
  publications?: OrchestratorEntity<PublicationCreate>;
  contents?: OrchestratorEntity<ContentCreate>[];
  segments?: OrchestratorEntity<SegmentCreate>[];
  ingredients?: OrchestratorEntity<IngredientCreate>[];
  products?: OrchestratorEntity<ProductCreate>[];
  categories?: OrchestratorEntity<CategoryCreate>[];
  units?: OrchestratorEntity<UnitCreate>[];
  prepTimes?: OrchestratorEntity<PrepTimeCreate>[];
  macros?: OrchestratorEntity<MacroCreate>[];
  reviews?: OrchestratorEntity<ReviewCreate>;
}

export interface OrchestratorResponse {
  success: boolean;
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