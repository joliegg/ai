import { BaseOpenAI } from './base-openai';
import { ProviderConfig } from './types';

export type MODEL = 'deepseek-chat' | 'deepseek-reasoner' | 'deepseek-coder' | (string & {});

class DeepSeek extends BaseOpenAI {
  protected readonly _provider = 'deepseek';

  constructor(apiKey?: string, config: Partial<ProviderConfig> = {}) {
    const resolvedApiKey = apiKey || process.env.DEEPSEEK_API_KEY;
    super(resolvedApiKey, 'https://api.deepseek.com', config);
  }

  get provider(): string {
    return this._provider;
  }

  protected defaultModel(): MODEL {
    return 'deepseek-reasoner';
  }
}

export default DeepSeek;
