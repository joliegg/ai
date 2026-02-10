import { BaseOpenAI } from './base-openai';
import { ProviderConfig } from './types';

export type MODEL = 'deepseek-chat' | 'deepseek-reasoner' | (string & {});
export type EMBEDDING_MODEL = 'deepseek-embedding-v2' | (string & {});

class DeepSeek extends BaseOpenAI {
  protected readonly _provider = 'deepseek';

  constructor(apiKey?: string, config: Partial<ProviderConfig> = {}) {
    const resolvedApiKey = apiKey || process.env.DEEPSEEK_API_KEY;
    super(resolvedApiKey, 'https://api.deepseek.com', config);
  }

  protected defaultModel(): MODEL {
    return 'deepseek-reasoner';
  }

  protected defaultEmbeddingModel(): EMBEDDING_MODEL {
    return 'deepseek-embedding-v2';
  }
}

export default DeepSeek;
