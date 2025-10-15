export type Action = "create" | "update" | "delete";

export interface OrchestratorPayload {
  action: Action;
  payload: Record<string, Record<string, any> | null>;
}

export interface OrchestratorResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export interface CategoryPayload {
  str_value: string;
  type: string;
}

export interface ServingsPayload {
  yield: number;
  value: string;
}

export interface MacroPayload {
  calories?: number;
  protein?: number;
  carbs?: number;
  saturated?: number;
  trans?: number;
  caffein?: number;
  fiber?: number;
  alcohol?: number;
}

export interface PrepTimePayload {
  prep_time_id?: string;
  duration: number;
  style?: CategoryPayload;
}

export interface ProductPayload {
  product_id?: string;
  name: string;
  is_recipe?: boolean;
  macro?: MacroPayload | null;
}

export interface UnitPayload {
  unit_id?: string;
  name: string;
}

export interface IngredientPayload {
  ingredient_id?: string;
  quantity: number;
  multiply_factor: number;
  cut?: string;
  title?: string;
  product: ProductPayload;
  ingredient_units: { unit: UnitPayload }[];
}

export interface SegmentPayload {
  segment_id?: string;
  title: string;
  paragraph: string;
}

export interface SegmentWithMeta {
  position: number;
  segment: SegmentPayload;
  segment_prep_time: { prep_time: PrepTimePayload }[];
}

export interface ContentPayload {
  content_id?: string;
  total_prep_time: number;
  servings: ServingsPayload | null;
  gallery?: string[] | null;
  subtitle?: string;
  is_ingredient?: boolean;
  publication?: string;
  content_segments: SegmentWithMeta[];
  content_ingredients: IngredientPayload[];
  content_prep_times: PrepTimePayload[];
}

export interface PublicationPayload {
  publication_id?: string;
  title: string;
  description: string[];
  note: string[];
  public: boolean;
  published: boolean;
  thumbnail?: string;
  gallery?: string[];
  type?: CategoryPayload;
  style?: CategoryPayload;
  author?: CategoryPayload;
  tags?: CategoryPayload[];
  contents: ContentPayload[];
}
