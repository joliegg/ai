/**
 * Conversation Manager - Handles chat history and context
 */
import { Message, Response, Chunk, CompletionOptions, StreamOptions, ConversationOptions, AIProvider } from './types';
/**
 * Conversation manager that maintains chat history and provides
 * convenient methods for multi-turn conversations
 */
export declare class Conversation {
    private provider;
    private options;
    private history;
    constructor(provider: AIProvider, options?: ConversationOptions);
    /**
     * Send a message and get a response
     */
    send(content: string | Message, options?: Partial<CompletionOptions>): Promise<Response>;
    /**
     * Send a message and stream the response
     */
    sendStream(content: string | Message, options?: Partial<StreamOptions>): AsyncIterable<Chunk>;
    /**
     * Add a tool result to the conversation
     */
    addToolResult(toolUseId: string, result: string): void;
    /**
     * Get the current conversation history
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
     * Trim history to maxHistory if configured
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
export declare function createConversation(provider: AIProvider, options?: ConversationOptions): Conversation;
