import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiClient {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = this.client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }

  async isAvailable() {
    try {
      // Simple test to check if API key is valid
      const result = await this.model.generateContent('test');
      return true;
    } catch (error) {
      console.error('Gemini not available:', error.message);
      return false;
    }
  }

  async generate(prompt) {
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      throw new Error(`Gemini generation failed: ${error.message}`);
    }
  }
}
