import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  GenericController,
  GenericPaginatedController,
} from "../types/crud.types.js";
import { OrchestratorController } from "../controllers/orchestratorController.js";
import { OrchestratorRequest } from "../types/orchestrator.types.js";
import { ReadAllParams } from "types/db.types.js";

const DEV_MODE = process.env.NODE_ENV !== "production";

// Defines the CRUD methods a controller can have.
type CrudMethods =
  | "create"
  | "findById"
  | "findAll"
  | "update"
  | "delete"
  | "search";

interface RegisterCrudOptions {
  path: string;
  protected?: boolean;
  methods?: CrudMethods[];
}

export class RouteRegistry {
  constructor(
    private fastify: FastifyInstance,
    private authGuard?: (
      req: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>,
    private orchestrator?: OrchestratorController,
  ) {}

  registerCrud<T, C, U>(
    controller:
      | GenericController<T, C, U>
      | GenericPaginatedController<T, C, U>,
    options: RegisterCrudOptions,
  ) {
    const basePath = options.path;
    const methods = options.methods ?? [
      "create",
      "findById",
      "findAll",
      "update",
      "delete",
    ];

    const handler = (
      fn: (req: FastifyRequest, reply: FastifyReply) => Promise<any>,
    ) => {
      if (options.protected) {
        if (!this.authGuard)
          throw new Error("Auth guard is required for protected routes");

        return async (req: FastifyRequest, reply: FastifyReply) => {
          await this.authGuard!(req, reply);
          if (reply.sent) return;
          return fn(req, reply);
        };
      }
      return fn;
    };

    if (methods.includes("create")) {
      this.fastify.post(
        `${basePath}`,
        handler(async (req: any, reply: FastifyReply) => {
          const result = await controller.create(req.body);
          reply.send(result);
        }),
      );
    }

    if (methods.includes("findById")) {
      this.fastify.get(
        `${basePath}/:id`,
        handler(async (req: any, reply: FastifyReply) => {
          const result = await controller.findById(req.params.id);
          reply.send(result);
        }),
      );
    }

    if (methods.includes("findAll")) {
      this.fastify.get(
        `${basePath}`,
        handler(async (req: any, reply: FastifyReply) => {
          const query = req.query || {};
          const params: ReadAllParams<any> = {};

          if (query.filter) {
            try {
              params.filter =
                typeof query.filter === "string"
                  ? JSON.parse(query.filter)
                  : query.filter;
            } catch {
              params.filter = {};
            }
          }

          if (query.type) {
            params.filter = { ...(params.filter || {}), type: query.type };
          }

          if (query.skip) params.skip = Number(query.skip);
          if (query.take) params.take = Number(query.take);

          if (query.includeRelations !== undefined) {
            params.includeRelations = query.includeRelations === "true";
          }

          const result = await controller.findAll(params);
          reply.send(result);
        }),
      );
    }

    if (methods.includes("update")) {
      this.fastify.put(
        `${basePath}/:id`,
        handler(async (req: any, reply: FastifyReply) => {
          const result = await controller.update(req.params.id, req.body);
          reply.send(result);
        }),
      );
    }

    if (methods.includes("delete")) {
      this.fastify.delete(
        `${basePath}/:id`,
        handler(async (req: any, reply: FastifyReply) => {
          const result = await controller.delete(req.params.id);
          reply.send(result);
        }),
      );
    }
  }

  /**
   * Registers a single route for the orchestrator with detailed error handling.
   */
  registerOrchestratorRoute(path: string, authRequired: boolean = true) {
    if (!this.orchestrator) {
      throw new Error(
        "Orchestrator is required to register orchestrator routes",
      );
    }

    const handler =
      authRequired && this.authGuard
        ? async (req: FastifyRequest, reply: FastifyReply) => {
            await this.authGuard!(req, reply);
            if (reply.sent) return;
            await this.handleOrchestrator(req, reply);
          }
        : async (req: FastifyRequest, reply: FastifyReply) => {
            await this.handleOrchestrator(req, reply);
          };

    this.fastify.post(path, handler);
  }

  private async handleOrchestrator(req: FastifyRequest, reply: FastifyReply) {
    try {
      const orchestratorRequest = req.body as OrchestratorRequest;
      console.log(
        "[/api/publicate] Incoming payload:",
        JSON.stringify(orchestratorRequest, null, 2),
      );

      const result =
        await this.orchestrator!.processRequest(orchestratorRequest);
      reply.send(result);
    } catch (err: any) {
      console.error("[/api/publicate] Orchestrator failed:", err);

      reply.status(500).send({
        success: false,
        error: err.message || "Internal server error",
        ...(DEV_MODE && {
          stack: err.stack,
          payload: req.body,
        }),
      });
    }
  }

  registerCustomRoute(
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    handlerFn: (req: FastifyRequest, reply: FastifyReply) => Promise<any>,
  ) {
    const m = method.toLowerCase() as "get" | "post" | "put" | "delete";
    this.fastify[m](path, handlerFn);
  }
}
