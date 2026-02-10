import { BaseOpenAI } from './base-openai';
import {
  ProviderConfig,
} from './types';

export type MODEL = 'mistral-large-latest' | 'mistral-medium-latest' | 'mistral-small-latest' | 'magistral-medium-latest' | 'magistral-small-latest' | 'codestral-latest' | 'devstral-small-latest' | 'ministral-8b-latest' | 'pixtral-large-latest' | 'open-mistral-nemo' | (string & {});
export type EMBEDDING_MODEL = 'mistral-embed' | (string & {});

class Mistral extends BaseOpenAI {
  protected readonly _provider = 'mistral';

  constructor(apiKey?: string, config: Partial<ProviderConfig> = {}) {
    const resolvedApiKey = apiKey || process.env.MISTRAL_API_KEY;
    super(resolvedApiKey, 'https://api.mistral.ai/v1', config);
  }

  protected defaultModel(): MODEL {
    return 'mistral-large-latest';
  }

  protected defaultEmbeddingModel(): EMBEDDING_MODEL {
    return 'mistral-embed';
  }
}

export default Mistral;
