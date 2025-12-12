import { ClaudeCodeClient } from '../clients/claude-code.js';
import { GeminiCodeClient } from '../clients/gemini-code.js';

export async function healthRouter(fastify, options) {
  // Health check endpoint
  fastify.get('/health', async (request, reply) => {
    const providers = {
      gemini: !!process.env.GEMINI_API_KEY,
      'gemini-code': false, // Will check dynamically
      claude: !!process.env.ANTHROPIC_API_KEY,
      'claude-code': false, // Will check dynamically
      openai: !!process.env.OPENAI_API_KEY,
    };

    // Check Claude Code availability
    try {
      const claudeCode = new ClaudeCodeClient();
      const available = await claudeCode.isAvailable();
      providers['claude-code'] = available;
    } catch (e) {
      // Claude Code not available
    }

    // Check Gemini Code availability
    try {
      const geminiCode = new GeminiCodeClient();
      const available = await geminiCode.isAvailable();
      providers['gemini-code'] = available;
    } catch (e) {
      // Gemini Code not available
    }

    const available = Object.entries(providers)
      .filter(([_, isAvailable]) => isAvailable)
      .map(([name]) => name);

    return {
      status: 'ok',
      providers: {
        configured: providers,
        available,
        count: available.length,
      },
      claudeCode: providers['claude-code'] ? {
        status: 'authenticated',
        message: 'Claude Code CLI is ready to use with your subscription'
      } : {
        status: 'not-authenticated',
        message: 'Run: podman exec -it meal-ticket-ai-service claude login'
      },
      geminiCode: providers['gemini-code'] ? {
        status: 'authenticated',
        message: 'Gemini CLI is ready to use with your Google account'
      } : {
        status: 'not-authenticated',
        message: 'Run: podman exec -it meal-ticket-ai-service gemini-cli (choose "Login with Google")'
      }
    };
  });
}
