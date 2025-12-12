import { FastifyRequest, FastifyReply } from "fastify";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export class ClaudeCodeController {
  /**
   * Get Claude Code CLI status
   */
  async getStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Forward request to AI service
      const AI_SERVICE_URL =
        process.env.AI_SERVICE_URL || "http://kitchen-kabinet-ai-service:3002";

      const response = await fetch(`${AI_SERVICE_URL}/api/health`);
      const data = await response.json();

      return reply.send({
        success: true,
        data: {
          claudeCode: data.claudeCode || {
            status: "unknown",
            message: "AI service not available",
          },
          providers: data.providers,
        },
      });
    } catch (error: any) {
      console.error("Claude Code status error:", error);
      return reply.code(500).send({
        success: false,
        error: "Failed to check Claude Code status",
      });
    }
  }

  /**
   * Trigger Claude Code login (returns instructions)
   */
  async triggerLogin(request: FastifyRequest, reply: FastifyReply) {
    return reply.send({
      success: true,
      data: {
        message:
          "To authenticate Claude Code, run the following command in your terminal:",
        command: "podman exec -it kitchen-kabinet-ai-service claude login",
        steps: [
          "Open a terminal",
          "Run the command above",
          "Follow the authentication prompts",
          "Return here and click 'Check Status' to verify",
        ],
      },
    });
  }
}
