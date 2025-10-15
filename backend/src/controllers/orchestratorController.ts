import { prisma } from "../config.js";
import { PublicationProcessor } from "../orchestrator/processors.js";
import { logError, assert, OrchestratorError } from "../orchestrator/utils.js";
import type { OrchestratorRequest, OrchestratorResponse } from "../types/orchestrator.types.js";

/**
 * OrchestratorController is the main entry point for complex, nested CUD operations.
 * It initiates a database transaction and delegates the processing logic to
 * specialized processor classes.
 */
export class OrchestratorController {
  public async processRequest(req: OrchestratorRequest): Promise<OrchestratorResponse> {
    const { action, payload } = req;

    if (!["create", "update", "delete"].includes(action)) {
      return { success: false, error: `Action '${action}' not supported.` };
    }

    try {
      const results = await prisma.$transaction(async (tx: any) => {
        const out: Record<string, unknown> = {};
        const processor = new PublicationProcessor(tx);

        for (const key of Object.keys(payload || {})) {
          const publicationData = (payload as any)[key];
          assert(key, "Missing payload key", "processRequest");

          if (action === "create") {
            assert(publicationData, "Missing publication payload for create", "processRequest", `payload.${key}`);
            out[key] = await processor.create(publicationData);
          } else if (action === "update") {
            assert(publicationData?.publication_id, "Missing publication_id for update", "processRequest", `payload.${key}`);
            out[key] = await processor.update(publicationData);
          } else if (action === "delete") {
            // In a delete action, the key *is* the ID to be deleted.
            await tx.publication.delete({ where: { publication_id: key } });
            out[key] = { publication_id: key, deleted: true };
          }
        }
        return out;
      }, {
        maxWait: 15000, // 15 seconds
        timeout: 30000, // 30 seconds
      });

      return { success: true, results: results as any };
    } catch (error: any) {
      logError("transaction", error, { payload });
      return {
        success: false,
        error: error instanceof OrchestratorError ? `[${error.context}] ${error.message}` : "Internal server error",
      };
    }
  }
}

