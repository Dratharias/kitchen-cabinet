import { FastifyInstance } from "fastify";
import { CRUDController } from "./controllers/crudController";
import { loginHandler, authGuard } from "./controllers/authController";

import { categoryController } from "./controllers/categoryController";
import { publicationController } from "./controllers/publicationController";
import { ingredientController } from "./controllers/ingredientController";
import { resourceController } from "./controllers/resourceController";
import { contentController } from "./controllers/contentController";
import { macroController } from "./controllers/macroController";
import { prepTimeController } from "./controllers/prepTimeController";
import { productController } from "./controllers/productController";
import { reviewController } from "./controllers/reviewController";
import { unitController } from "./controllers/unitController";

function registerCRUDRoutes<TBody, TParams>(
  fastify: FastifyInstance,
  path: string,
  controller: CRUDController<TBody, TParams>,
  protectedRoute = true
) {
  const preHandler = protectedRoute ? [authGuard] : [];

  fastify.post(`${path}`, { preHandler }, controller.create);
  fastify.get(`${path}`, { preHandler }, controller.readAll);
  if (controller.readOne) fastify.get(`${path}/:id`, { preHandler }, controller.readOne);
  fastify.put(`${path}/:id`, { preHandler }, controller.update);
  fastify.delete(`${path}/:id`, { preHandler }, controller.delete);

  if (controller.advancedRoutes) controller.advancedRoutes(path, fastify);
  if (controller.search) fastify.get(`${path}/search`, { preHandler }, controller.search);
}

export default async function createRoutes(fastify: FastifyInstance) {
  // Route publique pour login
  fastify.post("/api/auth/login", loginHandler);

  // Routes protégées CRUD
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
