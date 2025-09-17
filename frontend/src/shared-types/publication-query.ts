// Payload pour getAll (liste de publications, pagination et filtres légers)
export interface GetAllPublicationsQuery {
  page?: number;         // pagination
  limit?: number;        // items per page
  search?: string;       // recherche par titre ou description
  tags?: string[];       // filtre par tags
  typeIds?: string[];    // filtre par type
  styleIds?: string[];   // filtre par style
  authorIds?: string[];  // filtre par auteur
  publishedOnly?: boolean; // filtrer que les publications publiées
}

// Payload pour getOne (détail d'une publication par id)
export interface GetOnePublicationQuery {
  publicationId: string;
  includeContents?: boolean;   // inclure les contenus imbriqués
  includeIngredients?: boolean; // inclure les ingrédients imbriqués
  includeReviews?: boolean;     // inclure les reviews (par défaut false)
}

// Payload pour getNested (nested table via publicationId ou productId)
export interface GetNestedQuery {
  publicationId?: string;
  productId?: string;
  ingredientId?: string;
  nestedTable: "contents" | "ingredients" | "reviews" | "productCategories" | "prepTimes";
  filters?: Record<string, any>; // filtres spécifiques
}

// Payload pour getWithFilters (plus flexible)
export interface GetFilteredQuery {
  filters: Record<string, any>; // ex: { 'ingredients.productId': 'abc', tags: ['vegan'] }
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
