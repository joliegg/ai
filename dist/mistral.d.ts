import { BaseOpenAI } from './base-openai';
import { ProviderConfig } from './types';
export type MODEL = 'mistral-large-latest' | 'mistral-medium-latest' | 'mistral-small-latest' | 'magistral-medium-latest' | 'magistral-small-latest' | 'codestral-latest' | 'devstral-small-latest' | 'ministral-8b-latest' | 'pixtral-large-latest' | 'open-mistral-nemo' | (string & {});
export type EMBEDDING_MODEL = 'mistral-embed' | (string & {});
declare class Mistral extends BaseOpenAI {
    protected readonly _provider = "mistral";
    constructor(apiKey?: string, config?: Partial<ProviderConfig>);
    protected defaultModel(): MODEL;
    protected defaultEmbeddingModel(): EMBEDDING_MODEL;
}
export default Mistral;
