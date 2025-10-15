import { AppUserData } from "./db.types.js";

import {
  CategoryCore,
  CategoryRelations,
  PublicationCore,
  PublicationRelations,
  ContentCore,
  ContentRelations,
  SegmentCore,
  SegmentRelations,
  ProductCore,
  ProductRelations,
  MacroCore,
  MacroRelations,
  IngredientCore,
  IngredientRelations,
  UnitCore,
  UnitRelations,
  PrepTimeCore,
  PrepTimeRelations,
  ReviewCore,
  ReviewRelations,
  Publication,
  Review,
  GalleryCore,
  GalleryRelations,
  ServingsCore,
  ServingsRelations,
} from "./controller.types.js";

/* ============================================================
   Utilisateur / User
   ============================================================ */
export type UserCreateDto = Required<
  Pick<AppUserData, "username" | "role" | "password">
>;
export type UserUpdateDto = Required<Pick<AppUserData, "username" | "role">>;

/* ============================================================
   Catégorie / Category
   ============================================================ */
export type CategoryConnect = {
  publications_type?: { publication_id: string }[];
  publications_style?: { publication_id: string }[];
  publications_author?: { publication_id: string }[];
  prep_time?: { prep_time_id: string }[];
  publication_tags?: { category_id: string; publication_id: string }[];
  product_categories?: { category_id: string; product_id: string }[];
};

export type CategoryCreateDto = CategoryCore &
  Partial<CategoryRelations> & {
    connect?: CategoryConnect;
  };

export type CategoryUpdateDto = Partial<CategoryCore & CategoryRelations> & {
  connect?: CategoryConnect;
  set?: CategoryConnect;
};

/* ============================================================
   Publication / Publication
   ============================================================ */
export type PublicationConnect = {
  contents?: { content_id: string }[];
  productsRef?: { product_id: string }[];
  reviews?: { review_id: string }[];
  tags?: { category_id: string }[];
  type?: { category_id: string }[];
  style?: { category_id: string }[];
  author?: { category_id: string }[]; 
};

export type PublicationCreateDto = PublicationCore &
  Partial<PublicationRelations> & {
    connect?: PublicationConnect;
  };

export type PublicationUpdateDto = Partial<
  PublicationCore & PublicationRelations
> & {
  connect?: PublicationConnect;
  set?: PublicationConnect;
};

export type PublicationReadDto = Required<Omit<Publication, "reviews">> & {
  averageRating?: number | 0;
  reviewCount?: number | 0;
};

export type PublicationReadAllDto = {
  filter?: Partial<PublicationReadDto> & {
    tagIds?: string[];
    contentIds?: string[];
    q?: string;
  };
  skip?: number;
  take?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: string;
};

/* ============================================================
   Contenu / Content
   ============================================================ */
export type ContentConnect = {
  content_segments?: { segment_id: string }[];
  content_ingredients?: { ingredient_id: string }[];
  content_prep_times?: { prep_time_id: string }[];
  servings?: { serving_id: string }[]; 
};

export type ContentCreateDto = ContentCore &
  Partial<ContentRelations> & {
    connect?: ContentConnect;
  };

export type ContentUpdateDto = Partial<ContentCore & ContentRelations> & {
  connect?: ContentConnect;
  set?: ContentConnect;
};

/* ============================================================
   Segment / Segment
   ============================================================ */
export type SegmentConnect = {
  content_segments?: { content_id: string }[];
  segment_prep_time?: { prep_time_id: string }[];
};

export type SegmentCreateDto = SegmentCore &
  Partial<SegmentRelations> & {
    connect?: SegmentConnect;
  };

export type SegmentUpdateDto = Partial<SegmentCore & SegmentRelations> & {
  connect?: SegmentConnect;
  set?: SegmentConnect;
};

/* ============================================================
   Produit / Product
   ============================================================ */
export type ProductConnect = {
  isRecipe?: { publication_id: string };
  macro?: { macro_id: string };
  ingredients?: { ingredient_id: string }[];
  reviews?: { review_id: string }[];
  product_categories?: { category_id: string }[];
};

export type ProductSet = {
  macro?: { macro_id: string };
  ingredients?: { ingredient_id: string }[];
  reviews?: { review_id: string }[];
  product_categories?: { category_id: string }[];
};

export type ProductUpdateDto = Partial<ProductCore & ProductRelations> & {
  connect?: ProductConnect;
  set?: ProductSet;
};

export type ProductCreateDto = ProductCore &
  Partial<ProductRelations> & {
    connect?: ProductConnect;
  };

/* ============================================================
   Macro / Macro
   ============================================================ */
export type MacroConnect = { products?: { product_id: string }[] }; // <-- Ajouté ici

export type MacroCreateDto = MacroCore &
  Partial<MacroRelations> & {
    connect?: MacroConnect; // <-- Utilise la nouvelle définition
  };

export type MacroUpdateDto = Partial<MacroCore & MacroRelations> & {
  connect?: MacroConnect; // <-- Utilise la nouvelle définition
  set?: MacroConnect;     // <-- Utilise la nouvelle définition
};

/* ============================================================
   Ingrédient / Ingredient
   ============================================================ */
export type IngredientConnect = {
  product?: { product_id: string }[];
  content_ingredients?: { content_id: string }[];
  ingredient_units?: { unit_id: string, name: string }[];
};

export type IngredientCreateDto = IngredientCore &
  Partial<IngredientRelations> & {
    connect?: IngredientConnect;
  };

export type IngredientUpdateDto = Partial<
  IngredientCore & IngredientRelations
> & {
  connect?: IngredientConnect;
  set?: IngredientConnect;
};

/* ============================================================
   Unité de mesure / Unit
   ============================================================ */
export type UnitConnect = {
  ingredient_units?: { ingredient_id: string }[];
};

export type UnitCreateDto = UnitCore &
  Partial<UnitRelations> & { connect?: UnitConnect };
export type UnitUpdateDto = Partial<UnitCore & UnitRelations> & {
  connect?: UnitConnect;
  set?: UnitConnect;
};

/* ============================================================
   Temps de préparation / PrepTime
   ============================================================ */
export type PrepTimeConnect = {
  style?: { category_id: string }[];
  content_prep_times?: { content_id: string }[];
  segment_prep_time?: { segment_id: string }[];
};

export type PrepTimeCreateDto = PrepTimeCore &
  Partial<PrepTimeRelations> & { connect?: PrepTimeConnect };
export type PrepTimeUpdateDto = Partial<PrepTimeCore & PrepTimeRelations> & {
  connect?: PrepTimeConnect;
  set?: PrepTimeConnect;
};

/* ============================================================
   Portions / Servings
   ============================================================ */
export type ServingsConnect = {
  content?: { content_id: string }[];
};

export type ServingsCreateDto = ServingsCore &
  Partial<ServingsRelations> & {
    connect?: ServingsConnect;
  };

export type ServingsUpdateDto = Partial<ServingsCore & ServingsRelations> & {
  connect?: ServingsConnect;
  set?: ServingsConnect;
};

/* ============================================================
   Galerie / Gallery
   ============================================================ */
export type GalleryConnect = {
  content_gallery?: { content_id: string }[];
  publication_gallery?: { publication_id: string }[];
};

export type GalleryCreateDto = GalleryCore &
  Partial<GalleryRelations> & {
    connect?: GalleryConnect;
  };

export type GalleryUpdateDto = Partial<GalleryCore & GalleryRelations> & {
  connect?: GalleryConnect;
  set?: GalleryConnect;
};


/* ============================================================
   Avis / Review
   ============================================================ */
export type ReviewConnect = {
  product?: { product_id: string }[];
  publication?: { publication_id: string }[];
};

export type ReviewCreateDto = ReviewCore &
  Partial<ReviewRelations> & { connect?: ReviewConnect };
export type ReviewUpdateDto = Partial<ReviewCore & ReviewRelations> & {
  connect?: ReviewConnect;
  set?: ReviewConnect;
};
export type ReviewReadAllDto = {
  filter?: Partial<Omit<Review, "product" | "publication">> & {
    publicationId?: string;
    productId?: string;
  };
  skip?: number;
  take?: number;
};
