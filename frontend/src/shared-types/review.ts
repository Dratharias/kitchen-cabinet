import type { DeepProduct, Category, PublicationTag } from "./publication";

// On définit une version "light" de la publication pour éviter la récursion infinie
export interface PublicationForReview {
  publication_id: string;
  title: string;
  description: string[];
  note: string[];
  public: boolean;
  published: boolean;
  thumbnail?: string;

  type?: Category;
  style?: Category;
  author?: Category;
  tags?: PublicationTag[];
}

export interface DeepReview {
  review_id: string;
  rating?: number;
  comment: string[];
  description: string[];
  buy_again?: string;
  date_review: string;

  // Relations
  product?: DeepProduct;
  publication?: PublicationForReview;
}
