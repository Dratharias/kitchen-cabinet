import { FastifyInstance } from "fastify";
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
import { PublicPublicationController } from "../controllers/molecules/publicPublicationController.js";
import { OrchestratorController } from "../controllers/orchestratorController.js";

export default async function createRoutes(fastify: FastifyInstance) {
  const orchestrator = new OrchestratorController();
  const registry = new RouteRegistry(fastify, authGuard, orchestrator);

  // --- Auth
  registry.registerCustomRoute("POST", "/api/auth/login", loginHandler);

  // --- Reviews
  const reviewController = new ReviewController();
  registry.registerCrud(reviewController, {
    path: "/api/reviews",
    methods: ["findAll", "findById", "search"],
    protected: false,
  });
  registry.registerCrud(reviewController, {
    path: "/api/reviews",
    methods: ["create", "update", "delete"],
    protected: true,
  });

  // --- Publications publiques
  registry.registerCrud(new PublicPublicationController(), {
    path: "/api/public/publications",
    methods: ["findAll", "findById"],
    protected: false,
  });

  // --- Publications privées (protégées)
  registry.registerCrud(new PublicationController(), {
    path: "/api/private/publications",
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
  registry.registerCrud(new AppUserController(), {
    path: "/api/users",
    protected: true,
  });

  // ============================================================
  // --- Orchestrator routes ---
  // ============================================================

  // POST /api/publicate — create / update orchestrator
  fastify.post(
    "/api/publicate",
    { preHandler: authGuard },
    async (req, reply) => {
      try {
        const body = req.body as {
          action?: "create" | "update" | "readAll";
          payload?: Record<string, any>;
        };

        const { action, payload } = body || {};

        // --- Validation minimale ---
        if (typeof action !== "string" || typeof payload !== "object" || !payload) {
          return reply.status(400).send({
            success: false,
            error: "Invalid request format. Expect { action, payload }.",
          });
        }

        const result = await orchestrator.processRequest({ action, payload });

        // --- Gestion des statuts ---
        const statusCode = result.success ? 200 : 500;
        return reply.status(statusCode).send(result);
      } catch (error: any) {
        console.error("[/api/publicate] Fatal error:", error);
        return reply.status(500).send({
          success: false,
          error: error?.message || "Internal server error",
        });
      }
    },
  );

  // GET /api/publicate/readAll — auto-completion data
  fastify.get(
    "/api/publicate/readAll",
    { preHandler: authGuard },
    async (_req, reply) => {
      try {
        const result = await orchestrator.processRequest({
          action: "readAll",
          payload: {},
        });

        const statusCode = result.success ? 200 : 500;
        return reply.status(statusCode).send(result);
      } catch (error: any) {
        console.error("[/api/publicate/readAll] Fatal error:", error);
        return reply.status(500).send({
          success: false,
          error: error?.message || "Internal server error",
        });
      }
    },
  );
}
