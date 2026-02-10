import { Message, Response, Chunk, CompletionOptions, StreamOptions, EmbeddingOptions, EmbeddingResponse, ProviderConfig, ImagenOptions, ImagenResponse } from './types';
export type MODEL = 'gemini-3-pro-preview' | 'gemini-3-pro-image-preview' | 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'gemini-2.5-flash-lite' | 'gemini-2.0-flash' | 'gemini-2.0-flash-lite' | (string & {});
export type EMBEDDING_MODEL = 'gemini-embedding-001' | 'text-embedding-004' | (string & {});
declare class Gemini {
    private _client;
    private _config;
    private readonly _provider;
    constructor(apiKey?: string, config?: Partial<ProviderConfig>);
    /**
     * Get the provider name
     */
    get provider(): string;
    /**
     * Generate a chat completion
     */
    complete(messages: Message[], options?: CompletionOptions): Promise<Response>;
    /**
     * Stream completions
     */
    stream(messages: Message[], options?: StreamOptions): AsyncIterable<Chunk>;
    /**
     * Generate embeddings
     */
    embed(input: string | string[], options?: EmbeddingOptions): Promise<EmbeddingResponse>;
    /**
     * Generate images using Imagen
     *
     * @param options - Image generation options
     * @returns Generated images as buffers
     */
    generateImage(options: ImagenOptions): Promise<ImagenResponse>;
    private convertToGeminiMessages;
    private convertToGeminiTools;
    private convertToolChoice;
    private convertFromGeminiResponse;
    private mapFinishReason;
}
export default Gemini;
