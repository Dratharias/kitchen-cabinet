import { FastifyInstance } from "fastify";
import { CRUDController } from "./controllers/crudController.js";
import { loginHandler, authGuard } from "./controllers/authController.js";

import { categoryController } from "./controllers/categoryController.js";
import { publicationController } from "./controllers/publicationController.js";
import { ingredientController } from "./controllers/ingredientController.js";
import { resourceController } from "./controllers/resourceController.js";
import { contentController } from "./controllers/contentController.js";
import { macroController } from "./controllers/macroController.js";
import { prepTimeController } from "./controllers/prepTimeController.js";
import { productController } from "./controllers/productController.js";
import { reviewController } from "./controllers/reviewController.js";
import { unitController } from "./controllers/unitController.js";

function registerCRUDRoutes<TBody = any, TParams = any, TQuery = any>(
  fastify: FastifyInstance,
  path: string,
  controller: CRUDController<TBody, TParams, TQuery>,
  protectedRoute = true
) {
  const preHandler = protectedRoute ? [authGuard] : [];

  // CRUD routes
  if (controller.create) fastify.post<{ Body: TBody }>(path, { preHandler }, controller.create);
  if (controller.readAll) fastify.get(path, { preHandler }, controller.readAll);
  if (controller.readOne) fastify.get<{ Params: TParams }>(`${path}/:id`, { preHandler }, controller.readOne);
  if (controller.update) fastify.put<{ Params: TParams; Body: Partial<TBody> }>(`${path}/:id`, { preHandler }, controller.update);
  if (controller.delete) fastify.delete<{ Params: TParams }>(`${path}/:id`, { preHandler }, controller.delete);

  // Advanced routes
  if (controller.advancedRoutes) controller.advancedRoutes(path, fastify);

  // Search route with typed query
  if (controller.search) fastify.get<{ Querystring: TQuery }>(`${path}/search`, { preHandler }, controller.search);
}

export default async function createRoutes(fastify: FastifyInstance) {
  // Public route for login
  fastify.post("/api/auth/login", loginHandler);

  // Protected CRUD routes
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
