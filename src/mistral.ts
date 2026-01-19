import { BaseOpenAI } from './base-openai';
import {
  ProviderConfig,
} from './types';

class Mistral extends BaseOpenAI {
  protected readonly _provider = 'mistral';

  constructor(apiKey?: string, config: Partial<ProviderConfig> = {}) {
    const resolvedApiKey = apiKey || process.env.MISTRAL_API_KEY;
    super(resolvedApiKey, 'https://api.mistral.ai/v1', config);
  }

  get provider(): string {
    return this._provider;
  }

  protected defaultModel(): string {
    return 'mistral-large-latest';
  }

  protected defaultEmbeddingModel(): string {
    return 'mistral-embed';
  }
}

export default Mistral;
