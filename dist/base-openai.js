"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseOpenAI = void 0;
const openai_1 = __importDefault(require("openai"));
const types_1 = require("./types");
const errors_1 = require("./errors");
const utils_1 = require("./utils");
class BaseOpenAI {
    _client;
    _config;
    constructor(apiKey, baseURL, config = {}) {
        const resolvedApiKey = apiKey || process.env.OPENAI_API_KEY;
        this._config = {
            apiKey: resolvedApiKey,
            baseURL,
            timeout: config.timeout ?? (0, types_1.getGlobalConfig)().timeout,
            maxRetries: config.maxRetries ?? (0, types_1.getGlobalConfig)().maxRetries,
            retryDelay: config.retryDelay ?? (0, types_1.getGlobalConfig)().retryDelay,
            debug: config.debug ?? (0, types_1.getGlobalConfig)().debug,
        };
        if (resolvedApiKey) {
            this._client = new openai_1.default({
                apiKey: resolvedApiKey,
                baseURL,
                timeout: this._config.timeout,
            });
        }
    }
    async complete(messages, options = {}) {
        if (!this._client) {
            throw new errors_1.AIError('OpenAI client not initialized', this._provider);
        }
        const model = options.model || this.defaultModel();
        const openAIMessages = this.convertToOpenAIMessages(messages);
        const fn = async () => {
            const params = {
                model,
                messages: openAIMessages,
                max_tokens: options.maxTokens,
                temperature: options.temperature,
                top_p: options.topP,
                stop: options.stop,
            };
            // Add tools if provided
            if (options.tools && options.tools.length > 0) {
                params.tools = this.convertToOpenAITools(options.tools);
                if (options.toolChoice) {
                    params.tool_choice = this.convertToolChoice(options.toolChoice);
                }
            }
            // Add response format if JSON mode
            if (options.responseFormat === 'json') {
                params.response_format = { type: 'json_object' };
            }
            // Add reasoning effort for o-series models
            if (options.reasoning?.effort && (model.startsWith('o1') || model.startsWith('o3'))) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                params.reasoning_effort = options.reasoning.effort;
            }
            const response = await this._client.chat.completions.create(params);
            return this.convertFromOpenAIResponse(response);
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
            throw new errors_1.AIError('OpenAI client not initialized', this._provider);
        }
        const model = options.model || this.defaultModel();
        const openAIMessages = this.convertToOpenAIMessages(messages);
        const params = {
            model,
            messages: openAIMessages,
            max_tokens: options.maxTokens,
            temperature: options.temperature,
            top_p: options.topP,
            stop: options.stop,
            stream: true,
        };
        // Add tools if provided
        if (options.tools && options.tools.length > 0) {
            params.tools = this.convertToOpenAITools(options.tools);
            if (options.toolChoice) {
                params.tool_choice = this.convertToolChoice(options.toolChoice);
            }
        }
        // Add response format if JSON mode
        if (options.responseFormat === 'json') {
            params.response_format = { type: 'json_object' };
        }
        const stream = await this._client.chat.completions.create(params);
        const responseId = (0, utils_1.generateId)('chatcmpl');
        const toolCalls = new Map();
        for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta;
            const finishReason = chunk.choices[0]?.finish_reason;
            // Handle tool calls
            if (delta?.tool_calls) {
                for (const toolCall of delta.tool_calls) {
                    const existing = toolCalls.get(toolCall.index) || { id: '', name: '', argumentsJson: '' };
                    if (toolCall.id)
                        existing.id = toolCall.id;
                    if (toolCall.function?.name)
                        existing.name = toolCall.function.name;
                    if (toolCall.function?.arguments) {
                        existing.argumentsJson += toolCall.function.arguments;
                    }
                    toolCalls.set(toolCall.index, existing);
                }
            }
            const unifiedChunk = {
                id: chunk.id || responseId,
                provider: this._provider,
                model: chunk.model || model,
                delta: {
                    content: delta?.content || undefined,
                    toolCalls: delta?.tool_calls?.map((tc) => ({
                        id: tc.id,
                        name: tc.function?.name,
                        arguments: tc.function?.arguments ? JSON.parse(tc.function.arguments) : undefined,
                    })),
                },
                finishReason: finishReason ? this.mapFinishReason(finishReason) : undefined,
            };
            // Call onToken callback
            if (delta?.content && options.onToken) {
                options.onToken(delta.content);
            }
            yield unifiedChunk;
        }
        // Call onToolCall callback for completed tool calls
        if (options.onToolCall) {
            for (const toolCall of toolCalls.values()) {
                if (toolCall.id && toolCall.name) {
                    options.onToolCall({
                        id: toolCall.id,
                        name: toolCall.name,
                        arguments: toolCall.argumentsJson ? JSON.parse(toolCall.argumentsJson) : {},
                    });
                }
            }
        }
    }
    /**
     * Generate embeddings
     */
    async embed(input, options = {}) {
        if (!this._client) {
            throw new errors_1.AIError('OpenAI client not initialized', this._provider);
        }
        const model = options.model || this.defaultEmbeddingModel();
        const inputArray = Array.isArray(input) ? input : [input];
        const fn = async () => {
            const params = {
                model,
                input: inputArray,
            };
            if (options.dimensions) {
                params.dimensions = options.dimensions;
            }
            const response = await this._client.embeddings.create(params);
            return {
                embeddings: response.data.map((d) => d.embedding),
                model: response.model,
                provider: this._provider,
                usage: {
                    promptTokens: response.usage.prompt_tokens,
                    totalTokens: response.usage.total_tokens,
                },
            };
        };
        return (0, utils_1.withRetry)(fn, this._provider, {
            maxRetries: this._config.maxRetries,
            retryDelay: this._config.retryDelay,
        });
    }
    /**
     * Generate images
     */
    async generate(options) {
        if (!this._client) {
            throw new errors_1.AIError('OpenAI client not initialized', this._provider);
        }
        const { prompt, n = 1, model, size, quality, format, background } = options;
        const query = {
            model,
            prompt,
            n,
        };
        if (size)
            query.size = size;
        if (quality)
            query.quality = quality;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (format && model === 'gpt-image-1')
            query.output_format = format;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (background && model === 'gpt-image-1')
            query.background = background;
        if (model !== 'gpt-image-1') {
            query.response_format = 'b64_json';
        }
        const fn = async () => {
            const response = await this._client.images.generate(query);
            if (!response.data) {
                throw new errors_1.AIError('No image data received from provider', this._provider);
            }
            return response.data.map((image) => {
                if (!image.b64_json) {
                    throw new errors_1.AIError('No base64 data received from provider', this._provider);
                }
                return Buffer.from(image.b64_json, 'base64');
            });
        };
        return (0, utils_1.withRetry)(fn, this._provider, {
            maxRetries: this._config.maxRetries,
            retryDelay: this._config.retryDelay,
        });
    }
    defaultModel() {
        return 'gpt-4o';
    }
    defaultEmbeddingModel() {
        return 'text-embedding-3-small';
    }
    convertToOpenAIMessages(messages) {
        return messages.map((msg) => {
            // Handle string content
            if (typeof msg.content === 'string') {
                return {
                    role: msg.role,
                    content: msg.content,
                };
            }
            // Handle array content (multimodal)
            if (Array.isArray(msg.content)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const parts = msg.content.map((part) => {
                    if (typeof part === 'string') {
                        return { type: 'text', text: part };
                    }
                    if (part.type === 'text') {
                        return { type: 'text', text: part.text };
                    }
                    if (part.type === 'image') {
                        return {
                            type: 'image_url',
                            image_url: {
                                url: part.source.type === 'url'
                                    ? part.source.data
                                    : `data:${part.source.mediaType || 'image/png'};base64,${part.source.data}`,
                            },
                        };
                    }
                    if (part.type === 'audio') {
                        // OpenAI GPT-4o audio input format
                        return {
                            type: 'input_audio',
                            input_audio: {
                                data: part.source.data,
                                format: part.source.mediaType?.includes('wav') ? 'wav' : 'mp3',
                            },
                        };
                    }
                    if (part.type === 'document') {
                        // For documents, we include them as file content
                        // OpenAI supports PDF and other documents in certain contexts
                        return {
                            type: 'file',
                            file: {
                                file_data: `data:${part.source.mediaType || 'application/pdf'};base64,${part.source.data}`,
                                filename: part.source.filename,
                            },
                        };
                    }
                    // Tool use/result - handled separately
                    return { type: 'text', text: '' };
                });
                return {
                    role: msg.role,
                    content: parts,
                };
            }
            // Handle single content object
            const content = msg.content;
            if (content.type === 'text') {
                return {
                    role: msg.role,
                    content: content.text,
                };
            }
            return {
                role: msg.role,
                content: '',
            };
        });
    }
    convertToOpenAITools(tools) {
        return tools.map((tool) => ({
            type: 'function',
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters,
            },
        }));
    }
    convertToolChoice(choice) {
        if (typeof choice === 'string') {
            if (choice === 'required')
                return 'required';
            return choice;
        }
        return {
            type: 'function',
            function: { name: choice.name },
        };
    }
    convertFromOpenAIResponse(response) {
        const choice = response.choices[0];
        const toolCalls = choice.message.tool_calls?.map((tc) => {
            // Handle both standard and custom tool call formats
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const tcAny = tc;
            const funcData = tcAny.function || tcAny;
            return {
                id: tc.id,
                name: funcData.name,
                arguments: JSON.parse(funcData.arguments),
            };
        });
        return {
            id: response.id,
            provider: this._provider,
            model: response.model,
            content: choice.message.content,
            toolCalls,
            finishReason: this.mapFinishReason(choice.finish_reason),
            usage: response.usage
                ? {
                    promptTokens: response.usage.prompt_tokens,
                    completionTokens: response.usage.completion_tokens,
                    totalTokens: response.usage.total_tokens,
                }
                : undefined,
            raw: response,
        };
    }
    mapFinishReason(reason) {
        switch (reason) {
            case 'stop':
                return 'stop';
            case 'length':
                return 'length';
            case 'tool_calls':
            case 'function_call':
                return 'tool_calls';
            case 'content_filter':
                return 'content_filter';
            default:
                return 'stop';
        }
    }
}
exports.BaseOpenAI = BaseOpenAI;
