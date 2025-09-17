// types/db.ts

export interface AppUser {
  user_id: string;
  username: string;
  password: string;
  role: string;
  created: string; // DateTime en ISO string
}

export interface Category {
  category_id: string;
  str_value: string;
  type: string;
  num_value?: number;

  // Relations
  publications_type?: Publication[];
  publications_style?: Publication[];
  publications_author?: Publication[];
  prep_time?: PrepTime[];
  publication_tags?: PublicationTag[];
  product_categories?: ProductCategory[];
}

export interface Publication {
  publication_id: string;
  title: string;
  description: string[];
  note: string[];
  public: boolean;
  published: boolean;
  thumbnail?: string;
  type_id?: string;
  style_id?: string;
  author_id?: string;

  type?: Category;
  style?: Category;
  author?: Category;

  contents?: Content[];
  ingredientsRef?: Ingredient[];
  reviews?: Review[];
  tags?: PublicationTag[];
}

export interface PublicationTag {
  publication_id: string;
  category_id: string;

  publication?: Publication;
  category?: Category;
}

export interface Content {
  content_id: string;
  publication_id: string;
  total_prep_time: number;
  servings?: number;

  publication?: Publication;
  content_segments?: ContentSegment[];
  content_ingredients?: ContentIngredient[];
  content_prep_times?: ContentPrepTime[];
}

export interface Segment {
  segment_id: string;
  title?: string;
  paragraph: string;
  order_num?: number;

  content_segments?: ContentSegment[];
  segment_prep_time?: SegmentPrepTime[];
}

export interface Unit {
  unit_id: string;
  name: string;

  ingredient_units?: IngredientUnit[];
}

export interface Macro {
  macro_id: string;
  calories?: number;
  protein?: number;
  fiber?: number;
  sugar?: number;
  saturated?: number;
  trans?: number;
  caffein?: number;

  products?: Product[];
}

export interface Product {
  product_id: string;
  name: string;
  en_name?: string;
  macro_id?: string;

  macro?: Macro;
  ingredients?: Ingredient[];
  reviews?: Review[];
  product_categories?: ProductCategory[];
}

export interface Ingredient {
  ingredient_id: string;
  quantity?: number;
  is_recipe_id?: string;
  product_id: string;
  multiply_factor: number;

  product?: Product;
  isRecipe?: Publication;
  content_ingredients?: ContentIngredient[];
  ingredient_units?: IngredientUnit[];
}

export interface PrepTime {
  prep_time_id: string;
  duration: number;
  style_id?: string;

  style?: Category;
  content_prep_times?: ContentPrepTime[];
  segment_prep_time?: SegmentPrepTime[];
}

export interface ContentSegment {
  content_id: string;
  segment_id: string;
  position?: number;

  content?: Content;
  segment?: Segment;
}

export interface ContentIngredient {
  content_id: string;
  ingredient_id: string;

  content?: Content;
  ingredient?: Ingredient;
}

export interface ContentPrepTime {
  content_id: string;
  prep_time_id: string;

  content?: Content;
  prep_time?: PrepTime;
}

export interface SegmentPrepTime {
  segment_id: string;
  prep_time_id: string;

  segment?: Segment;
  prep_time?: PrepTime;
}

export interface IngredientUnit {
  ingredient_id: string;
  unit_id: string;

  ingredient?: Ingredient;
  unit?: Unit;
}

export interface ProductCategory {
  product_id: string;
  category_id: string;

  product?: Product;
  category?: Category;
}

export interface Review {
  review_id: string;
  product_id?: string;
  publication_id?: string;
  rating?: number;
  comment: string[];
  description: string[];
  buy_again?: string;
  date_review: string;

  product?: Product;
  publication?: Publication;
}
