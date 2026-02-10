import OpenAI from 'openai';
import { ChatCompletion, ChatCompletionMessageParam } from 'openai/resources/chat';
import { Message, Response, Chunk, CompletionOptions, StreamOptions, ToolDefinition, EmbeddingOptions, EmbeddingResponse, ProviderConfig, FinishReason } from './types';
export declare abstract class BaseOpenAI {
    protected _client?: OpenAI;
    protected _config: ProviderConfig;
    protected abstract readonly _provider: string;
    get provider(): string;
    constructor(apiKey?: string, baseURL?: string, config?: Partial<ProviderConfig>);
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
     * Generate images
     */
    generate(options: {
        prompt: string;
        n?: number;
        model?: string;
        size?: string;
        quality?: string;
        format?: string;
        background?: string;
    }): Promise<Buffer[]>;
    protected defaultModel(): string;
    protected defaultEmbeddingModel(): string;
    protected convertToOpenAIMessages(messages: Message[]): ChatCompletionMessageParam[];
    protected convertToOpenAITools(tools: ToolDefinition[]): OpenAI.Chat.Completions.ChatCompletionTool[];
    protected convertToolChoice(choice: 'auto' | 'none' | 'required' | {
        name: string;
    }): OpenAI.Chat.Completions.ChatCompletionToolChoiceOption;
    protected convertFromOpenAIResponse(response: ChatCompletion): Response;
    protected mapFinishReason(reason: string | null): FinishReason;
}
