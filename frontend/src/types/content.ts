import { PaginatedResponse, UUID } from "./common";
import { Ingredient } from "./ingredient";
import { PrepTime } from "./prepTime";
import { Segment } from "./segment";

export interface ContentPayload {
  publication_id?: UUID;
  total_prep_time: number;
  servings?: number;
  connect?: {
    content_segments?: Segment[];
    content_ingredients?: Ingredient[];
    content_prep_times?: PrepTime[];
  };
}
export interface Content extends ContentPayload {
  content_id: UUID;
}

export type ListContentsResponse = PaginatedResponse<Content>;
export type GetContentResponse = Content;
export type CreateContentRequest = ContentPayload;
export type CreateContentResponse = Content;
export type UpdateContentRequest = Partial<ContentPayload>;
export type UpdateContentResponse = Content;
export type DeleteContentResponse = { success: boolean };
