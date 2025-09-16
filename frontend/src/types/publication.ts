// Base category interface used across different publication elements
export interface CategoryInfo {
  categoryId: string;
  strValue: string;
  type: string;
}

// Publication type, style, and author interfaces
export interface PublicationTags extends CategoryInfo {}
export interface PublicationType extends CategoryInfo {}
export interface PublicationStyle extends CategoryInfo {}
export interface Author extends CategoryInfo {}

// Preparation time interfaces
export interface PrepTimeCategory {
  prepTimeId: string;
  categoryId: string;
}

export interface ContentPrepTime {
  prepTimeId: string;
  duration: number;
  category?: CategoryInfo;
}

// Segment interface for content structure
export interface SegmentDetails {
  segmentId: string;
  title?: string;
  paragraph: string;
  order: number;
  prepTimes: ContentPrepTime[];
}

// Ingredient interfaces
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

// Content details interface
export interface ContentDetails {
  contentId: string;
  totalPrepTime: number;
  servings?: number;
  prepTimes: ContentPrepTime[];
  segments: SegmentDetails[];
  ingredients: IngredientDetails[];
}

// Full publication details interface (used for single publication view)
export interface PublicationDetails {
  reviews: PublicationReview[];
  publicationId: string;
  title: string;
  description: string[];
  note: string[];
  public: boolean;
  published: boolean;
  thumbnail?: string;
  tags: PublicationTags[];
  type?: PublicationType;
  style?: PublicationStyle;
  author?: Author;
  reviewsCount?: number;
  averageRating?: number | null;
  contents: ContentDetails[];
}

// Simplified publication interface for list views
export interface PublicationListItem {
  publicationId: string;
  title: string;
  tags: PublicationTags[];
  averageRating: number;
  reviewsCount: number;
  description: string[];
  note: string[];
  thumbnail?: string;
  type?: PublicationType;
  style?: PublicationStyle;
  author?: Author;
}

// Pagination interface
export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// API response interface for publication lists
export interface PublicationListResponse {
  data: PublicationListItem[];
  pagination: PaginationInfo;
}

// Frontend-specific interfaces for components
export interface CardData {
  publication: PublicationListItem;
  pathPrefix: "feeds" | "foods";
  baseUrl: string;
}

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

// Query interfaces for API calls
export interface PublicationQuery {
  page?: string;
  limit?: string;
  type?: string[];
  search?: string;
}

export interface PublicationCreateRequest {
  title: string;
  description?: string[];
  note?: string[];
  public?: boolean;
  published?: boolean;
  thumbnail?: string;
  type_id?: string;
  style_id?: string;
  author_id?: string;
}

export interface PublicationUpdateRequest extends Partial<PublicationCreateRequest> {}

// API response types
export type ApiResponse<T> = T;
export type ApiError = {
  error: string;
  code?: string;
};

// Utility types for different publication categories
export type PublicationTypeValue = 
  | "Article" 
  | "Review" 
  | "Book" 
  | "Recipe" 
  | "Cookbook" 
  | "FoodPost";

export type FeedTypes = "Article" | "Review" | "Book";
export type FoodTypes = "Recipe" | "Cookbook" | "FoodPost";

// Type guards for runtime type checking
export const isPublicationDetails = (obj: any): obj is PublicationDetails => {
  return obj && typeof obj === 'object' && 
         'publicationId' in obj && 
         'contents' in obj &&
         Array.isArray(obj.contents);
};

export const isPublicationListItem = (obj: any): obj is PublicationListItem => {
  return obj && typeof obj === 'object' && 
         'publicationId' in obj && 
         !('contents' in obj);
};

// Filter utilities
export const getTypesByCategory = (category: 'feeds' | 'foods'): PublicationTypeValue[] => {
  const feedTypes: FeedTypes[] = ["Article", "Review", "Book"];
  const foodTypes: FoodTypes[] = ["Recipe", "Cookbook", "FoodPost"];
  
  return category === 'feeds' ? feedTypes : foodTypes;
};

export interface CategoryInfo {
  categoryId: string;
  strValue: string;
  type: string;
}

export interface PublicationType extends CategoryInfo {}
export interface PublicationStyle extends CategoryInfo {}
export interface Author extends CategoryInfo {}

export interface PublicationReview {
  reviewId: string;
  productId?: string;
  rating?: number;
  comment?: string[];
  description?: string[];
  buyAgain?: string;
  dateReview?: Date | null;
}

export interface ContentPrepTime {
  prepTimeId: string;
  duration: number;
  category?: CategoryInfo;
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
  multiplyFactor: number;
}

export interface ContentDetails {
  contentId: string;
  totalPrepTime: number;
  servings?: number;
  prepTimes: ContentPrepTime[];
  segments: SegmentDetails[];
  ingredients: IngredientDetails[];
}

// Frontend mapped type for easier consumption
export interface MappedPublicationData extends PublicationDetails {
  publicationId: string;
  tags: PublicationTags[];
  ingredients: string[];
  preparation: string[];
  prepTime: string;
  averageRating: number | null;
  reviewsCount: number | null;
  selectedContent?: ContentDetails;
  isReview: boolean;
  category: "foods" | "feeds" | "unknown";
}
