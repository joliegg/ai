import { BaseOpenAI } from './base-openai';
import { ProviderConfig } from './types';
declare class Mistral extends BaseOpenAI {
    protected readonly _provider = "mistral";
    constructor(apiKey?: string, config?: Partial<ProviderConfig>);
    get provider(): string;
    protected getDefaultModel(): string;
    protected getDefaultEmbeddingModel(): string;
}
export default Mistral;
