import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

export interface CRUDController<TBody = any, TParams = any> {
  create: (req: FastifyRequest<{ Body: TBody }>, reply: FastifyReply) => Promise<any>;
  readAll: (req: FastifyRequest, reply: FastifyReply) => Promise<any>;
  readOne?: (req: FastifyRequest<{ Params: TParams }>, reply: FastifyReply) => Promise<any>;
  update: (req: FastifyRequest<{ Params: TParams; Body: Partial<TBody> }>, reply: FastifyReply) => Promise<any>;
  delete: (req: FastifyRequest<{ Params: TParams }>, reply: FastifyReply) => Promise<any>;
  // Optional advanced routes
  advancedRoutes?: (path:string, fastify: FastifyInstance) => void;
}

