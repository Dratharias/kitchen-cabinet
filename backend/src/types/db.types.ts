export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: string;
}

export interface BaseQuery {
  page: number;
  limit: number;
  sortBy: string;
  order: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type UserRoleData = "admin" | "guest" | "user"

export interface AppUserData {
  user_id: string;
  username: string;
  password: string;
  role: UserRoleData;
  updated: string; // DateTime en ISO string
  created: string; // DateTime en ISO string
}

export interface CategoryData {
  category_id: string;
  str_value: string;
  type: string;

  // Relations
  publications_type: PublicationData[] | null;
  publications_style: PublicationData[] | null;
  publications_author: PublicationData[] | null;
  prep_time: PrepTimeData[] | null;
  publication_tags: PublicationTagData[] | null;
  product_categories: ProductCategoryData[] | null;
}

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

  type: CategoryData | null;
  style: CategoryData | null;
  author: CategoryData | null;

  contents: ContentData[] | null;
  ingredientsRef: IngredientData[] | null;
  reviews: ReviewData[] | null;
  tags: PublicationTagData[] | null;
}

export interface PublicationTagData {
  publication_id: string;
  category_id: string;

  publication: PublicationData | null;
  category: CategoryData | null;
}

export interface ContentData {
  content_id: string;
  publication_id: string;
  total_prep_time: number;
  servings: number | null;

  publication: PublicationData | null;
  content_segments: ContentSegmentData[] | null;
  content_ingredients: ContentIngredientData[] | null;
  content_prep_times: ContentPrepTimeData[] | null;
}

export interface SegmentData {
  segment_id: string;
  title: string | null;
  paragraph: string;
  order_num: number | null;

  content_segments: ContentSegmentData[] | null;
  segment_prep_time: SegmentPrepTimeData[] | null;
}

export interface UnitData {
  unit_id: string;
  name: string;

  ingredient_units: IngredientUnitData[] | null;
}

export interface MacroData {
  macro_id: string;
  calories: number | null;
  protein: number | null;
  fiber: number | null;
  sugar: number | null;
  saturated: number | null;
  trans: number | null;
  caffein: number | null;

  products: ProductData[] | null;
}

export interface ProductData {
  product_id: string;
  name: string;
  en_name: string | null;
  macro_id: string | null;

  macro: MacroData | null;
  ingredients: IngredientData[] | null;
  reviews: ReviewData[] | null;
  product_categories: ProductCategoryData[] | null;
}

export interface IngredientData {
  ingredient_id: string;
  quantity: number | null;
  is_recipe_id: string | null;
  product_id: string;
  multiply_factor: number;

  product: ProductData | null;
  isRecipe: PublicationData | null;
  content_ingredients: ContentIngredientData[] | null;
  ingredient_units: IngredientUnitData[] | null;
}

export interface PrepTimeData {
  prep_time_id: string;
  duration: number;
  style_id: string | null;

  style: CategoryData | null;
  content_prep_times: ContentPrepTimeData[] | null;
  segment_prep_time: SegmentPrepTimeData[] | null;
}

export interface ContentSegmentData {
  content_id: string;
  segment_id: string;
  position: number | null;

  content: ContentData | null;
  segment: SegmentData | null;
}

export interface ContentIngredientData {
  content_id: string;
  ingredient_id: string;

  content: ContentData | null;
  ingredient: IngredientData | null;
}

export interface ContentPrepTimeData {
  content_id: string;
  prep_time_id: string;

  content: ContentData | null;
  prep_time: PrepTimeData | null;
}

export interface SegmentPrepTimeData {
  segment_id: string;
  prep_time_id: string;

  segment: SegmentData | null;
  prep_time: PrepTimeData | null;
}

export interface IngredientUnitData {
  ingredient_id: string;
  unit_id: string;

  ingredient: IngredientData | null;
  unit: UnitData | null;
}

export interface ProductCategoryData {
  product_id: string;
  category_id: string;

  product: ProductData | null;
  category: CategoryData | null;
}

// Yes, No, Maybe, Dunno
export type BuyAgainData = "Y" | "N" | "M" | "D"

export interface ReviewData {
  review_id: string;
  product_id: string | null;
  publication_id: string | null;
  rating: number | null;
  comment: string[];
  description: string[];
  buy_again: BuyAgainData | null;
  date_review: string;

  product: ProductData | null;
  publication: PublicationData | null;
}
