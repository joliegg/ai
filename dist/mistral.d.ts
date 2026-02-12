import { BaseOpenAI } from './base-openai';
import { ProviderConfig } from './types';
export type MODEL = 'mistral-large-latest' | 'mistral-large-2511' | 'mistral-medium-latest' | 'mistral-medium-2508' | 'mistral-small-latest' | 'mistral-small-2506' | 'magistral-medium-latest' | 'magistral-medium-2509' | 'magistral-small-latest' | 'magistral-small-2509' | 'codestral-latest' | 'devstral-small-latest' | 'devstral-medium-2507' | 'ministral-8b-latest' | 'ministral-8b-2410' | 'ministral-3b-2410' | 'pixtral-large-latest' | 'open-mistral-nemo' | (string & {});
export type EMBEDDING_MODEL = 'mistral-embed' | (string & {});
declare class Mistral extends BaseOpenAI {
    protected readonly _provider = "mistral";
    constructor(apiKey?: string, config?: Partial<ProviderConfig>);
    protected defaultModel(): MODEL;
    protected defaultEmbeddingModel(): EMBEDDING_MODEL;
}
export default Mistral;
