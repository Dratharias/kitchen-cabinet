import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";

export interface CRUDController<TBody = any, TParams = any, TQuery = any> {
  create?: (req: FastifyRequest<{ Body: TBody }>, reply: FastifyReply) => Promise<any>;
  readAll?: (req: FastifyRequest<{ Querystring: TQuery }>, reply: FastifyReply) => Promise<any>; // <-- use TQuery
  readOne?: (req: FastifyRequest<{ Params: TParams }>, reply: FastifyReply) => Promise<any>;
  update?: (req: FastifyRequest<{ Params: TParams; Body: Partial<TBody> }>, reply: FastifyReply) => Promise<any>;
  delete?: (req: FastifyRequest<{ Params: TParams }>, reply: FastifyReply) => Promise<any>;
  search?: (req: FastifyRequest<{ Querystring: TQuery }>, reply: FastifyReply) => Promise<any>;
  advancedRoutes?: (path: string, fastify: FastifyInstance) => void;
}
