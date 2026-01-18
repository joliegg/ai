"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const types_1 = require("./types");
const errors_1 = require("./errors");
const utils_1 = require("./utils");
class Claude {
    _client;
    _config;
    _provider = 'claude';
    constructor(apiKey, config = {}) {
        const resolvedApiKey = apiKey || process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
        this._config = {
            apiKey: resolvedApiKey,
            timeout: config.timeout ?? (0, types_1.getGlobalConfig)().timeout,
            maxRetries: config.maxRetries ?? (0, types_1.getGlobalConfig)().maxRetries,
            retryDelay: config.retryDelay ?? (0, types_1.getGlobalConfig)().retryDelay,
            debug: config.debug ?? (0, types_1.getGlobalConfig)().debug,
        };
        if (resolvedApiKey) {
            this._client = new sdk_1.default({
                apiKey: resolvedApiKey,
                timeout: this._config.timeout,
            });
        }
    }
    /**
     * Get the provider name
     */
    get provider() {
        return this._provider;
    }
    /**
     * Generate a chat completion
     */
    async complete(messages, options = {}) {
        if (!this._client) {
            throw new errors_1.AIError('Anthropic client not initialized', this._provider);
        }
        const model = options.model || 'claude-opus-4-20250514';
        const { systemPrompt, claudeMessages } = this.convertToClaudeMessages(messages);
        const fn = async () => {
            const params = {
                model,
                messages: claudeMessages,
                max_tokens: options.maxTokens || 1024,
                temperature: options.temperature,
                top_p: options.topP,
                stop_sequences: options.stop ? (Array.isArray(options.stop) ? options.stop : [options.stop]) : undefined,
            };
            // Extended Thinking
            if (options.reasoning?.budget) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                params.thinking = {
                    type: 'enabled',
                    budget_tokens: options.reasoning.budget,
                };
                // Ensure max_tokens is set higher than budget if using thinking
                if (!options.maxTokens || options.maxTokens <= options.reasoning.budget) {
                    params.max_tokens = options.reasoning.budget + 4096; // Add buffer
                }
            }
            // Add system prompt if present
            if (systemPrompt) {
                params.system = systemPrompt;
            }
            // Add tools if provided
            if (options.tools && options.tools.length > 0) {
                params.tools = this.convertToClaudeTools(options.tools);
                if (options.toolChoice) {
                    params.tool_choice = this.convertToolChoice(options.toolChoice);
                }
            }
            const response = await this._client.messages.create(params);
            return this.convertFromClaudeResponse(response, model);
        };
        const timeout = options.timeout ?? this._config.timeout ?? 60000;
        return (0, utils_1.withRetry)(() => (0, utils_1.withTimeout)(fn, timeout, this._provider), this._provider, {
            maxRetries: this._config.maxRetries,
            retryDelay: this._config.retryDelay,
        });
    }
    /**
     * Stream completions
     */
    async *stream(messages, options = {}) {
        if (!this._client) {
            throw new errors_1.AIError('Anthropic client not initialized', this._provider);
        }
        const model = options.model || 'claude-opus-4-20250514';
        const { systemPrompt, claudeMessages } = this.convertToClaudeMessages(messages);
        const params = {
            model,
            messages: claudeMessages,
            max_tokens: options.maxTokens || 1024,
            temperature: options.temperature,
            top_p: options.topP,
            stop_sequences: options.stop ? (Array.isArray(options.stop) ? options.stop : [options.stop]) : undefined,
            stream: true,
        };
        // Add system prompt if present
        if (systemPrompt) {
            params.system = systemPrompt;
        }
        // Add tools if provided
        if (options.tools && options.tools.length > 0) {
            params.tools = this.convertToClaudeTools(options.tools);
            if (options.toolChoice) {
                params.tool_choice = this.convertToolChoice(options.toolChoice);
            }
        }
        const stream = this._client.messages.stream(params);
        const responseId = (0, utils_1.generateId)('msg');
        let currentToolCall = null;
        let toolCallInput = '';
        for await (const event of stream) {
            const chunk = this.processStreamEvent(event, responseId, model, options);
            if (chunk) {
                yield chunk;
            }
            // Handle tool call completion
            if (event.type === 'content_block_start') {
                const contentBlock = event.content_block;
                if (contentBlock.type === 'tool_use') {
                    currentToolCall = {
                        id: contentBlock.id,
                        name: contentBlock.name,
                    };
                    toolCallInput = '';
                }
            }
            if (event.type === 'content_block_delta') {
                const delta = event.delta;
                if (delta.type === 'input_json_delta' && delta.partial_json) {
                    toolCallInput += delta.partial_json;
                }
            }
            if (event.type === 'content_block_stop' && currentToolCall) {
                try {
                    currentToolCall.arguments = JSON.parse(toolCallInput || '{}');
                }
                catch {
                    currentToolCall.arguments = {};
                }
                if (options.onToolCall && currentToolCall.id && currentToolCall.name) {
                    options.onToolCall(currentToolCall);
                }
                currentToolCall = null;
                toolCallInput = '';
            }
        }
    }
    // ==========================================================================
    // Private helper methods
    // ==========================================================================
    convertToClaudeMessages(messages) {
        let systemPrompt;
        const claudeMessages = [];
        for (const msg of messages) {
            // Extract system message
            if (msg.role === 'system') {
                if (typeof msg.content === 'string') {
                    systemPrompt = msg.content;
                }
                else if (Array.isArray(msg.content)) {
                    systemPrompt = msg.content
                        .map((c) => (typeof c === 'string' ? c : c.type === 'text' ? c.text : ''))
                        .join('\n');
                }
                else if (msg.content.type === 'text') {
                    systemPrompt = msg.content.text;
                }
                continue;
            }
            // Convert user/assistant messages
            const role = msg.role === 'tool' ? 'user' : msg.role;
            if (typeof msg.content === 'string') {
                claudeMessages.push({
                    role: role,
                    content: msg.content,
                });
            }
            else if (Array.isArray(msg.content)) {
                const contentBlocks = [];
                for (const part of msg.content) {
                    if (typeof part === 'string') {
                        contentBlocks.push({ type: 'text', text: part });
                    }
                    else if (part.type === 'text') {
                        contentBlocks.push({ type: 'text', text: part.text });
                    }
                    else if (part.type === 'image') {
                        contentBlocks.push({
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: (part.source.mediaType || 'image/png'),
                                data: part.source.data,
                            },
                        });
                    }
                    else if (part.type === 'document') {
                        // Claude supports PDF documents
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        contentBlocks.push({
                            type: 'document',
                            source: {
                                type: 'base64',
                                media_type: part.source.mediaType || 'application/pdf',
                                data: part.source.data,
                            },
                        });
                    }
                    else if (part.type === 'tool_result') {
                        contentBlocks.push({
                            type: 'tool_result',
                            tool_use_id: part.toolUseId,
                            content: part.content,
                        });
                    }
                }
                claudeMessages.push({
                    role: role,
                    content: contentBlocks,
                });
            }
            else {
                const content = msg.content;
                if (content.type === 'text') {
                    claudeMessages.push({
                        role: role,
                        content: content.text,
                    });
                }
                else if (content.type === 'tool_result') {
                    claudeMessages.push({
                        role: 'user',
                        content: [
                            {
                                type: 'tool_result',
                                tool_use_id: content.toolUseId,
                                content: content.content,
                            },
                        ],
                    });
                }
            }
        }
        return { systemPrompt, claudeMessages };
    }
    convertToClaudeTools(tools) {
        return tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            input_schema: {
                type: 'object',
                properties: tool.parameters.properties,
                required: tool.parameters.required,
            },
        }));
    }
    convertToolChoice(choice) {
        if (typeof choice === 'string') {
            if (choice === 'none')
                return { type: 'auto' }; // Claude doesn't have 'none', use 'auto'
            if (choice === 'required')
                return { type: 'any' };
            return { type: 'auto' };
        }
        return { type: 'tool', name: choice.name };
    }
    convertFromClaudeResponse(response, model) {
        let content = null;
        const toolCalls = [];
        for (const block of response.content) {
            if (block.type === 'text') {
                content = (content || '') + block.text;
            }
            else if (block.type === 'tool_use') {
                const toolUse = block;
                toolCalls.push({
                    id: toolUse.id,
                    name: toolUse.name,
                    arguments: toolUse.input,
                });
            }
        }
        return {
            id: response.id,
            provider: this._provider,
            model,
            content,
            toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
            finishReason: this.mapStopReason(response.stop_reason),
            usage: {
                promptTokens: response.usage.input_tokens,
                completionTokens: response.usage.output_tokens,
                totalTokens: response.usage.input_tokens + response.usage.output_tokens,
            },
            raw: response,
        };
    }
    processStreamEvent(event, responseId, model, options) {
        if (event.type === 'content_block_delta') {
            const delta = event.delta;
            if (delta.type === 'text_delta' && delta.text) {
                // Call onToken callback
                if (options.onToken) {
                    options.onToken(delta.text);
                }
                return {
                    id: responseId,
                    provider: this._provider,
                    model,
                    delta: {
                        content: delta.text,
                    },
                };
            }
        }
        if (event.type === 'message_delta') {
            const messageDelta = event;
            if (messageDelta.delta.stop_reason) {
                return {
                    id: responseId,
                    provider: this._provider,
                    model,
                    delta: {},
                    finishReason: this.mapStopReason(messageDelta.delta.stop_reason),
                };
            }
        }
        return null;
    }
    mapStopReason(reason) {
        switch (reason) {
            case 'end_turn':
            case 'stop_sequence':
                return 'stop';
            case 'max_tokens':
                return 'length';
            case 'tool_use':
                return 'tool_calls';
            default:
                return 'stop';
        }
    }
}
exports.default = Claude;
