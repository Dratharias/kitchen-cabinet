// Every table's delete payload is just its id(s)
export type DeletePayloadMap = {
  app_user: { user_id: string };
  category: { category_id: string };
  publication: { publication_id: string };
  publication_tag: { publication_id: string; category_id: string };
  content: { content_id: string };
  segment: { segment_id: string };
  unit: { unit_id: string };
  macro: { macro_id: string };
  product: { product_id: string };
  ingredient: { ingredient_id: string };
  prep_time: { prep_time_id: string };
  content_segment: { content_id: string; segment_id: string };
  content_ingredient: { content_id: string; ingredient_id: string };
  content_prep_time: { content_id: string; prep_time_id: string };
  segment_prep_time: { segment_id: string; prep_time_id: string };
  ingredient_unit: { ingredient_id: string; unit_id: string };
  product_category: { product_id: string; category_id: string };
  review: { review_id: string };
};

export type DeleteTable = keyof DeletePayloadMap;

export interface DeleteRequest<T extends DeleteTable = DeleteTable> {
  table: T;
  payload: DeletePayloadMap[T] | DeletePayloadMap[T][]; // allow batch deletion
}
