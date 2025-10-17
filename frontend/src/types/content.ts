import { PaginatedResponse } from "./common";
import { Ingredient } from "./ingredient";
import { PrepTime } from "./prepTime";
import { SegmentWithMeta, ServingsPayload } from "./payloadBuilder";
import { GalleryItem } from "./gallery";

export interface Content {
  thumbnail?: string;
  content_id: string;
  publication_id?: string;
  total_prep_time: number;
  servings?: ServingsPayload | null;
  subtitle?: string | null;
  gallery?: GalleryItem[] | null;
  is_ingredient?: boolean | null;

  content_segments?: SegmentWithMeta[];
  content_ingredients?: Ingredient[];
  content_prep_times?: PrepTime[];
}

export type ListContentsResponse = PaginatedResponse<Content>;
export type GetContentResponse = Content;
export type CreateContentRequest = Omit<Content, "content_id">;
export type CreateContentResponse = Content;
export type UpdateContentRequest = Partial<Omit<Content, "content_id">>;
export type UpdateContentResponse = Content;

