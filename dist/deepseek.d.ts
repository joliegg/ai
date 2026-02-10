import { BaseOpenAI } from './base-openai';
import { ProviderConfig } from './types';
export type MODEL = 'deepseek-chat' | 'deepseek-reasoner' | (string & {});
export type EMBEDDING_MODEL = 'deepseek-embedding-v2' | (string & {});
declare class DeepSeek extends BaseOpenAI {
    protected readonly _provider = "deepseek";
    constructor(apiKey?: string, config?: Partial<ProviderConfig>);
    protected defaultModel(): MODEL;
    protected defaultEmbeddingModel(): EMBEDDING_MODEL;
}
export default DeepSeek;
