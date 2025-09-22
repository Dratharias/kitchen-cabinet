import type {
  OrchestratorRequest,
  PublicationCreate,
  ReviewCreate,
  ContentCreate,
  SegmentCreate,
  IngredientCreate,
  ProductCreate,
  CategoryCreate,
  UnitCreate,
  PrepTimeCreate,
  MacroCreate,
} from "@/types/orchestrator";

// Utilitaire générique pour builder les entités
function mapEntities<T>(
  items: (T & { id?: string })[] | undefined,
  action: "create" | "update"
) {
  return items?.map((item) => {
    const { id, ...rest } = item as any;
    return action === "update" ? { id, data: rest } : { data: rest };
  });
}

export function usePayloadBuilder() {
  function buildPublicationPayload(
    action: "create" | "update",
    data: {
      publication: PublicationCreate & { id?: string };
      contents?: (ContentCreate & { id?: string })[];
      segments?: (SegmentCreate & { id?: string })[];
      ingredients?: (IngredientCreate & { id?: string })[];
      products?: (ProductCreate & { id?: string })[];
      categories?: (CategoryCreate & { id?: string })[];
      units?: (UnitCreate & { id?: string })[];
      prepTimes?: (PrepTimeCreate & { id?: string })[];
      macros?: (MacroCreate & { id?: string })[];
    }
  ): OrchestratorRequest {
    const { publication, ...rest } = data;
    const { id, ...pubData } = publication as any;

    return {
      action,
      publications:
        action === "update" ? { id, data: pubData } : { data: pubData },
      contents: mapEntities(rest.contents, action),
      segments: mapEntities(rest.segments, action),
      ingredients: mapEntities(rest.ingredients, action),
      products: mapEntities(rest.products, action),
      categories: mapEntities(rest.categories, action),
      units: mapEntities(rest.units, action),
      prepTimes: mapEntities(rest.prepTimes, action),
      macros: mapEntities(rest.macros, action),
    };
  }

  function buildReviewPayload(
    action: "create" | "update",
    review: ReviewCreate & { id?: string },
    target: { product_id?: string; publication_id?: string }
  ): OrchestratorRequest {
    if (!target.product_id && !target.publication_id) {
      throw new Error("Review must reference either product_id or publication_id");
    }

    const { id, ...reviewData } = review as any;

    return {
      action,
      reviews: action === "update" ? { id, data: { ...reviewData, ...target } } : { data: { ...reviewData, ...target } },
    };
  }

  return { buildPublicationPayload, buildReviewPayload };
}
