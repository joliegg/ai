import { Message, Response, Chunk, CompletionOptions, StreamOptions, ProviderConfig } from './types';
export type MODEL = 'claude-opus-4-5-20251101' | 'claude-opus-4-5' | 'claude-3-7-sonnet-latest' | 'claude-3-7-sonnet-20250219' | 'claude-3-5-haiku-latest' | 'claude-3-5-haiku-20241022' | 'claude-haiku-4-5' | 'claude-haiku-4-5-20251001' | 'claude-sonnet-4-20250514' | 'claude-sonnet-4-0' | 'claude-4-sonnet-20250514' | 'claude-sonnet-4-5' | 'claude-sonnet-4-5-20250929' | 'claude-opus-4-0' | 'claude-opus-4-20250514' | 'claude-4-opus-20250514' | 'claude-opus-4-1-20250805' | 'claude-3-opus-latest' | 'claude-3-opus-20240229' | 'claude-3-haiku-20240307';
declare class Claude {
    private _client?;
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
    private convertToClaudeMessages;
    private convertToClaudeTools;
    private convertToolChoice;
    private convertFromClaudeResponse;
    private processStreamEvent;
    private mapStopReason;
}
export default Claude;
