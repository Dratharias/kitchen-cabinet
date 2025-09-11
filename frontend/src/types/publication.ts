export interface Category {
  strValue: string;
  type: string;
}

export interface Paginated<T> {
  data: T;
  pagination: any;
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Publication {
  publicationId: string;
  title: string;
  description?: string[];
  note?: string[];
  public: boolean;
  published: boolean;
  thumbnail?: string;
  contents?: ContentDetails[];
  type?: Category;
  style?: Category;
  author?: Category;
  tags?: Category[];
  reviews: ReviewWithProduct[];
  resources: Resource[];
}

export interface Resource {
  contents: ContentDetails[];
}

export interface ContentDetails {
  contentId: string;
  totalPrepTime?: number;
  servings?: number;
  prepTimes: PrepTimeDetails[];
  ingredients: IngredientDetails[];
  segments: SegmentDetails[];
}

export interface PrepTimeDetails {
  duration: number;
  category?: Category;
}

export interface IngredientDetails {
  quantity?: number;
  units: UnitDetails[];
  product: ProductDetails;
}

export interface UnitDetails {
  name: string;
}

export interface ProductDetails {
  productId?: string;
  name: string;
  enName?: string;
  categories?: Category[];
  macro?: MacroDetails;
  reviews?: ProductReview[];
}

export interface MacroDetails {
  calories?: number;
  protein?: number;
  fiber?: number;
  sugar?: number;
  saturated?: number;
  trans?: number;
  caffein?: number;
}

export interface ProductReview {
  reviewId: string;
  rating?: number;
  comment?: string[];
  description?: string[];
  buyAgain?: string;
  dateReview: Date | null;
}

export interface SegmentDetails {
  title?: string;
  paragraph: string;
  order: number;
  prepTimes: PrepTimeDetails[];
}

export interface ReviewWithProduct {
  reviewId: string;
  rating?: number;
  comment?: string[];
  description?: string[];
  buyAgain?: string;
  dateReview: Date | null;
  product?: ProductDetails;
}
