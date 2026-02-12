import { BaseOpenAI } from './base-openai';
import { ProviderConfig } from './types';

export type MODEL =
  | 'kimi-k2-thinking'
  | 'kimi-k2-thinking-turbo'
  | 'kimi-k2.5'
  | 'kimi-k2-0905-preview'
  | 'moonshot-v1-8k'
  | 'moonshot-v1-32k'
  | 'moonshot-v1-128k'
  | (string & {});

class Kimi extends BaseOpenAI {
  protected readonly _provider = 'kimi';

  constructor(apiKey?: string, config: Partial<ProviderConfig> = {}) {
    const resolvedApiKey = apiKey || process.env.MOONSHOT_API_KEY;
    super(resolvedApiKey, 'https://api.moonshot.ai/v1', config);
  }

  protected defaultModel(): MODEL {
    return 'kimi-k2-thinking';
  }
}

export default Kimi;
