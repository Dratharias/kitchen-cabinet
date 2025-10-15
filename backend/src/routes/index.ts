import { FastifyInstance } from "fastify";
import {
  authGuard,
  identifyUser, // Import the new flexible authentication handler
  loginHandler,
} from "../controllers/organisms/authController.js";
import { RouteRegistry } from "./routeRegistry.js";

// Import all necessary controllers
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
  // Pass both authentication handlers to the registry
  const registry = new RouteRegistry(
    fastify,
    { authGuard, identifyUser },
    orchestrator,
  );

  // --- Authentication Route ---
  registry.registerCustomRoute("POST", "/api/auth/login", loginHandler);

  // --- Unified Publication Routes ---
  // Reading is open to everyone (optional auth), but writing requires authentication.
  registry.registerCrud(new PublicationController(), {
    path: "/api/publications",
    readAuth: "optional", // Guests can read public items, users see all
    writeAuth: "required", // Creating, updating, deleting requires a valid token
  });

  // --- Unified Review Routes ---
  registry.registerCrud(new ReviewController(), {
    path: "/api/reviews",
    readAuth: "optional",
    writeAuth: "required",
  });

  // --- Strictly Protected Admin/Backoffice Routes ---
  // All actions (read and write) on these resources require authentication.
  const protectedCrudOptions = {
    readAuth: "required",
    writeAuth: "required",
  } as const;

  registry.registerCrud(new CategoryController(), {
    path: "/api/categories",
    ...protectedCrudOptions,
  });
  registry.registerCrud(new UnitController(), {
    path: "/api/units",
    ...protectedCrudOptions,
  });
  registry.registerCrud(new ProductController(), {
    path: "/api/products",
    ...protectedCrudOptions,
  });
  registry.registerCrud(new IngredientController(), {
    path: "/api/ingredients",
    ...protectedCrudOptions,
  });
  registry.registerCrud(new MacroController(), {
    path: "/api/macros",
    ...protectedCrudOptions,
  });
  registry.registerCrud(new PrepTimeController(), {
    path: "/api/prepTimes",
    ...protectedCrudOptions,
  });
  registry.registerCrud(new SegmentController(), {
    path: "/api/segments",
    ...protectedCrudOptions,
  });
  registry.registerCrud(new ContentController(), {
    path: "/api/contents",
    ...protectedCrudOptions,
  });
  registry.registerCrud(new ServingsController(), {
    path: "/api/servings",
    ...protectedCrudOptions,
  });
  registry.registerCrud(new AppUserController(), {
    path: "/api/users",
    ...protectedCrudOptions,
  });

  // --- Orchestrator Route for monolithic actions ---
  registry.registerOrchestratorRoute("POST", "/api/publicate", true);
}
