import { FastifyInstance } from "fastify";
import { CRUDController } from "./controllers/crudController.js";
import { loginHandler, authGuard } from "./controllers/authController.js";
import publicationController from "./controllers/publicationController.js";

function registerCRUDRoutes<TBody = any, TParams = any, TQuery = Record<string, any>>(
  fastify: FastifyInstance,
  path: string,
  controller: CRUDController<TBody, TParams, TQuery>,
  protectedRoute = false
) {
  const preHandler = protectedRoute ? [authGuard] : [];

  // CRUD routes
  if (controller.create) fastify.post<{ Body: TBody }>(path, { preHandler }, controller.create);
  if (controller.readAll) fastify.get<{ Querystring: TQuery }>(path, { preHandler }, controller.readAll as any);
  if (controller.readOne) fastify.get<{ Params: TParams }>(`${path}/:id`, { preHandler }, controller.readOne);
  if (controller.update) fastify.put<{ Params: TParams; Body: Partial<TBody> }>(`${path}/:id`, { preHandler }, controller.update);
  if (controller.delete) fastify.delete<{ Params: TParams }>(`${path}/:id`, { preHandler }, controller.delete);

  // Advanced routes
  if (controller.advancedRoutes) controller.advancedRoutes(path, fastify);
  if (controller.search) fastify.get<{ Querystring: TQuery }>(`${path}/search`, { preHandler }, controller.search as any);
}


export default async function createRoutes(fastify: FastifyInstance) {
  // Public route for login
  fastify.post("/api/auth/login", loginHandler);

  // Protected CRUD routes
  registerCRUDRoutes(fastify, "/api/publications", publicationController);
}
