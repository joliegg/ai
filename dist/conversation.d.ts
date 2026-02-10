import { Message, MessageContent, Response, Chunk, ConversationOptions, ConversationJSON, AIProvider, SendContent, ConversationSendOptions, ConversationStreamOptions, ToolLoopOptions } from './types';
export declare class Conversation {
    private provider;
    private options;
    private history;
    constructor(provider: AIProvider, options?: ConversationOptions);
    get currentProvider(): AIProvider;
    setProvider(provider: AIProvider): void;
    private addAssistantResponse;
    private resolveUserMessage;
    private resolveProvider;
    /**
     * Send a message and get a response
     */
    send(content: SendContent, options?: Partial<ConversationSendOptions>): Promise<Response>;
    /**
     * Send a message and stream the response
     */
    sendStream(content: SendContent, options?: Partial<ConversationStreamOptions>): AsyncIterable<Chunk>;
    /**
     * Add a tool result to the conversation
     */
    addToolResult(toolUseId: string, result: string, name?: string): void;
    /**
     * Run an automated tool loop: send, handle tool calls, repeat until done
     */
    runToolLoop(content: SendContent, options: ToolLoopOptions): Promise<Response>;
    /**
     * Get the current conversation history (deep cloned)
     */
    getHistory(): Message[];
    /**
     * Get the number of messages in history (excluding system)
     */
    get length(): number;
    /**
     * Clear the conversation history (keeps system prompt)
     */
    clear(): void;
    /**
     * Reset the conversation with a new system prompt
     */
    reset(systemPrompt?: string): void;
    /**
     * Fork the conversation (create a copy)
     */
    fork(): Conversation;
    /**
     * Remove the last exchange (user message + assistant response)
     */
    undo(): void;
    /**
     * Edit a message at a specific index and truncate history after it
     */
    editMessage(index: number, newContent: MessageContent | MessageContent[]): void;
    /**
     * Serialize the conversation to JSON
     */
    toJSON(): ConversationJSON;
    /**
     * Restore a conversation from JSON
     */
    static fromJSON(provider: AIProvider, json: ConversationJSON): Conversation;
    /**
     * Group non-system messages into exchanges (each starting at a user message)
     */
    private groupExchanges;
    /**
     * Estimate token count for messages
     */
    private estimateTokens;
    /**
     * Trim history using exchange-aware logic
     */
    private trimHistory;
    /**
     * Summarize old messages to compress history (requires AI call)
     */
    summarize(keepRecent?: number): Promise<void>;
}
/**
 * Create a conversation manager for any AI provider
 */
export declare const createConversation: (provider: AIProvider, options?: ConversationOptions) => Conversation;
