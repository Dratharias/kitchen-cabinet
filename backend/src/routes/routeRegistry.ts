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

// Définir une interface minimale pour la vérification des publications
interface PublicationCheck {
    public: boolean;
    published: boolean;
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
  
  /**
   * Expose un handler pour les routes enregistrées manuellement.
   */
  public handler = (
    fn: (req: FastifyRequest, reply: FastifyReply) => Promise<any>,
  ) => {
    return async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        return await fn(req, reply);
      } catch (error) {
        console.error("Route handler error:", error);
        reply.status(500).send({ success: false, error: "Internal Server Error" });
      }
    };
  };

  /**
   * Enregistre les routes CRUD pour un contrôleur donné.
   * Ajoute la logique de filtrage public/privé pour les publications.
   */
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
    
    // Détecter si la route est la route publique de publication
    const isPublicPublicationRoute = basePath === "/api/public/publications";

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
          
          // LOGIQUE UNIFIÉE: Vérifier l'état public/published
          if (isPublicPublicationRoute && result) {
            // CORRECTION: Assertion de type pour convaincre TypeScript de l'existence des propriétés
            const pub = result as unknown as PublicationCheck; 
            
            if (!pub.public || !pub.published) {
               return reply.status(404).send({ error: "Publication not found or not published" });
            }
          }
          
          reply.send(result);
        }),
      );
    }

    if (methods.includes("findAll")) {
      this.fastify.get(
        `${basePath}`,
        handler(async (req: any, reply: FastifyReply) => {
          const query = req.query || {};
          const params: ReadAllParams<any> & { isPublicRoute?: boolean } = {};

          if (query.filter) {
            try {
              const raw =
                typeof query.filter === "string"
                  ? query.filter
                  : JSON.stringify(query.filter);

              const decoded =
                raw.includes("%7B") ||
                raw.includes("%7D") ||
                raw.includes("%22")
                  ? decodeURIComponent(raw)
                  : raw;

              params.filter = JSON.parse(decoded);
            } catch {
              params.filter = {};
            }
          }

          if (query.type) {
            params.filter = { ...(params.filter || {}), type: query.type };
          }

          if (query.page) params.page = Number(query.page);
          if (query.limit) params.limit = Number(query.limit);
          if (query.skip) params.skip = Number(query.skip);
          if (query.take) params.take = Number(query.take);
          if (query.sortBy) params.sortBy = query.sortBy;
          if (query.order) params.order = query.order;

          if (query.includeRelations !== undefined) {
            params.includeRelations = query.includeRelations === "true";
          }
          
          // LOGIQUE UNIFIÉE: Injection du flag isPublicRoute
          if (isPublicPublicationRoute) {
            params.isPublicRoute = true;
          }

          const result = await controller.findAll(params);
          reply.send(result);
        }),
      );
    }

    if (methods.includes("update")) {
      // Support PUT (replacement)
      this.fastify.put(
        `${basePath}/:id`,
        handler(async (req: any, reply: FastifyReply) => {
          const result = await controller.update(req.params.id, req.body);
          reply.send(result);
        }),
      );
      // Support PATCH (partial update)
      this.fastify.patch(
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
  registerOrchestratorRoute(
    method: "POST" | "GET",
    path: string,
    authRequired: boolean = true,
  ) {
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

    this.fastify[method.toLowerCase() as "post" | "get"](path, handler);
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