import { FastifyInstance } from 'fastify';
import { authGuard, loginHandler } from '../controllers/organisms/authController.js';
import { RouteRegistry } from './routeRegistry.js';

// Controllers
import { PublicationController } from '../controllers/organisms/publicationController.js';
import { ReviewController } from '../controllers/organisms/reviewController.js';
import { ContentController } from '../controllers/organisms/contentController.js';
import { ProductController } from '../controllers/molecules/productController.js';
import { IngredientController } from '../controllers/molecules/ingredientController.js';
import { CategoryController } from '../controllers/atoms/categoryController.js';
import { MacroController } from '../controllers/atoms/macroController.js';
import { PrepTimeController } from '../controllers/atoms/prepTimeController.js';
import { SegmentController } from '../controllers/atoms/segmentController.js';
import { UnitController } from '../controllers/atoms/unitsController.js';
import { AppUserController } from '../controllers/organisms/appUserController.js';
import { GenericController, GenericPaginatedController } from '../types/crud.types.js';
import { PublicPublicationController } from '../controllers/molecules/publicPublicationController.js';

export default async function createRoutes(fastify: FastifyInstance) {
  const registry = new RouteRegistry(fastify, authGuard);

  // -----------------------
  // Public authentication route
  // -----------------------
  registry.registerCustomRoute('POST', '/api/auth/login', loginHandler);

  // -----------------------
  // Protected CRUD routes
  // -----------------------
  const controllers: Record<string, GenericController<any, any, any> | GenericPaginatedController<any, any, any>> = {
    publications: new PublicationController(),
    contents: new ContentController(),
    products: new ProductController(),
    ingredients: new IngredientController(),
    categories: new CategoryController(),
    macros: new MacroController(),
    prepTimes: new PrepTimeController(),
    segments: new SegmentController(),
    units: new UnitController(),
    users: new AppUserController()
  };

  Object.entries(controllers).forEach(([name, controller]) => {
    registry.registerCrud(controller, {
      path: `/api/${name}`,
      protected: true
    });
  });

  // -----------------------
  // Public CRUD routes (read-only)
  // -----------------------

  registry.registerCrud(new PublicPublicationController(), {
    path: '/api/public/publications',
    methods: ['findAll', 'findById']
  });

  registry.registerCrud(new ReviewController(), {
    path: '/api/reviews',
    methods: ['findAll', 'findById']
  });
}
