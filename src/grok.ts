import OpenAI from 'openai';
import { APIPromise } from 'openai/core.mjs';
import { ChatCompletion, ChatCompletionMessageParam } from 'openai/resources/chat/index.mjs';
import { ImageGenerateParams } from 'openai/resources/images.mjs';

export type OutputFormat = 'png' | 'jpeg' | 'webp';

export type ImageGenerationModel = 'grok-2-image';

export interface GenerateOptions {
  prompt: string;
  n: number; // Max is 10
  model: ImageGenerationModel;
}

class Grok {
  private _client?: OpenAI;

  constructor (apiKey: string) {
    this._client = new OpenAI({ 
        apiKey,
        baseURL: "https://api.x.ai/v1",
        timeout: 360000,
    });
  }

  complete (messages: ChatCompletionMessageParam[], model: string = 'grok-4', maxTokens: number = 300): APIPromise<ChatCompletion> | undefined {
    if (this._client instanceof OpenAI === false) {
      throw new Error('OpenAI client not initialized');
    }

    return this._client?.chat.completions.create({ model, messages, max_tokens: maxTokens });
  }

  /**
   * Generate images using OpenAI's image generation models
   * 
   * @param options - Image generation options
   * 
   * @returns Promise<Buffer[]> - Array of image buffer
   *
   */
  async generate (options: GenerateOptions): Promise<Buffer[]> {
    const { prompt, n, model } = options;

    if (this._client instanceof OpenAI === false) {
      throw new Error('OpenAI client not initialized');
    }

    if (n > 10) {
      throw new Error('Cannot generate more than 10 images at once.');
    }

    const query: ImageGenerateParams = {
      model,
      prompt,
      n,
      response_format: 'b64_json'
    };

    const response = await this._client.images.generate(query);
    
    if (!response.data) {
      throw new Error('No image data received from Grok');
    }

    return response.data.map((image) => {
      if (!image.b64_json) {
        throw new Error('No base64 data received from Grok');
      }
      return Buffer.from(image.b64_json, 'base64');
    });
  }

}

export default Grok;