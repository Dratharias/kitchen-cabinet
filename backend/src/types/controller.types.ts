import {
  CategoryData,
  PublicationData,
  ContentData,
  ContentSegmentData,
  ContentIngredientData,
  ContentPrepTimeData,
  PublicationTagData,
  SegmentData,
  SegmentPrepTimeData,
  ProductData,
  ProductCategoryData,
  MacroData,
  IngredientData,
  IngredientUnitData,
  UnitData,
  PrepTimeData,
  ReviewData,
  AppUserData,
  ContentGalleryData,
  GalleryData,
  ServingsData,
} from "./db.types.js";

/* ============================================================
   User/Read
   ============================================================ */
export type User = Required<Pick<AppUserData, "username" | "role" | "updated">>;

/* ============================================================
   Catégorie
   ============================================================ */
export type Category = CategoryCore &
  CategoryRelations & { category_id: string };
export type CategoryCore = Required<
  Pick<CategoryData, "str_value" | "type">
> & { category_id?: string };
export type CategoryRelations = Partial<
  Omit<CategoryData, "str_value" | "type" | "category_id">
>;

/* ============================================================
   Portions (Servings)
   ============================================================ */
export type Servings = ServingsCore &
  ServingsRelations & { serving_id: string };
export type ServingsCore = Required<
  Omit<ServingsData, "serving_id" | "content">
> & { serving_id?: string };
export type ServingsRelations = {
  content: Content[] | null;
};

/* ============================================================
   Galerie
   ============================================================ */
export type Gallery = GalleryCore & GalleryRelations & { gallery_id: string };
export type GalleryCore = Required<
  Omit<GalleryData, "gallery_id" | "content_gallery" | "publication_gallery">
> & { gallery_id?: string };
export type GalleryRelations = {
  content_gallery: ContentGallery[] | null;
};

/* ============================================================
   Tables de jointure
   ============================================================ */
export type ContentGallery = Required<
  Omit<ContentGalleryData, "content" | "gallery">
> & {
  content: Content | null;
  gallery: Gallery | null;
};

/* ============================================================
   Publication
   ============================================================ */
export type Publication = PublicationCore &
  PublicationRelations & {
    publication_id: string;
    reviewCount: number;
    reviewAverageScore: number;
  };
export type PublicPublication = PublicPublicationCore &
  PublicationRelations & {
    publication_id: string;
    reviewCount: number;
    reviewAverageScore: number;
  };
export type PublicationCore = Required<
  Omit<
    PublicationData,
    | "publication_id"
    | "contents"
    | "productsRef"
    | "reviews"
    | "tags"
    | "style_id"
    | "type_id"
    | "author_id"
  >
> & { publication_id?: string };
export type PublicPublicationCore = Required<
  Omit<
    PublicationData,
    | "publication_id"
    | "contents"
    | "productsRef"
    | "reviews"
    | "tags"
    | "style_id"
    | "type_id"
    | "author_id"
    | "published"
    | "public"
  >
> & { publication_id?: string };
export type PublicationRelations = Required<
  Pick<
    PublicationData,
    "contents" | "productsRef" | "tags" | "type" | "style" | "author"
  >
>;

/* ============================================================
   Contenu
   ============================================================ */
export type Content = ContentCore & ContentRelations & { content_id: string };
export type ContentCore = Required<
  Pick<
    ContentData,
    | "publication_id"
    | "total_prep_time"
    | "serving_id"
    | "subtitle"
    | "is_ingredient"
    | "gallery"
  >
> & { content_id?: string };
export type ContentRelations = Required<
  Omit<
    ContentData,
    | "content_id"
    | "publication_id"
    | "total_prep_time"
    | "serving_id"
    | "subtitle"
    | "is_ingredient"
    | "gallery"
  > & {
    servings: Servings | null;
  }
>;

/* ============================================================
   Segment
   ============================================================ */
export type Segment = SegmentCore & SegmentRelations & { segment_id: string };
export type SegmentCore = Required<
  Omit<SegmentData, "segment_id" | "content_segments" | "segment_prep_time">
> & { segment_id?: string };
export type SegmentRelations = Required<
  Pick<SegmentData, "content_segments" | "segment_prep_time">
>;

/* ============================================================
   Produit
   ============================================================ */
export type Product = ProductCore & ProductRelations & { product_id: string };
export type ProductCore = Required<
  Omit<
    ProductData,
    | "product_id"
    | "isRecipe"
    | "macro"
    | "ingredients"
    | "reviews"
    | "product_categories"
  >
> & { product_id?: string };
export type ProductRelations = Required<
  Pick<
    ProductData,
    "ingredients" | "reviews" | "product_categories" | "macro" | "isRecipe"
  >
>;

/* ============================================================
   Macro nutritionnel
   ============================================================ */
export type Macro = MacroCore & MacroRelations & { macro_id: string };
export type MacroCore = Required<Omit<MacroData, "macro_id" | "products">> & {
  macro_id?: string;
};
export type MacroRelations = { products: Product[] | null };

/* ============================================================
   Ingrédient
   ============================================================ */
export type Ingredient = IngredientCore &
  IngredientRelations & { ingredient_id: string };
export type IngredientCore = Required<
  Omit<
    IngredientData,
    "ingredient_id" | "product" | "content_ingredients" | "ingredient_units"
  >
> & { ingredient_id?: string };
export type IngredientRelations = Required<
  Pick<IngredientData, "product" | "content_ingredients" | "ingredient_units">
>;

/* ============================================================
   Unité de mesure
   ============================================================ */
export type Unit = UnitCore & UnitRelations & { unit_id: string };
export type UnitCore = Required<
  Omit<UnitData, "unit_id" | "ingredient_units">
> & { unit_id?: string };
export type UnitRelations = { ingredient_units: IngredientUnit[] | null };

/* ============================================================
   Temps de préparation
   ============================================================ */
export type PrepTime = PrepTimeCore &
  PrepTimeRelations & { prep_time_id: string };
export type PrepTimeCore = Required<
  Omit<
    PrepTimeData,
    "prep_time_id" | "style" | "content_prep_times" | "segment_prep_time"
  >
> & { prep_time_id?: string };
export type PrepTimeRelations = {
  style: Category | null;
  content_prep_times: ContentPrepTime[] | null;
  segment_prep_time: SegmentPrepTime[] | null;
};

/* ============================================================
   Avis / Review
   ============================================================ */
export type Review = ReviewCore & ReviewRelations & { review_id: string };
export type ReviewCore = Required<
  Omit<ReviewData, "review_id" | "product" | "publication">
> & { review_id?: string };
export type ReviewRelations = {
  product: Product | null;
  publication: Publication | null;
};

/* ============================================================
   Tables de jointure
   ============================================================ */
export type ContentPrepTime = Required<
  Omit<ContentPrepTimeData, "content" | "prep_time">
> & {
  content: Content | null;
  prep_time: PrepTime | null;
};

export type ContentIngredient = Required<
  Omit<ContentIngredientData, "content" | "ingredient">
> & {
  content: Content | null;
  ingredient: Ingredient | null;
};

export type ContentSegment = Required<
  Omit<ContentSegmentData, "content" | "segment">
> & {
  content: Content | null;
  segment: Segment | null;
};

export type SegmentPrepTime = Required<
  Omit<SegmentPrepTimeData, "segment" | "prep_time">
> & {
  segment: Segment | null;
  prep_time: PrepTime | null;
};

export type IngredientUnit = Required<
  Omit<IngredientUnitData, "ingredient" | "unit">
> & {
  ingredient: Ingredient | null;
  unit: Unit | null;
};

export type ProductCategory = Required<
  Omit<ProductCategoryData, "product" | "category">
> & {
  product: Product | null;
  category: Category | null;
};

export type PublicationTag = Required<
  Omit<PublicationTagData, "publication" | "category">
> & {
  publication: Publication | null;
  category: Category | null;
};
