import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { GenericController, GenericPaginatedController } from '../types/crud.types.js';
import { OrchestratorController } from '../controllers/orchestratorController.js';
import { OrchestratorRequest } from '../types/orchestrator.types.js';

// Defines the CRUD methods a controller can have.
type CrudMethods = 'create' | 'findById' | 'findAll' | 'update' | 'delete' | 'search';

// Options for registering a standard CRUD controller.
interface RegisterCrudOptions {
  path: string;
  protected?: boolean;
  methods?: CrudMethods[];
}

export class RouteRegistry {
  constructor(
    private fastify: FastifyInstance, 
    private authGuard?: (req: FastifyRequest, reply: FastifyReply) => Promise<void>,
    private orchestrator?: OrchestratorController
  ) {}

  /**
   * Registers standard CRUD routes for a given controller.
   * @param controller The controller instance to use for handling requests.
   * @param options The registration options, including path, protection, and methods.
   */
  registerCrud<T, C, U>(
    controller: GenericController<T, C, U> | GenericPaginatedController<T, C, U>,
    options: RegisterCrudOptions
  ) {
    const basePath = options.path;
    const methods = options.methods ?? ['create', 'findById', 'findAll', 'update', 'delete'];

    const handler = (fn: (req: FastifyRequest, reply: FastifyReply) => Promise<any>) => {
        if (options.protected) {
            if (!this.authGuard) throw new Error('Auth guard is required for protected routes');
            
            return async (req: FastifyRequest, reply: FastifyReply) => {
                await this.authGuard!(req, reply);
                if (reply.sent) return;
                return fn(req, reply);
            };
        }
        return fn;
    };

    if (methods.includes('create')) {
      this.fastify.post(`${basePath}`, handler(async (req: any, reply: FastifyReply) => {
        const result = await controller.create(req.body);
        reply.send(result);
      }));
    }

    if (methods.includes('findById')) {
      this.fastify.get(`${basePath}/:id`, handler(async (req: any, reply: FastifyReply) => {
        const result = await controller.findById(req.params.id);
        reply.send(result);
      }));
    }
    
    if (methods.includes('findAll')) {
      this.fastify.get(`${basePath}`, handler(async (req: any, reply: FastifyReply) => {
        const result = await controller.findAll(req.query);
        reply.send(result);
      }));
    }

    if (methods.includes('update')) {
      this.fastify.put(`${basePath}/:id`, handler(async (req: any, reply: FastifyReply) => {
        const result = await controller.update(req.params.id, req.body);
        reply.send(result);
      }));
    }

    if (methods.includes('delete')) {
      this.fastify.delete(`${basePath}/:id`, handler(async (req: any, reply: FastifyReply) => {
        const result = await controller.delete(req.params.id);
        reply.send(result);
      }));
    }
  }

  /**
   * Registers a single route for the orchestrator, which handles a complex, nested payload.
   * @param path The URL path for the orchestrator route.
   * @param authRequired Flag to indicate if the route requires authentication.
   */
  registerOrchestratorRoute(path: string, authRequired: boolean = true) {
    if (!this.orchestrator) {
      throw new Error('Orchestrator is required to register orchestrator routes');
    }

    const handler = authRequired && this.authGuard 
      ? async (req: FastifyRequest, reply: FastifyReply) => {
          await this.authGuard!(req, reply);
          if (reply.sent) return;
          
          const orchestratorRequest = req.body as OrchestratorRequest;
          const result = await this.orchestrator!.processRequest(orchestratorRequest);
          reply.send(result);
        }
      : async (req: FastifyRequest, reply: FastifyReply) => {
          const orchestratorRequest = req.body as OrchestratorRequest;
          const result = await this.orchestrator!.processRequest(orchestratorRequest);
          reply.send(result);
        };

    this.fastify.post(path, handler);
  }

  /**
   * Registers a custom, standalone route.
   * @param method The HTTP method ('GET', 'POST', etc.).
   * @param path The URL path.
   * @param handlerFn The function to handle the request.
   */
  registerCustomRoute(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    handlerFn: (req: FastifyRequest, reply: FastifyReply) => Promise<any>
    ) {
    const m = method.toLowerCase() as 'get' | 'post' | 'put' | 'delete';
    this.fastify[m](path, handlerFn);
  }
}