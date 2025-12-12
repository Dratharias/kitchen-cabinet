const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:3002';

export interface AIProvider {
  gemini: boolean;
  claude: boolean;
  'claude-code': boolean;
  openai: boolean;
}

export interface AIHealthResponse {
  status: string;
  providers: {
    configured: AIProvider;
    available: string[];
    count: number;
  };
}

export interface MigrateRecipeRequest {
  rawRecipe: string;
  provider?: 'auto' | 'gemini' | 'claude' | 'claude-code' | 'openai';
}

export interface MigrateRecipeResponse {
  success: boolean;
  data?: {
    provider: string;
    payload: any;
    rawResponse: string;
  };
  error?: string;
}

export const AIService = {
  /**
   * Check AI service health and available providers
   */
  async getHealth(): Promise<AIHealthResponse> {
    const response = await fetch(`${AI_SERVICE_URL}/api/health`);
    if (!response.ok) {
      throw new Error('Failed to fetch AI service health');
    }
    return response.json();
  },

  /**
   * Migrate a raw recipe text to structured JSON
   */
  async migrateRecipe(request: MigrateRecipeRequest): Promise<MigrateRecipeResponse> {
    const response = await fetch(`${AI_SERVICE_URL}/api/ai/migrate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to migrate recipe');
    }

    return data;
  },

  /**
   * Validate a migrated payload structure
   */
  async validatePayload(payload: any): Promise<{ success: boolean; valid: boolean; errors: string[] }> {
    const response = await fetch(`${AI_SERVICE_URL}/api/ai/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ payload }),
    });

    return response.json();
  },
};
