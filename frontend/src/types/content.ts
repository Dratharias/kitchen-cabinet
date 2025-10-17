import { PaginatedResponse } from "./common";
import { Ingredient } from "./ingredient";
import { PrepTime } from "./prepTime";
import { Segment } from "./segment";

export interface Content {
  thumbnail?: string;
  content_id: string;
  publication_id?: string;
  total_prep_time: number;
  servings?: number | null;
  subtitle?: string | null;
  gallery?: string[] | null;
  is_ingredient?: boolean | null;

  content_segments?: Segment[];
  content_ingredients?: Ingredient[];
  content_prep_times?: PrepTime[];
}

export type ListContentsResponse = PaginatedResponse<Content>;
export type GetContentResponse = Content;
export type CreateContentRequest = Omit<Content, "content_id">;
export type CreateContentResponse = Content;
export type UpdateContentRequest = Partial<Omit<Content, "content_id">>;
export type UpdateContentResponse = Content;
