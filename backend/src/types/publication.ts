export interface PublicationType {
  categoryId: string;  // ID from Prisma
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
  comment: string[];
  description: string[];
  buyAgain?: string;
  dateReview: Date | null;
}

export interface PrepTimeCategory {
  prepTimeId: string;
  categoryId: string;
}

export interface ContentPrepTime {
  prepTimeId: string;
  duration: number;
  category?: { categoryId: string; strValue: string; type: string };
}

export interface SegmentDetails {
  segmentId: string;
  title?: string;
  paragraph: string;
  order: number;
  prepTimes: ContentPrepTime[];
}

export interface ContentDetails {
  contentId: string;
  totalPrepTime?: number;
  servings?: number;
  prepTimes: ContentPrepTime[];
  segments: SegmentDetails[];
  ingredients: any[]; // can be expanded later
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
  style?: PublicationStyle;
  author?: Author;

  reviews: PublicationReview[];
  contents: ContentDetails[];
}
