import { BaseOpenAI } from './base-openai';
import {
  ProviderConfig,
} from './types';

export type MODEL =
  | 'mistral-large-latest'
  | 'mistral-large-2511'
  | 'mistral-medium-latest'
  | 'mistral-medium-2508'
  | 'mistral-small-latest'
  | 'mistral-small-2506'
  | 'magistral-medium-latest'
  | 'magistral-medium-2509'
  | 'magistral-small-latest'
  | 'magistral-small-2509'
  | 'codestral-latest'
  | 'devstral-small-latest'
  | 'devstral-medium-2507'
  | 'ministral-8b-latest'
  | 'ministral-8b-2410'
  | 'ministral-3b-2410'
  | 'pixtral-large-latest'
  | 'open-mistral-nemo'
  | (string & {});
export type EMBEDDING_MODEL = 'mistral-embed' | (string & {});

class Mistral extends BaseOpenAI {
  protected readonly _provider = 'mistral';

  constructor(apiKey?: string, config: Partial<ProviderConfig> = {}) {
    const resolvedApiKey = apiKey || process.env.MISTRAL_API_KEY;
    super(resolvedApiKey, 'https://api.mistral.ai/v1', config);
  }

  protected defaultModel(): MODEL {
    return 'mistral-large-2511';
  }

  protected defaultEmbeddingModel(): EMBEDDING_MODEL {
    return 'mistral-embed';
  }
}

export default Mistral;
