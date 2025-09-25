import type {
  OrchestratorPayload,
  PublicationData,
  ReviewData,
  ContentWithRelations,
} from "@/types";

export function usePayloadBuilder() {
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

  function buildComplexPublicationPayload(
    action: "create" | "update",
    publicationKey: string,
    publicationData: PublicationData,
    contents?: ContentWithRelations[],
  ): OrchestratorPayload {
    return {
      action,
      payload: {
        [publicationKey]: {
          ...publicationData,
          contents,
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
