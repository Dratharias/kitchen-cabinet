import { 
  AppUserData, PublicationData,
  ContentData, SegmentData, ProductData,
  MacroData, IngredientData, UnitData,
  PrepTimeData, ReviewData
} from "./db.types.js";

import { 
  CategoryCore, CategoryRelations,
  Publication,
  Review,
} from "./controller.types.js";

/* ============================================================
   Utilisateur / User
   ============================================================ */
export type UserCreateDto = Required<Pick<AppUserData, "username" | "role" | "password">>;
export type UserUpdateDto = Required<Pick<AppUserData, "username" | "role">>;

/* ============================================================
   Catégorie / Category
   ============================================================ */
type CategoryConnect = {
  publications_type?: { publication_id: string }[];
  publications_style?: { publication_id: string }[];
  publications_author?: { publication_id: string }[];
  prep_time?: { prep_time_id: string }[];
  publication_tags?: { category_id: string; publication_id: string }[];
  product_categories?: { category_id: string; product_id: string }[];
};

export type CategoryCreateDto = Partial<CategoryCore & CategoryRelations> & {
  connect?: CategoryConnect;
};

export type CategoryUpdateDto = Partial<CategoryCore & CategoryRelations> & {
  connect?: CategoryConnect;
  set?: CategoryConnect;
};

/* ============================================================
   Publication / Publication
   ============================================================ */
type PublicationConnect = {
  contents?: { content_id: string }[];
  ingredientsRef?: { ingredient_id: string }[];
  reviews?: { review_id: string }[];
  tags?: { category_id: string }[];
  type?: { category_id: string }[];
  style?: { category_id: string }[];
  author?: { user_id: string }[];
};

export type PublicationCreateDto = Partial<Omit<PublicationData, "publication_id">> & {
  connect?: PublicationConnect;
};

export type PublicationUpdateDto = Partial<Omit<PublicationData, "publication_id">> & {
  connect?: PublicationConnect;
  set?: PublicationConnect;
};

export type PublicationReadDto = Required<Omit<Publication, "reviews">> & {
  averageScore?: number | 0;
  averageCount?: number | 0;
};

export type PublicationReadAllDto = {
  filter?: Partial<PublicationReadDto> & {
    tagIds?: string[];
    contentIds?: string[];
  };
  skip?: number;
  take?: number;
};


/* ============================================================
   Contenu / Content
   ============================================================ */
type ContentConnect = {
  content_segments?: { segment_id: string }[];
  content_ingredients?: { ingredient_id: string }[];
  content_prep_times?: { prep_time_id: string }[];
};

export type ContentCreateDto = Partial<Omit<ContentData, "content_id">> & {
  connect?: ContentConnect;
};

export type ContentUpdateDto = Partial<Omit<ContentData, "content_id">> & {
  connect?: ContentConnect;
  set?: ContentConnect;
};

/* ============================================================
   Segment / Segment
   ============================================================ */
type SegmentConnect = {
  content_segments?: { content_id: string }[];
  segment_prep_time?: { prep_time_id: string }[];
};

export type SegmentCreateDto = Partial<Omit<SegmentData, "segment_id">> & {
  connect?: SegmentConnect;
};

export type SegmentUpdateDto = Partial<Omit<SegmentData, "segment_id">> & {
  connect?: SegmentConnect;
  set?: SegmentConnect;
};

/* ============================================================
   Produit / Product
   ============================================================ */
type ProductConnect = {
  ingredients?: { ingredient_id: string }[];
  reviews?: { review_id: string }[];
  product_categories?: { category_id: string }[];
  macro?: { macro_id: string }[];
};

export type ProductCreateDto = Partial<Omit<ProductData, "product_id">> & {
  connect?: ProductConnect;
};

export type ProductUpdateDto = Partial<Omit<ProductData, "product_id">> & {
  connect?: ProductConnect;
  set?: ProductConnect;
};

/* ============================================================
   Macro / Macro
   ============================================================ */
export type MacroCreateDto = Partial<Omit<MacroData, "products">> & {
  connect?: { products?: { product_id: string }[] };
};

export type MacroUpdateDto = Partial<Omit<MacroData, "products">> & {
  connect?: { products?: { product_id: string }[] };
  set?: { products?: { product_id: string }[] };
};

/* ============================================================
   Ingrédient / Ingredient
   ============================================================ */
type IngredientConnect = {
  product?: { product_id: string }[];
  content_ingredients?: { content_id: string }[];
  ingredient_units?: { unit_id: string }[];
};

export type IngredientCreateDto = Partial<Omit<IngredientData, "ingredient_id">> & {
  connect?: IngredientConnect;
};

export type IngredientUpdateDto = Partial<Omit<IngredientData, "ingredient_id">> & {
  connect?: IngredientConnect;
  set?: IngredientConnect;
};

/* ============================================================
   Unité de mesure / Unit
   ============================================================ */
type UnitConnect = {
  ingredient_units?: { ingredient_id: string }[];
};

export type UnitCreateDto = Partial<Omit<UnitData, "ingredient_units">> & { connect?: UnitConnect };
export type UnitUpdateDto = Partial<Omit<UnitData, "ingredient_units">> & { connect?: UnitConnect; set?: UnitConnect };

/* ============================================================
   Temps de préparation / PrepTime
   ============================================================ */
type PrepTimeConnect = {
  style?: { category_id: string }[];
  content_prep_times?: { content_id: string }[];
  segment_prep_time?: { segment_id: string }[];
};

export type PrepTimeCreateDto = Partial<Omit<PrepTimeData, "style" | "content_prep_times" | "segment_prep_time">> & { connect?: PrepTimeConnect };
export type PrepTimeUpdateDto = Partial<Omit<PrepTimeData, "style" | "content_prep_times" | "segment_prep_time">> & { connect?: PrepTimeConnect; set?: PrepTimeConnect };

/* ============================================================
   Avis / Review
   ============================================================ */
type ReviewConnect = {
  product?: { product_id: string }[];
  publication?: { publication_id: string }[];
};

export type ReviewCreateDto = Partial<Omit<ReviewData, "review_id">> & { connect?: ReviewConnect };
export type ReviewUpdateDto = Partial<Omit<ReviewData, "review_id">> & { connect?: ReviewConnect; set?: ReviewConnect };
export type ReviewReadAllDto = {
  filter?: Partial<Omit<Review, "product" | "publication">> & {
    publicationId?: string;
    productId?: string;
  };
  skip?: number;
  take?: number;
};
