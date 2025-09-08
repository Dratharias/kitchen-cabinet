import { FastifyInstance } from "fastify";
import { categoryController } from "./controllers/categoryController";
import { CRUDController } from "./controllers/crudController";

function registerCRUDRoutes<TBody, TParams>(
  fastify: FastifyInstance,
  path: string,
  controller: CRUDController<TBody, TParams>
) {
  // Basic CRUD
  fastify.post(`${path}`, controller.create);
  fastify.get(`${path}`, controller.readAll);
  if (controller.readOne) fastify.get(`${path}/:id`, controller.readOne);
  fastify.put(`${path}/:id`, controller.update);
  fastify.delete(`${path}/:id`, controller.delete);

  // Advanced routes
  if (controller.advancedRoutes) {
    controller.advancedRoutes(path, fastify);
  }
}

export default async function createRoutes(fastify: FastifyInstance) {
  registerCRUDRoutes(fastify, "/api/categories", categoryController);
}

