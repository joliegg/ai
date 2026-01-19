import { BaseOpenAI } from './base-openai';
import { ProviderConfig } from './types';
export type OutputFormat = 'png' | 'jpeg' | 'webp';
export type ImageGenerationModel = 'grok-2-image';
export interface GenerateOptions {
    prompt: string;
    n: number;
    model: ImageGenerationModel;
}
declare class Grok extends BaseOpenAI {
    protected readonly _provider = "grok";
    constructor(apiKey?: string, config?: Partial<ProviderConfig>);
    get provider(): string;
    protected defaultModel(): string;
    /**
     * Generate images using Grok's image generation models
     *
     * @param options - Image generation options
     *
     * @returns Promise<Buffer[]> - Array of image buffer
     *
     */
    generate(options: GenerateOptions): Promise<Buffer[]>;
}
export default Grok;
