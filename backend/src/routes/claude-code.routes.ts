import { FastifyInstance } from "fastify";
import { ClaudeCodeController } from "../controllers/claude-code.controller.js";

export async function claudeCodeRoutes(fastify: FastifyInstance) {
  const controller = new ClaudeCodeController();

  // Get Claude Code status
  fastify.get("/claude-code/status", controller.getStatus.bind(controller));

  // Get login instructions
  fastify.post("/claude-code/login", controller.triggerLogin.bind(controller));
}
