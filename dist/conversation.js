"use strict";
/**
 * Conversation Manager - Handles chat history and context
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Conversation = void 0;
exports.createConversation = createConversation;
/**
 * Conversation manager that maintains chat history and provides
 * convenient methods for multi-turn conversations
 */
class Conversation {
    provider;
    options;
    history = [];
    constructor(provider, options = {}) {
        this.provider = provider;
        this.options = options;
        // Add system prompt if provided
        if (options.systemPrompt) {
            this.history.push({
                role: 'system',
                content: options.systemPrompt,
            });
        }
    }
    /**
     * Send a message and get a response
     */
    async send(content, options = {}) {
        // Add user message
        const userMessage = typeof content === 'string' ? { role: 'user', content } : content;
        this.history.push(userMessage);
        // Get completion
        const response = await this.provider.complete(this.history, {
            model: this.options.model,
            maxTokens: this.options.maxTokens,
            temperature: this.options.temperature,
            ...options,
        });
        // Add assistant response to history
        if (response.content) {
            this.history.push({
                role: 'assistant',
                content: response.content,
            });
        }
        // Handle tool calls
        if (response.toolCalls && response.toolCalls.length > 0) {
            this.history.push({
                role: 'assistant',
                content: response.toolCalls.map((tc) => ({
                    type: 'tool_use',
                    id: tc.id,
                    name: tc.name,
                    input: tc.arguments,
                })),
            });
        }
        // Trim history if needed
        this.trimHistory();
        return response;
    }
    /**
     * Send a message and stream the response
     */
    async *sendStream(content, options = {}) {
        if (!this.provider.stream) {
            throw new Error(`Provider ${this.provider.provider} does not support streaming`);
        }
        // Add user message
        const userMessage = typeof content === 'string' ? { role: 'user', content } : content;
        this.history.push(userMessage);
        // Collect response content for history
        let responseContent = '';
        // Stream completion
        for await (const chunk of this.provider.stream(this.history, {
            model: this.options.model,
            maxTokens: this.options.maxTokens,
            temperature: this.options.temperature,
            ...options,
        })) {
            if (chunk.delta.content) {
                responseContent += chunk.delta.content;
            }
            yield chunk;
        }
        // Add assistant response to history
        if (responseContent) {
            this.history.push({
                role: 'assistant',
                content: responseContent,
            });
        }
        // Trim history if needed
        this.trimHistory();
    }
    /**
     * Add a tool result to the conversation
     */
    addToolResult(toolUseId, result) {
        this.history.push({
            role: 'tool',
            content: [
                {
                    type: 'tool_result',
                    toolUseId,
                    content: result,
                },
            ],
        });
    }
    /**
     * Get the current conversation history
     */
    getHistory() {
        return [...this.history];
    }
    /**
     * Get the number of messages in history (excluding system)
     */
    get length() {
        return this.history.filter((m) => m.role !== 'system').length;
    }
    /**
     * Clear the conversation history (keeps system prompt)
     */
    clear() {
        const systemMessages = this.history.filter((m) => m.role === 'system');
        this.history = systemMessages;
    }
    /**
     * Reset the conversation with a new system prompt
     */
    reset(systemPrompt) {
        this.history = [];
        if (systemPrompt || this.options.systemPrompt) {
            this.history.push({
                role: 'system',
                content: systemPrompt || this.options.systemPrompt || '',
            });
        }
    }
    /**
     * Fork the conversation (create a copy)
     */
    fork() {
        const forked = new Conversation(this.provider, this.options);
        forked.history = [...this.history];
        return forked;
    }
    /**
     * Remove the last exchange (user message + assistant response)
     */
    undo() {
        // Remove messages from end until we hit a user message
        while (this.history.length > 0) {
            const last = this.history[this.history.length - 1];
            if (last.role === 'system')
                break;
            this.history.pop();
            if (last.role === 'user')
                break;
        }
    }
    /**
     * Trim history to maxHistory if configured
     */
    trimHistory() {
        if (!this.options.maxHistory)
            return;
        const systemMessages = this.history.filter((m) => m.role === 'system');
        const nonSystemMessages = this.history.filter((m) => m.role !== 'system');
        if (nonSystemMessages.length > this.options.maxHistory) {
            // Keep the most recent messages
            const trimmed = nonSystemMessages.slice(-this.options.maxHistory);
            this.history = [...systemMessages, ...trimmed];
        }
    }
    /**
     * Summarize old messages to compress history (requires AI call)
     */
    async summarize(keepRecent = 4) {
        const systemMessages = this.history.filter((m) => m.role === 'system');
        const nonSystemMessages = this.history.filter((m) => m.role !== 'system');
        if (nonSystemMessages.length <= keepRecent)
            return;
        const toSummarize = nonSystemMessages.slice(0, -keepRecent);
        const toKeep = nonSystemMessages.slice(-keepRecent);
        // Create summary using the provider
        const summaryResponse = await this.provider.complete([
            {
                role: 'system',
                content: 'Summarize the following conversation concisely, preserving key information and context:',
            },
            ...toSummarize,
        ]);
        // Replace history with summary + recent messages
        this.history = [
            ...systemMessages,
            {
                role: 'assistant',
                content: `[Previous conversation summary: ${summaryResponse.content}]`,
            },
            ...toKeep,
        ];
    }
}
exports.Conversation = Conversation;
/**
 * Create a conversation manager for any AI provider
 */
function createConversation(provider, options = {}) {
    return new Conversation(provider, options);
}
