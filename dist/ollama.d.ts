import { BaseOpenAI } from './base-openai';
import { ProviderConfig } from './types';
declare class Ollama extends BaseOpenAI {
    protected readonly _provider = "ollama";
    constructor(apiKey?: string, config?: Partial<ProviderConfig>);
    get provider(): string;
    protected getDefaultModel(): string;
    protected getDefaultEmbeddingModel(): string;
}
export default Ollama;
