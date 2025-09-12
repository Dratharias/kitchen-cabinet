export interface PublicationType {
  categoryId: string;
  strValue: string;
  type: string;
}

export interface PublicationStyle {
  categoryId: string;
  strValue: string;
  type: string;
}

export interface Author {
  categoryId: string;
  strValue: string;
  type: string;
}

export interface PublicationReview {
  reviewId: string;
  productId?: string;
  rating?: number;
  comment?: string[];
  description?: string[];
  buyAgain?: string;
  dateReview?: Date | null;
}

export interface PrepTimeCategory {
  prepTimeId: string;
  categoryId: string;
}

export interface ContentPrepTime {
  prepTimeId: string;
  duration: number;
  category?: {
    categoryId: string;
    strValue: string;
    type: string;
  };
}

export interface SegmentDetails {
  segmentId: string;
  title?: string;
  paragraph: string;
  order: number;
  prepTimes: ContentPrepTime[];
}

export interface IngredientUnit {
  name: string;
}

export interface IngredientProduct {
  productId: string;
  name: string;
}

export interface IngredientDetails {
  ingredientId: string;
  quantity?: number;
  units?: IngredientUnit[];
  product: IngredientProduct;
}

export interface ContentDetails {
  contentId: string;
  totalPrepTime: number;
  servings?: number;
  prepTimes: ContentPrepTime[];
  segments: SegmentDetails[];
  ingredients: IngredientDetails[];
}

export interface PublicationDetails {
  publicationId: string;
  title: string;
  description: string[];
  note: string[];
  public: boolean;
  published: boolean;
  thumbnail?: string;
  type?: PublicationType;
  style?: PublicationStyle;
  author?: Author;
  reviews: PublicationReview[];
  contents: ContentDetails[];
}

export interface PublicationListItem {
  publicationId: string;
  title: string;
  description: string[];
  note: string[];
  thumbnail?: string;
  type?: PublicationType;
  style?: PublicationStyle;
  author?: Author;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PublicationListResponse {
  data: PublicationListItem[];
  pagination: PaginationInfo;
}