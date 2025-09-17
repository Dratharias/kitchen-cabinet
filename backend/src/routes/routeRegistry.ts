import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { GenericController, GenericPaginatedController } from '../types/crud.types.js';

type CrudMethods = 'create' | 'findById' | 'findAll' | 'update' | 'delete' | 'search';

interface RegisterCrudOptions {
  path: string;
  protected?: boolean;
  methods?: CrudMethods[]; // si vide = expose toutes les méthodes
}

export class RouteRegistry {
  constructor(private fastify: FastifyInstance, private authGuard?: (req: FastifyRequest, reply: FastifyReply) => Promise<void>) {}

  // ------------------------
  // Routes CRUD génériques
  // ------------------------
  registerCrud<T, C, U>(
    controller: GenericController<T, C, U> | GenericPaginatedController<T, C, U>,
    options: RegisterCrudOptions
  ) {
    const basePath = options.path;
    const methods = options.methods ?? ['create', 'findById', 'findAll', 'update', 'delete'];

    // Middleware de protection
    const handler = (fn: any) => {
        if (options.protected) {
            if (!this.authGuard) throw new Error('Auth guard is required for protected routes');
            
            return async (req: FastifyRequest, reply: FastifyReply) => {
                await this.authGuard!(req, reply);
                if (reply.sent) return; // The most important line in this code;
                return fn(req, reply);
            };
        }
        return fn;
    };

    // Création
    if (methods.includes('create')) {
      this.fastify.post(`${basePath}`, handler(async (req: any, reply: FastifyReply) => {
        const created = await controller.create(req.body);
        reply.send(created);
      }));
    }

    // Récupérer tout
    if (methods.includes('findAll')) {
      this.fastify.get(`${basePath}`, handler(async (req: any, reply: FastifyReply) => {
        const result = await controller.findAll(req.query);
        reply.send(result);
      }));
    }

    // Récupérer un par ID
    if (methods.includes('findById')) {
      this.fastify.get(`${basePath}/:id`, handler(async (req: any, reply: FastifyReply) => {
        const item = await controller.findById(req.params.id);
        if (!item) return reply.status(404).send({ error: 'Not found' });
        reply.send(item);
      }));
    }

    // Update
    if (methods.includes('update')) {
      this.fastify.put(`${basePath}/:id`, handler(async (req: any, reply: FastifyReply) => {
        const updated = await controller.update(req.params.id, req.body);
        reply.send(updated);
      }));
    }

    // Delete
    if (methods.includes('delete')) {
      this.fastify.delete(`${basePath}/:id`, handler(async (req: any, reply: FastifyReply) => {
        const result = await controller.delete(req.params.id);
        reply.send(result);
      }));
    }
  }

  // ------------------------
  // Routes custom
  // ------------------------
  registerCustomRoute(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    handlerFn: (req: FastifyRequest, reply: FastifyReply) => Promise<any>
    ) {
    const m = method.toLowerCase() as 'get' | 'post' | 'put' | 'delete';
    this.fastify[m](path, async (req: FastifyRequest, reply: FastifyReply) => {
        const result = await handlerFn(req, reply);
        reply.send(result);
    });
  }

}
