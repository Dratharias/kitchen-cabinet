// backend/src/routes/index.ts

import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"; // Ajout FastifyReply et FastifyRequest
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
// REMOVED: import { PublicPublicationController } from "../controllers/molecules/publicPublicationController.js";
import { OrchestratorController } from "../controllers/orchestratorController.js";
import { ServingsController } from "../controllers/atoms/servingsController.js"; 
import { shapePublicPublicationFull } from "../utils/shapePublication.js"; // Nécessaire pour findById public

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

  // --- Publications publiques (Lecture seule) - DÉSAVISÉ
  fastify.get(
    "/api/public/publications",
    registry.handler(async (req: any, reply: FastifyReply) => {
      // Le RouteRegistry.handler gère déjà le parsing de la query dans `req.query`
      const params = req.query || {};
      
      // Appel à findAll avec le flag isPublicRoute
      const result = await publicationController.findAll({ ...params, isPublicRoute: true });
      reply.send(result);
    }),
  );

  fastify.get(
    "/api/public/publications/:id",
    registry.handler(async (req: any, reply: FastifyReply) => {
      // Utilisez findById du contrôleur principal
      const pub = await publicationController.findById(req.params.id);
      
      // Ajout de la validation public/published, car findById ne filtre pas par défaut
      if (!pub || !pub.public || !pub.published) {
        return reply.status(404).send({ error: "Publication not found or not published" });
      }
      reply.send(pub);
    }),
  );


  // --- Publications privées (Protégées)
  // Remplacement de PUT par UPDATE (qui gère désormais PATCH)
  registry.registerCrud(publicationController, { // Utiliser l'instance existante
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