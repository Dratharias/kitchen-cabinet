import {
  OrchestratorPayload,
  OrchestratorResponse,
} from "@/types/payloadBuilder";
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
}
