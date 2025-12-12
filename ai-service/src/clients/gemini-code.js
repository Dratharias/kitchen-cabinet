import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export class GeminiCodeClient {
  constructor() {
    this.configDir = path.join(os.homedir(), '.config', 'gemini-cli');
  }

  /**
   * Check if Gemini CLI is installed
   */
  async isInstalled() {
    try {
      const { stdout } = await execAsync('which gemini-cli', { timeout: 5000 });
      return stdout.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if Gemini CLI is authenticated
   * Gemini CLI stores auth state in config files after OAuth login
   */
  async isAuthenticated() {
    try {
      // Try to run a simple command that requires auth
      const { stdout, stderr } = await execAsync('gemini-cli --version', {
        timeout: 5000,
        env: { ...process.env, HOME: os.homedir() }
      });

      // If we get output and no auth errors, we're authenticated
      if (stderr && (stderr.includes('not authenticated') || stderr.includes('login'))) {
        return false;
      }

      // Gemini CLI also creates config files when authenticated
      try {
        await fs.access(this.configDir);
        return true;
      } catch {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if Gemini CLI is available (installed + authenticated)
   */
  async isAvailable() {
    try {
      const installed = await this.isInstalled();
      if (!installed) {
        console.log('Gemini CLI not installed');
        return false;
      }

      const authenticated = await this.isAuthenticated();
      if (!authenticated) {
        console.log('Gemini CLI not authenticated. Run: podman exec -it meal-ticket-ai-service gemini-cli');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Gemini Code Assist availability check failed:', error.message);
      return false;
    }
  }

  /**
   * Generate content using Gemini CLI
   * @param {string} prompt - The prompt to send to Gemini
   * @param {string} instructions - Path to instructions file
   * @returns {Promise<string>} - Generated text response
   */
  async generate(prompt, instructions = '/app/instructions/prompt-template.md') {
    try {
      // Read instructions file
      let instructionsContent = '';
      try {
        instructionsContent = await fs.readFile(instructions, 'utf-8');
      } catch (error) {
        console.warn('Could not read instructions file:', error.message);
      }

      // Create a temporary file for the prompt
      const tmpFile = path.join('/tmp', `gemini-prompt-${Date.now()}.txt`);

      // Combine instructions and prompt
      const fullPrompt = instructionsContent
        ? `${instructionsContent}\n\n---\n\nRECETTE À MIGRER:\n\n${prompt}`
        : prompt;

      await fs.writeFile(tmpFile, fullPrompt);

      // Execute Gemini CLI with the prompt
      // Gemini CLI reads from stdin or file
      const command = `gemini-cli < "${tmpFile}"`;

      const { stdout, stderr } = await execAsync(command, {
        timeout: 60000, // 60 second timeout for generation
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        env: { ...process.env, HOME: os.homedir() },
        shell: '/bin/bash'
      });

      // Clean up temp file
      try {
        await fs.unlink(tmpFile);
      } catch (e) {
        // Ignore cleanup errors
      }

      if (stderr && !stderr.includes('Generating') && !stderr.includes('Processing')) {
        console.warn('Gemini CLI stderr:', stderr);
      }

      return stdout.trim();
    } catch (error) {
      throw new Error(`Gemini Code Assist generation failed: ${error.message}`);
    }
  }

  /**
   * Get authentication instructions
   */
  getAuthInstructions() {
    return {
      installed: 'Gemini CLI is installed',
      notAuthenticated: 'To authenticate, run: podman exec -it meal-ticket-ai-service gemini-cli',
      follow: 'Choose "Login with Google" and follow the OAuth prompts in your browser',
      subscription: 'If you have Google One AI Premium, higher rate limits will be automatically applied',
    };
  }
}
