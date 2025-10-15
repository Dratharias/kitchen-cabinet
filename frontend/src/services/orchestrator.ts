import {
  OrchestratorPayload,
  OrchestratorResponse,
} from "@/types/payloadBuilder";
import { CommonService } from "./common";

/**
 * Service centralisé pour orchestrer les opérations
 * (create, update, delete) sur publications, contenus,
 * ingrédients, segments, etc.
 *
 * Tous les appels transitent par l’API `/api/publicate`
 * pour être traités par l’orchestrateur backend.
 */
export class OrchestratorService {
  /** Création complète d'une publication */
  static async publicate(payload: OrchestratorPayload): Promise<OrchestratorResponse> {
    return CommonService.post<OrchestratorResponse>("/api/publicate", payload, true);
  }

  /** Envoi générique pour (create, update, delete) via POST */
  static async send(payload: OrchestratorPayload): Promise<OrchestratorResponse> {
    return CommonService.post<OrchestratorResponse>("/api/publicate", payload, true);
  }

  /** PATCH (mise à jour partielle) */
  static async patch(payload: OrchestratorPayload): Promise<OrchestratorResponse> {
    return CommonService.put<OrchestratorResponse>("/api/publicate", payload, true);
  }

  /** DELETE (suppression logique ou complète) */
  static async remove(id: string): Promise<OrchestratorResponse> {
    if (!id) throw new Error("id requis pour la suppression");
    return CommonService.delete<OrchestratorResponse>(
      `/api/publicate/${id}`,
      true,
    );
  }
}
