import { Category } from "./category";
import { PaginatedRequest, PaginatedResponse } from "./common";
import { Content } from "./content";
import { Product } from "./product";

export interface PublicationPayload {
  title: string;
  description?: string[];
  note?: string[];
  public?: boolean;
  published?: boolean;
  thumbnail?: string;
  type_id?: string | null;
  style_id?: string | null;
  author_id?: string | null;
  contents?: Content[]; // Changed to optional
  connect?: {
    type?: Category[];
    style?: Category[];
    author?: Category[];
    tags?: Category[];
    contents?: Content[];
  };
  set?: {
    contents?: { content_id: string }[];
  };
}
export interface Publication extends PublicationPayload {
  publication_id: string;
  reviewCount: number;
  averageRating: number;
  type?: Category;
  style?: Category;
  author?: Category;
  contents?: Content[];
  productsRef?: Product[];
  tags?: Category[];
}

export type ListPublicationsRequest = PaginatedRequest & {
  tagIds?: string[];
  contentIds?: string[];
};
export type ListPublicationsResponse = PaginatedResponse<Publication>;

export type GetPublicationResponse = Publication;
export type CreatePublicationRequest = PublicationPayload;
export type CreatePublicationResponse = Publication;
export type UpdatePublicationRequest = Partial<PublicationPayload>;
export type UpdatePublicationResponse = Publication;
export type DeletePublicationResponse = { success: boolean };