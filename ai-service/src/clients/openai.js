import OpenAI from 'openai';

export class OpenAIClient {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }
    this.client = new OpenAI({ apiKey });
  }

  async isAvailable() {
    try {
      // Test with a minimal completion
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      });
      return true;
    } catch (error) {
      console.error('OpenAI not available:', error.message);
      return false;
    }
  }

  async generate(prompt) {
    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      });

      return completion.choices[0].message.content;
    } catch (error) {
      throw new Error(`OpenAI generation failed: ${error.message}`);
    }
  }
}
