import { BaseOpenAI } from './base-openai';
import { ProviderConfig } from './types';
export type MODEL = 'kimi-k2.5' | 'kimi-k2-0905-preview' | 'kimi-k2-thinking' | 'kimi-k2-thinking-turbo' | 'moonshot-v1-8k' | 'moonshot-v1-32k' | 'moonshot-v1-128k' | (string & {});
declare class Kimi extends BaseOpenAI {
    protected readonly _provider = "kimi";
    constructor(apiKey?: string, config?: Partial<ProviderConfig>);
    protected defaultModel(): MODEL;
}
export default Kimi;
