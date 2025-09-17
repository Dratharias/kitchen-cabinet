import { Category } from "./category";
import { PaginatedRequest, PaginatedResponse, UUID } from "./common";
import { Content } from "./content";
import { Ingredient } from "./ingredient";

export interface PublicationPayload {
  title: string;
  description?: string[];
  note?: string[];
  public?: boolean;
  published?: boolean;
  thumbnail?: string;
  type_id?: UUID | null;
  style_id?: UUID | null;
  author_id?: UUID | null;
  connect?: {
    type?: Category[];
    style?: Category[];
    author?: Category[];
    tags?: Category[];
    contents?: Content[];
  };
  set?: {
    contents?: { content_id: UUID }[];
  };
}
export interface Publication extends PublicationPayload {
  publication_id: UUID;
  averageCount: number;
  averageScore: number;
  type?: Category;
  style?: Category;
  author?: Category;
  contents?: Content[];
  ingredientsRef?: Ingredient[];
  tags?: Category[];
}

export type ListPublicationsRequest = PaginatedRequest & {
  tagIds?: UUID[];
  contentIds?: UUID[];
};
export type ListPublicationsResponse = PaginatedResponse<Publication>;

export type GetPublicationResponse = Publication;
export type CreatePublicationRequest = PublicationPayload;
export type CreatePublicationResponse = Publication;
export type UpdatePublicationRequest = Partial<PublicationPayload>;
export type UpdatePublicationResponse = Publication;
export type DeletePublicationResponse = { success: boolean };