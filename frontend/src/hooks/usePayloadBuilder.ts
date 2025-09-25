import type { OrchestratorPayload, PublicationData, ReviewData } from "@/types";

/**
 * Type local pour décrire la structure de contenu
 * manipulée dans le formulaire (côté frontend).
 */
export interface FormContent {
  total_prep_time: number;
  servings: number | null;
  segments: {
    title: string;
    paragraph: string;
    prepTimes: { duration: number; style?: string }[];
  }[];
  ingredients: {
    quantity: number;
    multiply_factor: number;
    product_id: string;
    product_name: string;
    product_en_name: string;
    unit: string;
    isNewProduct: boolean;
    publication_id?: string;
  }[];
  prepTimes: { duration: number; style?: string }[];
}

export function usePayloadBuilder() {
  /**
   * Payload simple, sans relations.
   */
  function buildPublicationPayload(
    action: "create" | "update",
    publicationKey: string,
    data: PublicationData,
  ): OrchestratorPayload {
    return {
      action,
      payload: {
        [publicationKey]: data,
      },
    };
  }

  /**
   * Payload simple pour Review.
   */
  function buildReviewPayload(
    action: "create" | "update",
    reviewKey: string,
    data: ReviewData,
  ): OrchestratorPayload {
    return {
      action,
      payload: {
        [reviewKey]: data,
      },
    };
  }

  /**
   * Payload complet pour Publication avec ses contenus et relations.
   * Transforme FormContent[] (formulaire) vers ContentWithRelations (orchestrator).
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
          contents: contents?.map((c) => ({
            data: {
              total_prep_time: c.total_prep_time ?? 0,
              servings: c.servings ?? null,
            },
            content_segments: c.segments?.map((s, si) => ({
              position: si + 1,
              segment: {
                data: {
                  title: s.title || null,
                  paragraph: s.paragraph || null,
                },
                segment_prep_time: s.prepTimes?.map((p) => ({
                  prep_time: {
                    data: { duration: p.duration },
                    style: p.style
                      ? { data: { str_value: p.style, type: "PrepTimeStyle" } }
                      : undefined,
                  },
                })),
              },
            })),
            content_ingredients: c.ingredients?.map((i) => ({
              data: {
                quantity: i.quantity,
                multiply_factor: i.multiply_factor,
              },
              product: i.isNewProduct
                ? {
                    data: {
                      name: i.product_name,
                      en_name: i.product_en_name || i.product_name,
                      publication: i.publication_id
                        ? { id: i.publication_id, data: {} }
                        : undefined,
                    },
                  }
                : {
                    id: i.product_id,
                    data: { name: i.product_name || "Unknown" },
                  },
              ingredient_units: i.unit
                ? [{ unit: { data: { name: i.unit } } }]
                : [],
            })),

            content_prep_times: c.prepTimes?.map((p) => ({
              prep_time: { data: { duration: p.duration } },
            })),
          })),
        },
      },
    };
  }

  return {
    buildPublicationPayload,
    buildReviewPayload,
    buildComplexPublicationPayload,
  };
}
