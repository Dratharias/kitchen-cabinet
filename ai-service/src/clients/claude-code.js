import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export class ClaudeCodeClient {
  constructor() {
    this.configDir = path.join(os.homedir(), '.config', 'claude-code');
  }

  /**
   * Check if Claude Code CLI is installed
   */
  async isInstalled() {
    try {
      const { stdout } = await execAsync('which claude', { timeout: 5000 });
      return stdout.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if Claude Code is authenticated
   * Claude Code stores auth state in config files
   */
  async isAuthenticated() {
    try {
      // Just check if claude works - if it does, we're authenticated
      // (If not authenticated, claude --version would still work, but --print would fail)
      const result = await execAsync('echo "test" | claude --print 2>&1 | head -1', {
        timeout: 30000,
        maxBuffer: 10 * 1024 * 1024,
        shell: '/bin/sh'
      }).catch(err => ({
        stdout: err.stdout || '',
        stderr: err.stderr || '',
        error: err
      }));

      const output = result.stdout + result.stderr;
      const lowerOutput = output.toLowerCase();

      // Check for authentication errors
      if (lowerOutput.includes('invalid api key') ||
          lowerOutput.includes('please run /login') ||
          lowerOutput.includes('not authenticated') ||
          lowerOutput.includes('error')) {
        console.log('Claude Code CLI not authenticated. Run: podman exec -it meal-ticket-ai-service claude login');
        return false;
      }

      // If we have output and no error, we're authenticated
      if (output.trim().length > 0 && !result.error) {
        console.log('Claude Code CLI is authenticated and ready');
        return true;
      }

      if (result.error) {
        console.log(`Claude Code auth check failed: ${result.error.message || 'unknown error'}`);
      }
      return false;
    } catch (error) {
      console.error('Claude Code authentication check exception:', error.message);
      return false;
    }
  }

  /**
   * Check if Claude Code is available (installed + authenticated)
   */
  async isAvailable() {
    try {
      const installed = await this.isInstalled();
      if (!installed) {
        console.log('Claude Code CLI not installed');
        return false;
      }

      const authenticated = await this.isAuthenticated();
      if (!authenticated) {
        console.log('Claude Code CLI not authenticated. Run: podman exec -it meal-ticket-ai-service claude login');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Claude Code availability check failed:', error.message);
      return false;
    }
  }

  /**
   * Generate content using Claude Code CLI
   * @param {string} prompt - The user's recipe text
   * @param {string} instructions - Path to instructions file
   */
  async generate(prompt, instructions = '/app/instructions/prompt-template.md') {
    try {
      // Use a simplified inline prompt instead of reading large file
      const simpleInstructions = `Convert this recipe to JSON format. The structure MUST be wrapped in a payload object with a key.

IMPORTANT:
- Return ONLY valid JSON, no markdown blocks, no explanations
- Analyze the recipe to intelligently group ingredients and steps

INGREDIENT GROUPING STRATEGY:
- Read through ALL preparation steps first
- Group ingredients by WHERE and HOW they are used in the recipe
- Common groups: "Pâte" (dough), "Garniture" (filling/topping), "Sauce", "Vinaigrette", "Marinade", "Épices" (spices blend), "Décoration"
- If ingredients are used together in a specific step, group them together
- If the recipe has distinct phases (prep, cooking, assembly), group ingredients by phase
- Keep ungrouped (section: null) only if ingredients are used throughout or don't fit a logical group

STEP GROUPING STRATEGY:
- Group preparation steps by cooking phase: "Préparation", "Cuisson", "Assemblage", "Finition"
- Or by component being made: "Pâte", "Garniture", "Sauce", etc.
- Match step groups with ingredient groups when applicable

EXAMPLES:
- Pizza: ingredients grouped as "Pâte", "Sauce tomate", "Garniture" | steps grouped as "Préparation pâte", "Sauce", "Assemblage", "Cuisson"
- Salad: ingredients grouped as "Salade", "Vinaigrette", "Garniture" | steps grouped as "Préparation", "Vinaigrette", "Assemblage"
- Bagels: ingredients ungrouped (used throughout) | steps grouped as "Préparation pâte", "Façonnage", "Cuisson"

{
  "recipe-key": {
    "title": "Recipe Title",
    "description": ["Brief description"],
    "tags": [{"name": "tag1"}, {"name": "tag2"}],
    "public": true,
    "published": true,
    "contents": [{
      "subtitle": "Variation name (optional)",
      "serving_value": "portion",
      "serving_yield": 4,
      "total_prep_time": 45,
      "ingredients": [{
        "quantity": 2,
        "product": {"name": "product name"},
        "unit": {"name": "unit"},
        "section": "Logical Group Name or null"
      }],
      "segments": [{
        "position": 1,
        "segment": {
          "title": "Step Title",
          "paragraph": "Step instructions",
          "section": "Phase/Component Name or null"
        }
      }]
    }]
  }
}

Return ONLY JSON.`;

      // Prepare the full prompt
      const fullPrompt = `${simpleInstructions}\n\nRECIPE:\n${prompt}`;

      // Execute Claude Code in print mode with prompt via stdin
      const command = `printf '%s' ${JSON.stringify(fullPrompt)} | claude --print --tools ""`;

      const { stdout, stderr } = await execAsync(command, {
        timeout: 60000, // 60 second timeout
        maxBuffer: 10 * 1024 * 1024,
        shell: '/bin/sh'
      });

      if (stderr && !stderr.includes('Generating')) {
        console.warn('Claude Code stderr:', stderr);
      }

      return stdout.trim();
    } catch (error) {
      throw new Error(`Claude Code generation failed: ${error.message}`);
    }
  }

  /**
   * Get authentication instructions
   */
  getAuthInstructions() {
    return {
      installed: 'Claude Code CLI is installed',
      notAuthenticated: 'To authenticate, run: podman exec -it meal-ticket-ai-service claude login',
      follow: 'Follow the prompts to link your Anthropic account',
    };
  }
}
