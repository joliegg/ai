import { BaseOpenAI } from './base-openai';
import { ProviderConfig } from './types';
export type MODEL = 'llama3.2' | 'llama3.1' | 'llama3.3' | 'deepseek-r1' | 'qwen3' | 'qwen2.5' | 'gemma3' | 'mistral' | 'phi4' | (string & {});
export type EMBEDDING_MODEL = 'nomic-embed-text' | 'mxbai-embed-large' | 'bge-m3' | (string & {});
declare class Ollama extends BaseOpenAI {
    protected readonly _provider = "ollama";
    constructor(apiKey?: string, config?: Partial<ProviderConfig>);
    protected defaultModel(): MODEL;
    protected defaultEmbeddingModel(): EMBEDDING_MODEL;
}
export default Ollama;
