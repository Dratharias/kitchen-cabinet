import { getAuthHeaders } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface ClaudeCodeStatus {
  status: 'authenticated' | 'not-authenticated' | 'unknown';
  message: string;
}

export interface ClaudeCodeStatusResponse {
  success: boolean;
  data?: {
    claudeCode: ClaudeCodeStatus;
    providers: {
      configured: Record<string, boolean>;
      available: string[];
      count: number;
    };
  };
  error?: string;
}

export interface ClaudeCodeLoginResponse {
  success: boolean;
  data?: {
    message: string;
    command: string;
    steps: string[];
  };
  error?: string;
}

export const ClaudeCodeService = {
  /**
   * Get Claude Code CLI status
   */
  async getStatus(): Promise<ClaudeCodeStatusResponse> {
    const response = await fetch(`${API_URL}/api/claude-code/status`, {
      headers: getAuthHeaders(),
    });

    return response.json();
  },

  /**
   * Trigger Claude Code login (returns instructions)
   */
  async triggerLogin(): Promise<ClaudeCodeLoginResponse> {
    const response = await fetch(`${API_URL}/api/claude-code/login`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    return response.json();
  },
};
