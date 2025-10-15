import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  GenericController,
  GenericPaginatedController,
} from "../types/crud.types.js";
import { OrchestratorController } from "../controllers/orchestratorController.js";
import { OrchestratorRequest } from "../types/orchestrator.types.js";
import { ReadAllParams } from "types/db.types.js";

const DEV_MODE = process.env.NODE_ENV !== "production";

// Type definitions for the authentication handlers
type AuthHandler = (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
type AuthHandlers = {
  authGuard: AuthHandler;
  identifyUser: AuthHandler;
};

// New flexible authentication options for CRUD registration
interface RegisterCrudOptions {
  path: string;
  readAuth?: 'optional' | 'required' | 'none';
  writeAuth?: 'required' | 'none';
}

export class RouteRegistry {
  private authHandlers: AuthHandlers;

  constructor(
    private fastify: FastifyInstance,
    authHandlers: AuthHandlers,
    private orchestrator?: OrchestratorController,
  ) {
    this.authHandlers = authHandlers;
  }

  // Generic handler wrapper to catch errors
  private handler = (fn: (req: FastifyRequest, reply: FastifyReply) => Promise<any>) => {
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
   * Registers CRUD routes for a controller with flexible authentication.
   */
  registerCrud<T, C, U>(
    controller: GenericController<T, C, U> | GenericPaginatedController<T, C, U>,
    options: RegisterCrudOptions,
  ) {
    const { path, readAuth = 'none', writeAuth = 'none' } = options;
    const methods = ["create", "findById", "findAll", "update", "delete"];

    // --- Define pre-handlers based on auth options ---
    const getReadHandler = (fn: (req: FastifyRequest, reply: FastifyReply) => Promise<any>) => {
      if (readAuth === 'required') {
        return this.handler(async (req, reply) => {
          await this.authHandlers.authGuard(req, reply);
          if (reply.sent) return;
          await fn(req, reply);
        });
      }
      if (readAuth === 'optional') {
        return this.handler(async (req, reply) => {
          await this.authHandlers.identifyUser(req, reply);
          if (reply.sent) return;
          await fn(req, reply);
        });
      }
      return this.handler(fn);
    };

    const getWriteHandler = (fn: (req: FastifyRequest, reply: FastifyReply) => Promise<any>) => {
      if (writeAuth === 'required') {
        return this.handler(async (req, reply) => {
          await this.authHandlers.authGuard(req, reply);
          if (reply.sent) return;
          await fn(req, reply);
        });
      }
      return this.handler(fn);
    };

    // --- Register Routes ---
    if (methods.includes("create")) {
      this.fastify.post(path, getWriteHandler(async (req: any, reply) => {
        const result = await controller.create(req.body);
        reply.status(201).send(result);
      }));
    }

    if (methods.includes("findById")) {
      this.fastify.get(`${path}/:id`, getReadHandler(async (req: any, reply) => {
        const result = await controller.findById(req.params.id, (req as any).user);
        if (!result) return reply.status(404).send({ error: "Not Found" });
        reply.send(result);
      }));
    }

    if (methods.includes("findAll")) {
      this.fastify.get(path, getReadHandler(async (req: any, reply) => {
        // Parameter parsing logic remains the same
        const query = req.query || {};
        const params: ReadAllParams<any> = {};
        if (query.filter) {
          try {
            const decoded = decodeURIComponent(query.filter);
            params.filter = JSON.parse(decoded);
          } catch {
            params.filter = {};
          }
        }
        if (query.page) params.page = Number(query.page);
        if (query.limit) params.limit = Number(query.limit);
        if (query.sortBy) params.sortBy = query.sortBy;
        if (query.order) params.order = query.order;
        
        const result = await controller.findAll(params, (req as any).user);
        reply.send(result);
      }));
    }

    if (methods.includes("update")) {
      this.fastify.put(`${path}/:id`, getWriteHandler(async (req: any, reply) => {
        const result = await controller.update(req.params.id, req.body);
        reply.send(result);
      }));
      this.fastify.patch(`${path}/:id`, getWriteHandler(async (req: any, reply) => {
        const result = await controller.update(req.params.id, req.body);
        reply.send(result);
      }));
    }

    if (methods.includes("delete")) {
      this.fastify.delete(`${path}/:id`, getWriteHandler(async (req: any, reply) => {
        const result = await controller.delete(req.params.id);
        reply.send(result);
      }));
    }
  }

  /**
   * Registers the single route for the orchestrator with error handling.
   */
  registerOrchestratorRoute(
    method: "POST" | "GET",
    path: string,
    authRequired: boolean = true,
  ) {
    if (!this.orchestrator) throw new Error("Orchestrator required");

    const handler = authRequired && this.authHandlers.authGuard
      ? async (req: FastifyRequest, reply: FastifyReply) => {
          await this.authHandlers.authGuard(req, reply);
          if (reply.sent) return;
          await this.handleOrchestrator(req, reply);
        }
      : this.handleOrchestrator;

    this.fastify[method.toLowerCase() as "post" | "get"](path, this.handler(handler));
  }

  private async handleOrchestrator(req: FastifyRequest, reply: FastifyReply) {
    const result = await this.orchestrator!.processRequest(req.body as OrchestratorRequest);
    reply.send(result);
  }

  registerCustomRoute(
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    handlerFn: (req: FastifyRequest, reply: FastifyReply) => Promise<any>,
  ) {
    this.fastify[method.toLowerCase() as "get" | "post" | "put" | "delete"](path, this.handler(handlerFn));
  }
}
