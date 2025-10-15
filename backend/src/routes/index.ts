import { FastifyInstance, FastifyReply } from "fastify";
import {
  authGuard,
  loginHandler,
} from "../controllers/organisms/authController.js";
import { RouteRegistry } from "./routeRegistry.js";

import { PublicationController } from "../controllers/organisms/publicationController.js";
import { ReviewController } from "../controllers/organisms/reviewController.js";
import { ContentController } from "../controllers/organisms/contentController.js";
import { ProductController } from "../controllers/molecules/productController.js";
import { IngredientController } from "../controllers/molecules/ingredientController.js";
import { CategoryController } from "../controllers/atoms/categoryController.js";
import { MacroController } from "../controllers/atoms/macroController.js";
import { PrepTimeController } from "../controllers/atoms/prepTimeController.js";
import { SegmentController } from "../controllers/atoms/segmentController.js";
import { UnitController } from "../controllers/atoms/unitsController.js";
import { AppUserController } from "../controllers/organisms/appUserController.js";
import { OrchestratorController } from "../controllers/orchestratorController.js";
import { ServingsController } from "../controllers/atoms/servingsController.js"; 

export default async function createRoutes(fastify: FastifyInstance) {
  const orchestrator = new OrchestratorController();
  const registry = new RouteRegistry(fastify, authGuard, orchestrator);
  const publicationController = new PublicationController(); // Instancier le contrôleur principal

  // --- Auth
  registry.registerCustomRoute("POST", "/api/auth/login", loginHandler);

  // --- Reviews
  const reviewController = new ReviewController();
  registry.registerCrud(reviewController, {
    path: "/api/reviews",
    methods: ["findAll", "findById"],
    protected: false,
  });
  registry.registerCrud(reviewController, {
    path: "/api/reviews",
    methods: ["create", "update", "delete"],
    protected: true,
  });

  registry.registerCrud(publicationController, {
    path: "/api/publications",
    methods: ["findAll", "findById"],
    protected: true,
  });

  // --- Publications privées (Protégées)
  registry.registerCrud(publicationController, {
    path: "/api/publications",
    methods: ["create", "update", "delete"],
    protected: true,
  });

  // --- Ressources protégées (backoffice)
  registry.registerCrud(new CategoryController(), {
    path: "/api/categories",
    protected: true,
  });
  registry.registerCrud(new UnitController(), {
    path: "/api/units",
    protected: true,
  });
  registry.registerCrud(new ProductController(), {
    path: "/api/products",
    protected: true,
  });
  registry.registerCrud(new IngredientController(), {
    path: "/api/ingredients",
    protected: true,
  });
  registry.registerCrud(new MacroController(), {
    path: "/api/macros",
    protected: true,
  });
  registry.registerCrud(new PrepTimeController(), {
    path: "/api/prepTimes",
    protected: true,
  });
  registry.registerCrud(new SegmentController(), {
    path: "/api/segments",
    protected: true,
  });
  registry.registerCrud(new ContentController(), {
    path: "/api/contents",
    protected: true,
  });
  // NOUVEAU: Ajout de Servings Controller
  registry.registerCrud(new ServingsController(), {
    path: "/api/servings",
    protected: true,
  });
  registry.registerCrud(new AppUserController(), {
    path: "/api/users",
    protected: true,
  });

  // ============================================================
  // --- Orchestrator route (Monolithic Creation/Update ONLY) ---
  // ============================================================

  // POST /api/publicate — create / update orchestrator (Payload imbriqué)
  registry.registerOrchestratorRoute("POST", "/api/publicate", true);
}