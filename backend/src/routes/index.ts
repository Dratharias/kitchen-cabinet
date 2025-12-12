import { FastifyInstance } from "fastify";
import { AuthController } from "../controllers/auth.controller.js";
import { PublicationController } from "../controllers/publication.controller.js";
import { OrchestratorController } from "../controllers/orchestrator.controller.js";
import { TagController } from "../controllers/tag.controller.js";
import { ImagesController } from "../controllers/images.controller.js";
import { ClaudeCodeController } from "../controllers/claude-code.controller.js";
import { ReviewController } from "../controllers/review.controller.js";
import jwt from "jsonwebtoken";

// Middleware for JWT authentication
async function authenticate(request: any, reply: any) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.code(401).send({
        success: false,
        error: "No token provided",
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    request.user = decoded;
  } catch (error) {
    return reply.code(401).send({
      success: false,
      error: "Invalid token",
    });
  }
}

export async function registerRoutes(server: FastifyInstance) {
  const authController = new AuthController();
  const publicationController = new PublicationController();
  const orchestratorController = new OrchestratorController();
  const tagController = new TagController();
  const imagesController = new ImagesController();
  const claudeCodeController = new ClaudeCodeController();
  const reviewController = new ReviewController();

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================
  server.get("/api/health", async (request, reply) => {
    return { success: true, message: "Server is healthy" };
  });

  // ============================================================================
  // AUTH ROUTES
  // ============================================================================
  server.post("/api/auth/login", (req: any, reply) =>
    authController.login(req, reply)
  );
  server.get("/api/auth/verify", (req, reply) =>
    authController.verify(req, reply)
  );

  // ============================================================================
  // PUBLIC ROUTES (no auth required, filtered data)
  // ============================================================================
  server.get("/api/public/publications", (req, reply) =>
    publicationController.getPublicPublications(req, reply)
  );
  server.get("/api/public/publications/:id", (req, reply) =>
    publicationController.getPublicPublication(req, reply)
  );

  // ============================================================================
  // PRIVATE ROUTES (auth required)
  // ============================================================================

  // Publications
  server.get(
    "/api/private/publications",
    { preHandler: authenticate },
    (req, reply) => publicationController.getAllPublications(req, reply)
  );
  server.get(
    "/api/private/publications/:id",
    { preHandler: authenticate },
    (req, reply) => publicationController.getPublication(req, reply)
  );
  server.delete(
    "/api/private/publications/:id",
    { preHandler: authenticate },
    (req, reply) => publicationController.deletePublication(req, reply)
  );

  // Orchestrator (complex create/update/delete)
  server.post(
    "/api/publicate",
    { preHandler: authenticate },
    (req: any, reply) => orchestratorController.handle(req, reply)
  );

  // Tags
  server.get("/api/tags", (req, reply) => tagController.getAll(req, reply));
  server.post("/api/tags", { preHandler: authenticate }, (req, reply) =>
    tagController.create(req, reply)
  );
  server.put("/api/tags/:id", { preHandler: authenticate }, (req, reply) =>
    tagController.update(req, reply)
  );
  server.delete("/api/tags/:id", { preHandler: authenticate }, (req, reply) =>
    tagController.delete(req, reply)
  );

  // Images (require auth to list, public serving via static files)
  server.get("/api/images", { preHandler: authenticate }, (req, reply) =>
    imagesController.listImages(req, reply)
  );
  server.get("/api/images/:filename", { preHandler: authenticate }, (req, reply) =>
    imagesController.getImageInfo(req, reply)
  );

  // Claude Code control
  server.get("/api/claude-code/status", { preHandler: authenticate }, (req, reply) =>
    claudeCodeController.getStatus(req, reply)
  );
  server.post("/api/claude-code/login", { preHandler: authenticate }, (req, reply) =>
    claudeCodeController.triggerLogin(req, reply)
  );

  // Reviews
  server.get("/api/reviews/publication/:publicationId", (req, reply) =>
    reviewController.getByPublication(req, reply)
  );
  server.post("/api/reviews", { preHandler: authenticate }, (req, reply) =>
    reviewController.create(req, reply)
  );
  server.put("/api/reviews/:id", { preHandler: authenticate }, (req, reply) =>
    reviewController.update(req, reply)
  );
  server.delete("/api/reviews/:id", { preHandler: authenticate }, (req, reply) =>
    reviewController.delete(req, reply)
  );

  console.log("✅ Routes registered successfully");
}
