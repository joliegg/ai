import { BaseOpenAI } from './base-openai';
import { ProviderConfig } from './types';
import { AIError } from './errors';

export type OutputFormat = 'png' | 'jpeg' | 'webp';

export type ImageGenerationModel = 'grok-2-image';

export interface GenerateOptions {
  prompt: string;
  n: number; // Max is 10
  model: ImageGenerationModel;
}

class Grok extends BaseOpenAI {
  protected readonly _provider = 'grok';

  constructor(apiKey?: string, config: Partial<ProviderConfig> = {}) {
    const resolvedApiKey = apiKey || process.env.GROK_API_KEY;
    super(resolvedApiKey, 'https://api.x.ai/v1', config);
  }

  get provider(): string {
    return this._provider;
  }

  protected defaultModel(): string {
    return 'grok-4';
  }



  /**
   * Generate images using Grok's image generation models
   *
   * @param options - Image generation options
   *
   * @returns Promise<Buffer[]> - Array of image buffer
   *
   */
  async generate(options: GenerateOptions): Promise<Buffer[]> {
    const { n } = options;

    if (n > 10) {
      throw new AIError('Cannot generate more than 10 images at once.', this._provider, 'INVALID_COUNT');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return super.generate(options as any);
  }
}

export default Grok;
