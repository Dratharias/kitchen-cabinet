import { CategoryCore } from "./controller.types.js";

/* ============================================================
   Génériques & utilitaires
   ============================================================ */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: string;
}

export interface BaseQuery {
  page: number;
  limit: number;
  sortBy: string;
  order: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ReadAllParams<T> {
  filter?: Partial<T>;
  includeRelations?: boolean;
  skip?: number;
  take?: number;
}

/* ============================================================
   Types simples
   ============================================================ */
export type UserRoleData = "admin" | "guest" | "user";
export type BuyAgainData = "Y" | "N" | "M" | "D";

/* ============================================================
   Domaine: Utilisateur
   ============================================================ */
export interface AppUserData {
  user_id: string;
  username: string;
  password: string;
  role: UserRoleData;
  updated: string;
  created: string;
}

/* ============================================================
   Domaine: Catégorie
   ============================================================ */
export interface CategoryData {
  category_id: string;
  str_value: string;
  type: string;

  // Relations 1-N et N-N
  publications_type: PublicationData[] | null; // 1-N
  publications_style: PublicationData[] | null; // 1-N
  publications_author: PublicationData[] | null; // 1-N
  prep_time: PrepTimeData[] | null; // 1-N
  publication_tags: PublicationTagData[] | null; // N-N
  product_categories: ProductCategoryData[] | null; // N-N
}

/* ============================================================
   Domaine: Publication
   ============================================================ */
export interface PublicationData {
  publication_id: string;
  title: string;
  description: string[];
  note: string[];
  public: boolean;
  published: boolean;
  thumbnail: string | null;
  type_id: string | null;
  style_id: string | null;
  author_id: string | null;

  // Relations N-1 (références directes)
  type: CategoryCore | null; // N-1
  style: CategoryCore | null; // N-1
  author: CategoryCore | null; // N-1

  // Relations 1-N et N-N
  contents: ContentData[] | null; // 1-N
  productsRef: IngredientData[] | null; // N-N (RecipeReference)
  reviews: ReviewData[] | null; // 1-N
  tags: PublicationTagData[] | null; // N-N
}

export interface PublicationTagData {
  publication_id: string;
  category_id: string;

  // Relations N-N
  publication: PublicationData | null; // N-N
  category: CategoryData | null; // N-N
}

/* ============================================================
   Domaine: Contenu
   ============================================================ */
export interface ContentData {
  content_id: string;
  publication_id: string;
  total_prep_time: number;
  servings: number | null;

  // Relations N-1
  publication: PublicationData | null; // N-1

  // Relations N-N
  content_segments: ContentSegmentData[] | null; // N-N
  content_ingredients: ContentIngredientData[] | null; // N-N
  content_prep_times: ContentPrepTimeData[] | null; // N-N
}

export interface ContentSegmentData {
  content_id: string;
  segment_id: string;
  position: number | null;

  // Relations N-N
  content: ContentData | null; // N-N
  segment: SegmentData | null; // N-N
}

export interface ContentIngredientData {
  content_id: string;
  ingredient_id: string;

  // Relations N-N
  content: ContentData | null; // N-N
  ingredient: IngredientData | null; // N-N
}

export interface ContentPrepTimeData {
  content_id: string;
  prep_time_id: string;

  // Relations N-N
  content: ContentData | null; // N-N
  prep_time: PrepTimeData | null; // N-N
}

/* ============================================================
   Domaine: Segment
   ============================================================ */
export interface SegmentData {
  segment_id: string;
  title: string | null;
  paragraph: string;
  order_num: number | null;

  // Relations N-N
  content_segments: ContentSegmentData[] | null; // N-N
  segment_prep_time: SegmentPrepTimeData[] | null; // N-N
}

export interface SegmentPrepTimeData {
  segment_id: string;
  prep_time_id: string;

  // Relations N-N
  segment: SegmentData | null; // N-N
  prep_time: PrepTimeData | null; // N-N
}

/* ============================================================
   Domaine: Produit
   ============================================================ */
export interface ProductData {
  product_id: string;
  name: string;
  en_name: string | null;
  macro_id: string | null;
  is_recipe_id: string | null;

  // Relations N-1
  macro: MacroData | null; // N-1
  isRecipe: PublicationData | null; // N-1

  // Relations 1-N
  ingredients: IngredientData[] | null; // 1-N
  reviews: ReviewData[] | null; // 1-N

  // Relations N-N
  product_categories: ProductCategoryData[] | null; // N-N
}

export interface ProductCategoryData {
  product_id: string;
  category_id: string;

  // Relations N-N
  product: ProductData | null; // N-N
  category: CategoryData | null; // N-N
}

/* ============================================================
   Domaine: Macro nutritionnel
   ============================================================ */
export interface MacroData {
  macro_id: string;
  calories: number | null;
  protein: number | null;
  fiber: number | null;
  sugar: number | null;
  saturated: number | null;
  trans: number | null;
  caffein: number | null;

  // Relations 1-N
  products: ProductData[] | null; // 1-N
}

/* ============================================================
   Domaine: Ingrédient
   ============================================================ */
export interface IngredientData {
  ingredient_id: string;
  quantity: number | null;
  product_id: string;
  multiply_factor: number;

  // Relations N-1
  product: ProductData | null; // N-1

  // Relations N-N
  content_ingredients: ContentIngredientData[] | null; // N-N
  ingredient_units: IngredientUnitData[] | null; // N-N
}

export interface IngredientUnitData {
  ingredient_id: string;
  unit_id: string;

  // Relations N-N
  ingredient: IngredientData | null; // N-N
  unit: UnitData | null; // N-N
}

/* ============================================================
   Domaine: Unité de mesure
   ============================================================ */
export interface UnitData {
  unit_id: string;
  name: string;

  // Relations 1-N
  ingredient_units: IngredientUnitData[] | null; // 1-N
}

/* ============================================================
   Domaine: Temps de préparation
   ============================================================ */
export interface PrepTimeData {
  prep_time_id: string;
  duration: number;
  style_id: string | null;

  // Relations N-1
  style: CategoryData | null; // N-1

  // Relations N-N
  content_prep_times: ContentPrepTimeData[] | null; // N-N
  segment_prep_time: SegmentPrepTimeData[] | null; // N-N
}

/* ============================================================
   Domaine: Avis / Review
   ============================================================ */
export interface ReviewData {
  review_id: string;
  product_id: string | null;
  publication_id: string | null;
  rating: number | null;
  comment: string[];
  description: string[];
  buy_again: BuyAgainData | null;
  date_review: string;

  // Relations N-1
  product: ProductData | null; // N-1
  publication: PublicationData | null; // N-1
}
