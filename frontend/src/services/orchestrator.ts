import { OrchestratorPayload, OrchestratorResponse } from "@/types";
import { CommonService } from "./common";

/**
 * Service centralisé pour orchestrer les opérations
 * (create, update, delete) sur publications avec leurs contenus,
 * ingrédients, segments, etc.
 *
 * Tous les appels transitent par l'API `/api/publicate`
 * pour être traités par l'orchestrateur backend.
 */
export class OrchestratorService {
  /** Création, mise à jour ou suppression d'une publication */
  static async publicate(
    payload: OrchestratorPayload,
  ): Promise<OrchestratorResponse> {
    return CommonService.post<OrchestratorResponse>(
      "/api/publicate",
      payload,
      true, // requires authentication
    );
  }

  /** Alias pour publicate */
  static async send(
    payload: OrchestratorPayload,
  ): Promise<OrchestratorResponse> {
    return this.publicate(payload);
  }
}
