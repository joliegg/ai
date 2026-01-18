import { BaseOpenAI } from './base-openai';
import {
  ProviderConfig,
} from './types';

class Ollama extends BaseOpenAI {
  protected readonly _provider = 'ollama';

  constructor(apiKey?: string, config: Partial<ProviderConfig> = {}) {
    // Ollama doesn't require an API key by default
    const baseURL = config.baseURL || process.env.OLLAMA_HOST || 'http://localhost:11434/v1';
    super(apiKey || 'ollama', baseURL, config);
  }

  get provider(): string {
    return this._provider;
  }

  protected defaultModel(): string {
    return 'llama3.2';
  }

  protected defaultEmbeddingModel(): string {
    return 'nomic-embed-text';
  }
}

export default Ollama;
