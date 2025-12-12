import Anthropic from '@anthropic-ai/sdk';

export class ClaudeClient {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('Anthropic API key is required');
    }
    this.client = new Anthropic({ apiKey });
  }

  async isAvailable() {
    try {
      // Test with a minimal message
      const message = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      });
      return true;
    } catch (error) {
      console.error('Claude not available:', error.message);
      return false;
    }
  }

  async generate(prompt) {
    try {
      const message = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      });

      return message.content[0].text;
    } catch (error) {
      throw new Error(`Claude generation failed: ${error.message}`);
    }
  }
}
