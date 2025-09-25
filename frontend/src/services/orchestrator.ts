import { OrchestratorPayload, OrchestratorResponse } from "@/types";
import { CommonService } from "./common";

export class OrchestratorService {
  static async publicate(
    payload: OrchestratorPayload,
  ): Promise<OrchestratorResponse> {
    return CommonService.post<OrchestratorResponse>(
      "/api/publicate",
      payload,
      true,
    );
  }

  static createPublicationRequest(
    publicationData: { [key: string]: import("@/types").PublicationData },
    relatedData?: any,
  ): OrchestratorPayload {
    return {
      action: "create",
      payload: {
        ...publicationData,
        ...relatedData,
      },
    };
  }

  static createReviewRequest(reviewData: {
    [key: string]: import("@/types").ReviewData;
  }): OrchestratorPayload {
    return {
      action: "create",
      payload: reviewData,
    };
  }
}
