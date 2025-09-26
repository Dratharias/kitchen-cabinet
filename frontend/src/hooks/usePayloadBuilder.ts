import type { OrchestratorPayload, PublicationData, ReviewData } from "@/types";
import type { Step } from "@/components/content/Segment.types";
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
  prepTimes: { duration: number; style?: string }[];
}

export function usePayloadBuilder() {
  /**
   * Payload Review (exploite OrchestratorEntity).
   */
  function buildReviewPayload(
    action: "create" | "update",
    reviewKey: string,
    data: ReviewData,
  ): OrchestratorPayload {
    const product = data.product
      ? {
          id: data.product.id,
          data: data.product.data,
        }
      : undefined;

    const publication = data.publication
      ? {
          id: data.publication.id,
          data: data.publication.data,
        }
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
   * Payload Publication complet (avec contenus, segments, ingrédients, etc.).
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
                  segment_prep_time: s.prepTimes?.map((p) => ({
                    prep_time: {
                      data: { duration: p.duration },
                      style: p.style
                        ? {
                            data: { str_value: p.style, type: "PrepTimeStyle" },
                          }
                        : undefined,
                    },
                  })),
                },
              })),

              // --- Ingrédients ---
              content_ingredients: c.ingredients?.map((i) => {
                // Produit : publication est sortie de data
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
              content_prep_times: c.prepTimes?.map((p) => ({
                prep_time: { data: { duration: p.duration } },
              })),
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
