import { APIPromise } from 'openai/core.mjs';
import { ChatCompletion, ChatCompletionMessageParam } from 'openai/resources/chat/index.mjs';
export type OutputFormat = 'png' | 'jpeg' | 'webp';
export type ImageGenerationModel = 'grok-2-image';
export interface GenerateOptions {
    prompt: string;
    n: number;
    model: ImageGenerationModel;
}
declare class Grok {
    private _client?;
    constructor(apiKey: string);
    complete(messages: ChatCompletionMessageParam[], model?: string, maxTokens?: number): APIPromise<ChatCompletion> | undefined;
    /**
     * Generate images using OpenAI's image generation models
     *
     * @param options - Image generation options
     *
     * @returns Promise<Buffer[]> - Array of image buffer
     *
     */
    generate(options: GenerateOptions): Promise<Buffer[]>;
}
export default Grok;
