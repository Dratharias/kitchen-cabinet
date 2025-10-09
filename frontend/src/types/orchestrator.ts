import {
  Category,
  Content,
  Ingredient,
  Macro,
  PrepTime,
  Product,
  Publication,
  Review,
  Segment,
  Unit,
  User,
} from ".";

export interface OrchestratorEntity<T> {
  id?: string;
  data?: T;
}

export interface CategoryData {
  str_value: string;
  type: string;
}

export interface UnitData {
  name: string;
}

export interface PrepTimeData {
  duration: number;
}

export interface ProductData {
  name: string;
  en_name?: string;
  publication?: OrchestratorEntity<{}>;
}

export interface SegmentData {
  paragraph: string;
  title?: string;
}

export interface IngredientData {
  quantity: number;
  multiply_factor: number;
}

export interface ContentData {
  total_prep_time: number;
  servings: number | null;
  is_ingredient?: boolean | null;
  subtitle?: string | null;
}

export interface PublicationData {
  title: string;
  description?: string[];
  note?: string[];
  public: boolean;
  published: boolean;
  thumbnail?: string;
  gallery?: string[];
  type?: OrchestratorEntity<CategoryData>;
  style?: OrchestratorEntity<CategoryData>;
  author?: OrchestratorEntity<CategoryData>;
  tags?: OrchestratorEntity<CategoryData>[];
  contents?: Content[];
}

export interface ReviewData {
  rating: number | null;
  comment: string[];
  description: string[];
  buy_again: "Y" | "N" | "M" | "D" | null;
  product?: OrchestratorEntity<Product>;
  publication?: OrchestratorEntity<Publication>;
}

export interface ContentWithRelations extends Content {
  is_ingredient?: boolean | null;
  subtitle?: string | null;
  content_segments?: Segment[];
  content_ingredients?: Ingredient[];
  content_prep_times?: PrepTime[];
}

export interface SegmentWithRelations {
  data: SegmentData;
  segment_prep_time?: {
    prep_time: PrepTimeWithStyle;
  }[];
}

export interface PrepTimeWithStyle {
  data: PrepTimeData;
  style?: OrchestratorEntity<CategoryData>;
}

export interface IngredientWithRelations {
  data: IngredientData;
  product: OrchestratorEntity<ProductData>;
  ingredient_units?: {
    unit: OrchestratorEntity<UnitData>;
  }[];
}

export interface OrchestratorPayload {
  action: "create" | "update";
  payload: {
    [key: string]: PublicationData | ReviewData;
  };
}

export interface OrchestratorResponse {
  success: boolean;
  results?: {
    publications?: Publication[];
    contents?: Content[];
    segments?: Segment[];
    ingredients?: Ingredient[];
    products?: Product[];
    categories?: Category[];
    units?: Unit[];
    prepTimes?: PrepTime[];
    reviews?: Review[];
    macros?: Macro[];
    users?: User[];
  };
  error?: string;
}
