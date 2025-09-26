import type { OrchestratorPayload, PublicationData, ReviewData } from "@/types";
import type { Step } from "@/components/content/segment.types";
import { mapStepsToSegments } from "@/utils/stepSegmentMapper";

/**
 * Type local pour décrire la structure de contenu
 * manipulée dans le formulaire (côté frontend).
 */
export interface FormContent {
  total_prep_time: number;
  servings: number | null;
  steps: Step[];
  ingredients: {
    quantity: number;
    multiply_factor: number;
    product_id: string;
    product_name: string;
    product_en_name: string;
    unit: string;
    isNewProduct: boolean;
    publication_id?: string;
    isNewUnit: boolean;
  }[];
  prepTimes: {
    duration: number;
    style?: string;
    isNewStyle?: boolean;
    style_name?: string;
  }[];
}

/**
 * Utilitaire commun pour transformer un ou plusieurs prepTimes
 */
function mapPrepTimes(
  prepTimes?:
    | {
        duration: number;
        style?: string | number;
        isNewStyle?: boolean;
        style_name?: string;
      }
    | {
        duration: number;
        style?: string | number;
        isNewStyle?: boolean;
        style_name?: string;
      }[],
) {
  if (!prepTimes) return undefined;

  const arr = Array.isArray(prepTimes) ? prepTimes : [prepTimes];

  const valid = arr.filter(
    (p) =>
      p.duration > 0 &&
      (p.style || (p.isNewStyle && p.style_name && p.style_name.trim() !== "")),
  );

  if (valid.length === 0) return undefined;

  return valid.map((p) => {
    const base = { data: { duration: p.duration } };

    if (p.isNewStyle && p.style_name) {
      return {
        prep_time: {
          ...base,
          style: { data: { str_value: p.style_name, type: "PrepStyle" } },
        },
      };
    }

    return {
      prep_time: {
        ...base,
        style: { id: String(p.style) },
      },
    };
  });
}


export function usePayloadBuilder() {
  /**
   * Payload Review
   */
  function buildReviewPayload(
    action: "create" | "update",
    reviewKey: string,
    data: ReviewData,
  ): OrchestratorPayload {
    const product = data.product
      ? { id: data.product.id, data: data.product.data }
      : undefined;

    const publication = data.publication
      ? { id: data.publication.id, data: data.publication.data }
      : undefined;

    return {
      action,
      payload: {
        [reviewKey]: {
          rating: data.rating,
          comment: data.comment ?? [],
          description: data.description ?? [],
          buy_again: data.buy_again ?? null,
          product,
          publication,
        },
      },
    };
  }

  /**
   * Payload Publication complet
   */
  function buildComplexPublicationPayload(
    action: "create" | "update",
    publicationKey: string,
    publicationData: PublicationData,
    contents?: FormContent[],
  ): OrchestratorPayload {
    return {
      action,
      payload: {
        [publicationKey]: {
          ...publicationData,
          contents: contents?.map((c) => {
            const mappedSegments = mapStepsToSegments(c.steps || []);

            return {
              data: {
                total_prep_time: c.total_prep_time ?? 0,
                servings: c.servings ?? null,
              },

              // --- Segments ---
              content_segments: mappedSegments.map((s, si) => ({
                position: si + 1,
                segment: {
                  data: {
                    title: s.title ?? undefined,
                    paragraph: s.paragraph ?? "",
                  },
                  segment_prep_time: mapPrepTimes(s.prepTime),
                },
              })),

              // --- Ingrédients ---
              content_ingredients: c.ingredients?.map((i) => {
                const product = i.isNewProduct
                  ? {
                      data: {
                        name: i.product_name,
                        en_name: i.product_en_name || i.product_name,
                        publication: i.publication_id
                          ? { id: i.publication_id }
                          : undefined,
                      },
                    }
                  : { id: i.product_id };

                const units = i.unit
                  ? [
                      i.isNewUnit
                        ? { unit: { data: { name: i.unit } } }
                        : { unit: { id: i.unit } },
                    ]
                  : [];

                return {
                  data: {
                    quantity: i.quantity,
                    multiply_factor: i.multiply_factor,
                  },
                  product,
                  ingredient_units: units,
                };
              }),

              // --- Temps de préparation globaux ---
              content_prep_times: mapPrepTimes(c.prepTimes),
            };
          }),
        },
      },
    };
  }

  return {
    buildReviewPayload,
    buildComplexPublicationPayload,
  };
}
