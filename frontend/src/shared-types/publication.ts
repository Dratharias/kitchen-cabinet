export interface DeepPublication {
  publication_id: string;
  title: string;
  description: string[];
  note: string[];
  public: boolean;
  published: boolean;
  thumbnail?: string;

  // Relations
  type?: Category;
  style?: Category;
  author?: Category;
  tags?: PublicationTag[];

  // Nested contents
  contents?: DeepContent[];

  // Ingredients referencing recipes
  ingredientsRef?: DeepIngredient[];

  // Reviews
  reviews?: DeepReview[];
}

export interface DeepContent {
  content_id: string;
  total_prep_time: number;
  servings?: number;

  content_segments?: {
    segment_id: string;
    title?: string;
    paragraph: string;
    order_num?: number;
    position?: number;
  }[];

  content_ingredients?: DeepIngredient[];

  content_prep_times?: {
    prep_time_id: string;
    duration: number;
    style?: Category;
  }[];
}

export interface DeepIngredient {
  ingredient_id: string;
  quantity?: number;
  multiply_factor: number;

  // Linked product
  product?: DeepProduct;

  // If this ingredient references a recipe
  isRecipe?: DeepPublication;

  ingredient_units?: {
    unit_id: string;
    name: string;
  }[];
}

export interface DeepProduct {
  product_id: string;
  name: string;
  en_name?: string;

  // Product macro
  macro?: Macro;

  // Nested ingredients
  ingredients?: DeepIngredient[];

  // Reviews
  reviews?: DeepReview[];

  // Categories
  product_categories?: Category[];
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
}

export interface DeepReview {
  review_id: string;
  rating?: number;
  comment: string[];
  description: string[];
  buy_again?: string;
  date_review: string;

  product?: DeepProduct;
  publication?: DeepPublication;
}

// Simple relation types
export interface Category {
  category_id: string;
  str_value: string;
  type: string;
}

export interface PublicationTag {
  publication_id: string;
  category_id: string;
  category?: Category;
}
