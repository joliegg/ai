import { BaseOpenAI } from './base-openai';
import { ProviderConfig } from './types';
export type MODEL = 'deepseek-chat' | 'deepseek-reasoner' | 'deepseek-coder' | (string & {});
declare class DeepSeek extends BaseOpenAI {
    protected readonly _provider = "deepseek";
    constructor(apiKey?: string, config?: Partial<ProviderConfig>);
    get provider(): string;
    protected getDefaultModel(): MODEL;
}
export default DeepSeek;
