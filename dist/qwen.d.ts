import { BaseOpenAI } from './base-openai';
import { ProviderConfig } from './types';
export type MODEL = 'qwen3-max' | 'qwen-plus' | 'qwen-turbo' | 'qwen-flash' | 'qwq-plus' | 'qwen3-coder-plus' | 'qwen3-vl-plus' | (string & {});
export type EMBEDDING_MODEL = 'text-embedding-v4' | 'text-embedding-v3' | (string & {});
declare class Qwen extends BaseOpenAI {
    protected readonly _provider = "qwen";
    constructor(apiKey?: string, config?: Partial<ProviderConfig>);
    protected defaultModel(): MODEL;
    protected defaultEmbeddingModel(): EMBEDDING_MODEL;
}
export default Qwen;
