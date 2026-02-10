import { BaseOpenAI } from './base-openai';
import { ProviderConfig } from './types';

export type MODEL = 'qwen3-max' | 'qwen-plus' | 'qwen-turbo' | 'qwen-flash' | 'qwq-plus' | 'qwen3-coder-plus' | 'qwen3-vl-plus' | (string & {});

export type EMBEDDING_MODEL = 'text-embedding-v4' | 'text-embedding-v3' | (string & {});

class Qwen extends BaseOpenAI {
  protected readonly _provider = 'qwen';

  constructor(apiKey?: string, config: Partial<ProviderConfig> = {}) {
    const resolvedApiKey = apiKey || process.env.DASHSCOPE_API_KEY;
    super(resolvedApiKey, 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1', config);
  }

  protected defaultModel(): MODEL {
    return 'qwen-plus';
  }

  protected defaultEmbeddingModel(): EMBEDDING_MODEL {
    return 'text-embedding-v4';
  }
}

export default Qwen;
