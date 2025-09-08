import { FastifyInstance } from "fastify";
import { CRUDController } from "./controllers/crudController";

import { categoryController } from "./controllers/categoryController";
import { publicationController } from "./controllers/publicationController";
import { ingredientController } from "./controllers/ingredientController";
import { resourceController } from "./controllers/resourceController";
import { unitController } from "./controllers/unitController";
import { macroController } from "./controllers/macroController";
import { productController } from "./controllers/productController";
import { prepTimeController } from "./controllers/prepTimeController";
import { reviewController } from "./controllers/reviewController";
import { contentController } from "./controllers/contentController";

function registerCRUDRoutes<TBody, TParams>(
  fastify: FastifyInstance,
  path: string,
  controller: CRUDController<TBody, TParams>
) {
  // CRUD de base
  fastify.post(`${path}`, controller.create);
  fastify.get(`${path}`, controller.readAll);
  if (controller.readOne) fastify.get(`${path}/:id`, controller.readOne);
  fastify.put(`${path}/:id`, controller.update);
  fastify.delete(`${path}/:id`, controller.delete);

  // Advanced routes
  if (controller.advancedRoutes) controller.advancedRoutes(path, fastify);
  if (controller.search) fastify.get(`${path}/search`, controller.search);
}

export default async function createRoutes(fastify: FastifyInstance) {
  registerCRUDRoutes(fastify, "/api/categories", categoryController);
  registerCRUDRoutes(fastify, "/api/publications", publicationController);
  registerCRUDRoutes(fastify, "/api/ingredients", ingredientController);
  registerCRUDRoutes(fastify, "/api/resources", resourceController);
  registerCRUDRoutes(fastify, "/api/units", unitController);
  registerCRUDRoutes(fastify, "/api/macros", macroController);
  registerCRUDRoutes(fastify, "/api/products", productController);
  registerCRUDRoutes(fastify, "/api/preptimes", prepTimeController);
  registerCRUDRoutes(fastify, "/api/reviews", reviewController);
  registerCRUDRoutes(fastify, "/api/contents", contentController);
}
