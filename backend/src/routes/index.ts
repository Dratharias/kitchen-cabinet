import { FastifyInstance } from 'fastify';
import { authGuard, loginHandler } from '../controllers/organisms/authController.js';
import { RouteRegistry } from './routeRegistry.js';

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
import { ControllerMap } from '../types/crud.types.js';
import { PublicPublicationController } from '../controllers/molecules/publicPublicationController.js';
import { OrchestratorController } from '../controllers/orchestratorController.js';

export default async function createRoutes(fastify: FastifyInstance) {
  const baseControllers = {
    contents: new ContentController(),
    products: new ProductController(),
    ingredients: new IngredientController(),
    categories: new CategoryController(),
    macros: new MacroController(),
    prepTimes: new PrepTimeController(),
    segments: new SegmentController(),
    units: new UnitController(),
    users: new AppUserController(),
    reviews: new ReviewController(),
    publications: new PublicationController()
  };

  const orchestrator = new OrchestratorController();
  
  const registry = new RouteRegistry(fastify, authGuard, orchestrator);

  registry.registerCustomRoute('POST', '/api/auth/login', loginHandler);

  const reviewController = new ReviewController();

  registry.registerCrud(reviewController, {
    path: '/api/reviews',
    methods: ['findAll', 'findById', 'search'],
    protected: false
  });

  registry.registerCrud(reviewController, {
    path: '/api/reviews',
    methods: ['create', 'update', 'delete'],
    protected: true
  });


  registry.registerCrud(new PublicPublicationController(), {
    path: '/api/publications',
    methods: ['findAll', 'findById'],
    protected: false
  });

  registry.registerCrud(new PublicationController(), {
    path: '/api/private/publications',
    protected: true,
  });

  registry.registerOrchestratorRoute('/api/publicate', true);
}