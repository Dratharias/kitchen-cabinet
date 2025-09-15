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

export interface PublicationTags {
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

export interface Category {
  categoryId: string;
  strValue: string;
  type: string;
}

export interface ContentPrepTime {
  prepTimeId: string;
  duration: number;
  category?: Category;
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
  description?: string[];
  note?: string[];
  public: boolean;
  published: boolean;
  thumbnail?: string;
  type?: PublicationType;
  tags?: PublicationTags[];
  style?: PublicationStyle;
  author?: Author;
  reviews: {
    count: number;
    averageRating: number;
  };
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
  tags?: PublicationTags[];
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

export interface ContentPrepTimeInput {
  categoryId: string;
  prepTimeId: string;
  duration?: number;
}

export interface ContentIngredientInput {
  ingredientId: string;
  amount: number;
  unitId?: string;
}

export interface ContentInput {
  contentId?: string;
  servings?: number;
  totalPrepTime?: number;
  contentPrepTimes?: ContentPrepTimeInput[];
  contentIngredients?: ContentIngredientInput[];
}

export interface ReviewInput {
  userId: string;
  rating: number;
  comment?: string;
}

export interface PublicationBody {
  title: string;
  description?: string[];
  note?: string[];
  public?: boolean;
  published?: boolean;
  thumbnail?: string;
  type_id?: string;
  style_id?: string;
  author_id?: string;
  tags_id?: string[];
  contents?: ContentInput[];
  reviews?: ReviewInput[];
}
