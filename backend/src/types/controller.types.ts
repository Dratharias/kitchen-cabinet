import { 
  CategoryData, PublicationData,
  ContentData, ContentSegmentData, ContentIngredientData,
  ContentPrepTimeData, PublicationTagData, SegmentData,
  SegmentPrepTimeData, ProductData, ProductCategoryData,
  MacroData, IngredientData, IngredientUnitData,
  UnitData, PrepTimeData, ReviewData
} from "./db.types.js";

/* ============================================================
   Catégorie
   ============================================================ */
export type Category = CategoryCore & CategoryRelations & { category_id: string };
export type CategoryCore = Required<Pick<CategoryData, "str_value" | "type">>;
export type CategoryRelations = Partial<Omit<CategoryData, "str_value" | "type" | "category_id">>;

/* ============================================================
   Publication
   ============================================================ */
export type Publication = PublicationCore & PublicationRelations & { publication_id: string };
export type PublicationCore = Required<Omit<PublicationData, "publication_id" | "contents" | "ingredientsRef" | "reviews" | "tags">>;
export type PublicationRelations = Required<Pick<PublicationData, "contents" | "ingredientsRef" | "reviews" | "tags" | "type" | "style" | "author">>;

/* ============================================================
   Contenu
   ============================================================ */
export type Content = ContentCore & ContentRelations & { content_id: string };
export type ContentCore = Required<Pick<ContentData, "publication_id" | "total_prep_time" | "servings">>;
export type ContentRelations = Required<Omit<ContentData, "content_id" | "publication_id" | "total_prep_time" | "servings">>;

/* ============================================================
   Segment
   ============================================================ */
export type Segment = SegmentCore & SegmentRelations & { segment_id: string };
export type SegmentCore = Required<Omit<SegmentData, "segment_id" | "content_segments" | "segment_prep_time">>;
export type SegmentRelations = Required<Pick<SegmentData, "content_segments" | "segment_prep_time">>;

/* ============================================================
   Produit
   ============================================================ */
export type Product = ProductCore & ProductRelations & { product_id: string };
export type ProductCore = Required<Omit<ProductData, "ingredients" | "reviews" | "product_categories" | "macro">>;
export type ProductRelations = Required<Pick<ProductData, "ingredients" | "reviews" | "product_categories" | "macro">>;

/* ============================================================
   Macro nutritionnel
   ============================================================ */
export type Macro = Required<Omit<MacroData, "products">> & { products: Product[] | null };

/* ============================================================
   Ingrédient
   ============================================================ */
export type Ingredient = IngredientCore & IngredientRelations & { ingredient_id: string };
export type IngredientCore = Required<Omit<IngredientData, "product" | "isRecipe" | "content_ingredients" | "ingredient_units">>;
export type IngredientRelations = Required<Pick<IngredientData, "product" | "isRecipe" | "content_ingredients" | "ingredient_units">>;

/* ============================================================
   Unité de mesure
   ============================================================ */
export type Unit = Required<Omit<UnitData, "ingredient_units">> & { ingredient_units: IngredientUnit[] | null };

/* ============================================================
   Temps de préparation
   ============================================================ */
export type PrepTime = Required<Omit<PrepTimeData, "style" | "content_prep_times" | "segment_prep_time">> & {
  style: Category | null;
  content_prep_times: ContentPrepTime[] | null;
  segment_prep_time: SegmentPrepTime[] | null;
};

/* ============================================================
   Avis / Review
   ============================================================ */
export type Review = Required<Omit<ReviewData, "product" | "publication">> & {
  product: Product | null;
  publication: Publication | null;
};

/* ============================================================
   Tables de jointure
   ============================================================ */
export type ContentPrepTime = Required<Omit<ContentPrepTimeData, "content" | "prep_time">> & {
  content: Content | null;
  prep_time: PrepTime | null;
};

export type ContentIngredient = Required<Omit<ContentIngredientData, "content" | "ingredient">> & {
  content: Content | null;
  ingredient: Ingredient | null;
};

export type ContentSegment = Required<Omit<ContentSegmentData, "content" | "segment">> & {
  content: Content | null;
  segment: Segment | null;
};

export type SegmentPrepTime = Required<Omit<SegmentPrepTimeData, "segment" | "prep_time">> & {
  segment: Segment | null;
  prep_time: PrepTime | null;
};

export type IngredientUnit = Required<Omit<IngredientUnitData, "ingredient" | "unit">> & {
  ingredient: Ingredient | null;
  unit: Unit | null;
};

export type ProductCategory = Required<Omit<ProductCategoryData, "product" | "category">> & {
  product: Product | null;
  category: Category | null;
};

export type PublicationTag = Required<Omit<PublicationTagData, "publication" | "category">> & {
  publication: Publication | null;
  category: Category | null;
};
