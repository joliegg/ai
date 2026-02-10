"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConversation = exports.Conversation = void 0;
const utils_1 = require("./utils");
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
    get currentProvider() { return this.provider; }
    setProvider(provider) { this.provider = provider; }
    addAssistantResponse(content, toolCalls) {
        if (!content && toolCalls.length === 0)
            return;
        const contentParts = [];
        if (content) {
            contentParts.push({ type: 'text', text: content });
        }
        for (const tc of toolCalls) {
            contentParts.push({
                type: 'tool_use',
                id: tc.id,
                name: tc.name,
                input: tc.arguments,
            });
        }
        this.history.push({
            role: 'assistant',
            content: contentParts.length === 1 && typeof contentParts[0] !== 'string' && contentParts[0].type === 'text'
                ? contentParts[0].text
                : contentParts,
        });
    }
    resolveUserMessage(content) {
        if (typeof content === 'string')
            return { role: 'user', content };
        if (Array.isArray(content))
            return { role: 'user', content };
        if ('role' in content)
            return content;
        return { role: 'user', content: content };
    }
    resolveProvider(options) {
        return options?.provider ?? this.provider;
    }
    /**
     * Send a message and get a response
     */
    async send(content, options = {}) {
        const { provider: providerOverride, ...completionOptions } = options;
        const activeProvider = this.resolveProvider({ provider: providerOverride });
        const userMessage = this.resolveUserMessage(content);
        this.history.push(userMessage);
        let response;
        try {
            response = await activeProvider.complete(this.history, {
                model: this.options.model,
                maxTokens: this.options.maxTokens,
                temperature: this.options.temperature,
                ...completionOptions,
            });
        }
        catch (error) {
            this.history.pop();
            throw error;
        }
        this.addAssistantResponse(response.content, response.toolCalls ?? []);
        this.trimHistory();
        return response;
    }
    /**
     * Send a message and stream the response
     */
    async *sendStream(content, options = {}) {
        const { provider: providerOverride, ...streamOptions } = options;
        const activeProvider = this.resolveProvider({ provider: providerOverride });
        if (!activeProvider.stream) {
            throw new Error(`Provider ${activeProvider.provider} does not support streaming`);
        }
        const userMessage = this.resolveUserMessage(content);
        this.history.push(userMessage);
        let responseContent = '';
        const completedToolCalls = [];
        const mergedOptions = {
            model: this.options.model,
            maxTokens: this.options.maxTokens,
            temperature: this.options.temperature,
            ...streamOptions,
            onToolCall: (toolCall) => {
                completedToolCalls.push(toolCall);
                streamOptions.onToolCall?.(toolCall);
            },
        };
        try {
            for await (const chunk of activeProvider.stream(this.history, mergedOptions)) {
                if (chunk.delta.content) {
                    responseContent += chunk.delta.content;
                }
                yield chunk;
            }
        }
        catch (error) {
            this.history.pop();
            throw error;
        }
        this.addAssistantResponse(responseContent || null, completedToolCalls);
        this.trimHistory();
    }
    /**
     * Add a tool result to the conversation
     */
    addToolResult(toolUseId, result, name) {
        this.history.push({
            role: 'tool',
            content: [
                {
                    type: 'tool_result',
                    toolUseId,
                    content: result,
                    ...(name ? { name } : {}),
                },
            ],
        });
    }
    /**
     * Run an automated tool loop: send, handle tool calls, repeat until done
     */
    async runToolLoop(content, options) {
        const { toolHandler, maxIterations = 10, ...sendOptions } = options;
        const { provider: providerOverride, ...completionOptions } = sendOptions;
        const activeProvider = this.resolveProvider({ provider: providerOverride });
        let response = await this.send(content, { provider: activeProvider, ...completionOptions });
        let iterations = 0;
        while (response.finishReason === 'tool_calls' &&
            response.toolCalls &&
            response.toolCalls.length > 0 &&
            iterations < maxIterations) {
            // Execute each tool call and add results
            for (const tc of response.toolCalls) {
                const result = await toolHandler(tc);
                this.addToolResult(tc.id, result, tc.name);
            }
            // Continue the conversation (no new user message)
            response = await activeProvider.complete(this.history, {
                model: this.options.model,
                maxTokens: this.options.maxTokens,
                temperature: this.options.temperature,
                ...completionOptions,
            });
            this.addAssistantResponse(response.content, response.toolCalls ?? []);
            this.trimHistory();
            iterations++;
        }
        return response;
    }
    /**
     * Get the current conversation history (deep cloned)
     */
    getHistory() {
        return (0, utils_1.deepClone)(this.history);
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
        forked.history = structuredClone(this.history);
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
     * Edit a message at a specific index and truncate history after it
     */
    editMessage(index, newContent) {
        if (index < 0 || index >= this.history.length) {
            throw new Error(`Index ${index} is out of bounds (history length: ${this.history.length})`);
        }
        if (this.history[index].role === 'system') {
            throw new Error('Cannot edit system messages. Use reset() to change the system prompt.');
        }
        this.history[index] = {
            ...this.history[index],
            content: newContent,
        };
        // Truncate everything after the edited message
        this.history = this.history.slice(0, index + 1);
    }
    /**
     * Serialize the conversation to JSON
     */
    toJSON() {
        return {
            version: 1,
            options: (0, utils_1.deepClone)(this.options),
            history: (0, utils_1.deepClone)(this.history),
        };
    }
    /**
     * Restore a conversation from JSON
     */
    static fromJSON(provider, json) {
        if (json.version !== 1) {
            throw new Error(`Unsupported conversation version: ${json.version}`);
        }
        const conversation = new Conversation(provider, json.options);
        // Overwrite history directly (serialized history already contains system prompt)
        conversation.history = (0, utils_1.deepClone)(json.history);
        return conversation;
    }
    /**
     * Group non-system messages into exchanges (each starting at a user message)
     */
    groupExchanges(messages) {
        const exchanges = [];
        let current = [];
        for (const msg of messages) {
            if (msg.role === 'user' && current.length > 0) {
                exchanges.push(current);
                current = [];
            }
            current.push(msg);
        }
        if (current.length > 0) {
            exchanges.push(current);
        }
        return exchanges;
    }
    /**
     * Estimate token count for messages
     */
    estimateTokens(messages) {
        let chars = 0;
        for (const msg of messages) {
            chars += 4; // role/formatting overhead per message
            if (typeof msg.content === 'string') {
                chars += msg.content.length;
            }
            else if (Array.isArray(msg.content)) {
                for (const part of msg.content) {
                    if (typeof part === 'string') {
                        chars += part.length;
                    }
                    else if (part.type === 'text') {
                        chars += part.text.length;
                    }
                    else if (part.type === 'tool_result') {
                        chars += part.content.length;
                    }
                    // Multimodal content (images/audio/video) not counted
                }
            }
        }
        return Math.ceil(chars / 4) + 3; // divide by 4 + chat format overhead
    }
    /**
     * Trim history using exchange-aware logic
     */
    trimHistory() {
        if (!this.options.maxHistory && !this.options.maxContextTokens)
            return;
        const systemMessages = this.history.filter((m) => m.role === 'system');
        const nonSystemMessages = this.history.filter((m) => m.role !== 'system');
        const exchanges = this.groupExchanges(nonSystemMessages);
        // Phase 1: maxHistory - trim by message count
        if (this.options.maxHistory) {
            while (exchanges.length > 1) {
                const totalMessages = exchanges.reduce((sum, ex) => sum + ex.length, 0);
                if (totalMessages <= this.options.maxHistory)
                    break;
                exchanges.shift();
            }
        }
        // Phase 2: maxContextTokens - trim by token budget
        if (this.options.maxContextTokens) {
            const systemTokens = this.estimateTokens(systemMessages);
            while (exchanges.length > 1) {
                const remainingMessages = exchanges.flat();
                const totalTokens = systemTokens + this.estimateTokens(remainingMessages);
                if (totalTokens <= this.options.maxContextTokens)
                    break;
                exchanges.shift();
            }
        }
        // Rebuild history
        this.history = [...systemMessages, ...exchanges.flat()];
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
const createConversation = (provider, options = {}) => {
    return new Conversation(provider, options);
};
exports.createConversation = createConversation;
