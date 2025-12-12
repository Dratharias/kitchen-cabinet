import { GeminiClient } from '../clients/gemini.js';
import { GeminiCodeClient } from '../clients/gemini-code.js';
import { ClaudeClient } from '../clients/claude.js';
import { ClaudeCodeClient } from '../clients/claude-code.js';
import { OpenAIClient } from '../clients/openai.js';

// Initialize clients
const clients = {
  gemini: null,
  'gemini-code': null,
  claude: null,
  'claude-code': null,
  openai: null,
};

try {
  if (process.env.GEMINI_API_KEY) {
    clients.gemini = new GeminiClient(process.env.GEMINI_API_KEY);
  }
} catch (e) {
  console.warn('Gemini client initialization failed:', e.message);
}

try {
  clients['gemini-code'] = new GeminiCodeClient();
} catch (e) {
  console.warn('Gemini Code Assist client initialization failed:', e.message);
}

try {
  if (process.env.ANTHROPIC_API_KEY) {
    clients.claude = new ClaudeClient(process.env.ANTHROPIC_API_KEY);
  }
} catch (e) {
  console.warn('Claude client initialization failed:', e.message);
}

try {
  clients['claude-code'] = new ClaudeCodeClient();
} catch (e) {
  console.warn('Claude Code client initialization failed:', e.message);
}

try {
  if (process.env.OPENAI_API_KEY) {
    clients.openai = new OpenAIClient(process.env.OPENAI_API_KEY);
  }
} catch (e) {
  console.warn('OpenAI client initialization failed:', e.message);
}

async function selectProvider(preferredProvider) {
  if (preferredProvider !== 'auto' && clients[preferredProvider]) {
    const isAvailable = await clients[preferredProvider].isAvailable();
    if (isAvailable) {
      return { provider: preferredProvider, client: clients[preferredProvider] };
    }
  }

  // Try providers in order: claude-code > gemini-code > claude > openai > gemini
  const order = ['claude-code', 'gemini-code', 'claude', 'openai', 'gemini'];

  for (const provider of order) {
    if (clients[provider]) {
      try {
        const isAvailable = await clients[provider].isAvailable();
        if (isAvailable) {
          return { provider, client: clients[provider] };
        }
      } catch (error) {
        console.warn(`${provider} check failed:`, error.message);
      }
    }
  }

  throw new Error('No AI provider available. Please configure API keys or authenticate CLI tools.');
}

export async function aiRouter(fastify, options) {
  // Migrate recipe endpoint
  fastify.post('/migrate', async (request, reply) => {
    try {
      const { rawRecipe, provider = 'auto' } = request.body;

      if (!rawRecipe || typeof rawRecipe !== 'string') {
        return reply.code(400).send({
          success: false,
          error: 'rawRecipe (string) is required',
        });
      }

      // Select available provider
      const { provider: selectedProvider, client } = await selectProvider(provider);
      console.log(`Using provider: ${selectedProvider}`);

      // Generate response
      const response = await client.generate(rawRecipe);

      // Extract JSON from response (handle markdown code blocks)
      let jsonText = response.trim();

      // Remove markdown code blocks if present
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      // Parse JSON
      let payload;
      try {
        payload = JSON.parse(jsonText);
      } catch (error) {
        throw new Error(`Failed to parse AI response as JSON: ${error.message}\n\nResponse:\n${response}`);
      }

      return {
        success: true,
        data: {
          provider: selectedProvider,
          payload,
          rawResponse: response,
        },
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to migrate recipe',
      });
    }
  });

  // Test endpoint to validate migration output
  fastify.post('/validate', async (request, reply) => {
    try {
      const { payload } = request.body;

      // Basic validation of the structure
      const errors = [];

      if (!payload.title) errors.push('title is required');
      if (!payload.contents || !Array.isArray(payload.contents)) {
        errors.push('contents array is required');
      } else {
        payload.contents.forEach((content, i) => {
          if (!content.ingredients || !Array.isArray(content.ingredients)) {
            errors.push(`contents[${i}].ingredients array is required`);
          }
          if (!content.segments || !Array.isArray(content.segments)) {
            errors.push(`contents[${i}].segments array is required`);
          }
        });
      }

      return {
        success: errors.length === 0,
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: error.message,
      });
    }
  });
}
