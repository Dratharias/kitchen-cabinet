import type {
  DeepPublication,
  DeepContent,
  DeepIngredient,
  DeepProduct,
  DeepReview,
  Macro,
} from "./publication";

// Makes all properties optional recursively
export type PartialDeep<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? PartialDeep<U>[]
    : T[P] extends object
    ? PartialDeep<T[P]>
    : T[P];
};

// Optional ID helper for nested objects
export type WithOptionalId<T> = T extends { [key: string]: any }
  ? { id?: string } & PartialDeep<T>
  : T;

export interface UpsertPayloadMap {
  app_user: { user_id?: string; username?: string; password?: string; role?: string };
  category: { category_id?: string; str_value?: string; type?: string; num_value?: number };
  publication: WithOptionalId<DeepPublication>;
  publication_tag: { publication_id: string; category_id: string };
  content: WithOptionalId<DeepContent>;
  segment: { segment_id?: string; title?: string; paragraph?: string; order_num?: number };
  unit: { unit_id?: string; name?: string };
  macro: WithOptionalId<Macro>;
  product: WithOptionalId<DeepProduct>;
  ingredient: WithOptionalId<DeepIngredient>;
  prep_time: { prep_time_id?: string; duration?: number; style_id?: string };
  content_segment: { content_id: string; segment_id: string; position?: number };
  content_ingredient: { content_id: string; ingredient_id: string };
  content_prep_time: { content_id: string; prep_time_id: string };
  segment_prep_time: { segment_id: string; prep_time_id: string };
  ingredient_unit: { ingredient_id: string; unit_id: string };
  product_category: { product_id: string; category_id: string };
  review: WithOptionalId<DeepReview>;
}

export type UpsertTable = keyof UpsertPayloadMap;

export interface UpsertRequest<T extends UpsertTable = UpsertTable> {
  table: T;
  id?: string; // if present → update, otherwise create
  payload: UpsertPayloadMap[T];
}