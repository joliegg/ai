"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const genai_1 = require("@google/genai");
const types_1 = require("./types");
const errors_1 = require("./errors");
const utils_1 = require("./utils");
class Gemini {
    _client;
    _config;
    _provider = 'gemini';
    constructor(apiKey, config = {}) {
        const resolvedApiKey = apiKey || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
        if (!resolvedApiKey) {
            throw new errors_1.AIError('Google API key is required. Set GOOGLE_API_KEY environment variable or pass it to the constructor.', 'gemini');
        }
        this._client = new genai_1.GoogleGenAI({ apiKey: resolvedApiKey });
        this._config = {
            apiKey: resolvedApiKey,
            timeout: config.timeout ?? (0, types_1.getGlobalConfig)().timeout,
            maxRetries: config.maxRetries ?? (0, types_1.getGlobalConfig)().maxRetries,
            retryDelay: config.retryDelay ?? (0, types_1.getGlobalConfig)().retryDelay,
            debug: config.debug ?? (0, types_1.getGlobalConfig)().debug,
        };
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
        const model = options.model || 'gemini-3.0-pro';
        const { systemInstruction, contents } = this.convertToGeminiMessages(messages);
        const fn = async () => {
            const config = {};
            if (options.maxTokens)
                config.maxOutputTokens = options.maxTokens;
            if (options.temperature !== undefined)
                config.temperature = options.temperature;
            if (options.topP !== undefined)
                config.topP = options.topP;
            if (options.stop) {
                config.stopSequences = Array.isArray(options.stop) ? options.stop : [options.stop];
            }
            // JSON Mode
            if (options.responseFormat === 'json') {
                config.responseMimeType = 'application/json';
            }
            if (systemInstruction) {
                config.systemInstruction = systemInstruction;
            }
            // Build tools
            const tools = []; // eslint-disable-line @typescript-eslint/no-explicit-any
            // Add user-defined tools
            if (options.tools && options.tools.length > 0) {
                tools.push({
                    functionDeclarations: this.convertToGeminiTools(options.tools),
                });
            }
            // Add Search Grounding
            if (options.searchGrounding) {
                tools.push({ googleSearchRetrieval: {} });
            }
            // Add Code Execution
            if (options.codeExecution) {
                tools.push({ codeExecution: {} });
            }
            if (tools.length > 0) {
                config.tools = tools;
                // Tool Config (only relevant for user defined tools mostly, but can affect others)
                if (options.toolChoice) {
                    config.toolConfig = {
                        functionCallingConfig: {
                            mode: this.convertToolChoice(options.toolChoice),
                        },
                    };
                }
            }
            const response = await this._client.models.generateContent({
                model,
                contents,
                config,
            });
            return this.convertFromGeminiResponse(response, model);
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
        const model = options.model || 'gemini-3.0-pro';
        const { systemInstruction, contents } = this.convertToGeminiMessages(messages);
        const config = {};
        if (options.maxTokens)
            config.maxOutputTokens = options.maxTokens;
        if (options.temperature !== undefined)
            config.temperature = options.temperature;
        if (options.topP !== undefined)
            config.topP = options.topP;
        if (options.stop) {
            config.stopSequences = Array.isArray(options.stop) ? options.stop : [options.stop];
        }
        // JSON Mode
        if (options.responseFormat === 'json') {
            config.responseMimeType = 'application/json';
        }
        if (systemInstruction) {
            config.systemInstruction = systemInstruction;
        }
        // Build tools - same logic as complete
        const tools = []; // eslint-disable-line @typescript-eslint/no-explicit-any
        if (options.tools && options.tools.length > 0) {
            tools.push({
                functionDeclarations: this.convertToGeminiTools(options.tools),
            });
        }
        if (options.searchGrounding) {
            tools.push({ googleSearchRetrieval: {} });
        }
        if (options.codeExecution) {
            tools.push({ codeExecution: {} });
        }
        if (tools.length > 0) {
            config.tools = tools;
            if (options.toolChoice) {
                config.toolConfig = {
                    functionCallingConfig: {
                        mode: this.convertToolChoice(options.toolChoice),
                    },
                };
            }
        }
        const streamResult = await this._client.models.generateContentStream({
            model,
            contents,
            config,
        });
        const responseId = (0, utils_1.generateId)('gemini');
        const toolCalls = [];
        for await (const chunk of streamResult) {
            const candidates = chunk.candidates;
            if (!candidates || candidates.length === 0)
                continue;
            const candidate = candidates[0];
            let content = '';
            if (candidate.content?.parts) {
                for (const part of candidate.content.parts) {
                    if (part.text) {
                        content += part.text;
                        // Call onToken callback
                        if (options.onToken) {
                            options.onToken(part.text);
                        }
                    }
                    if (part.functionCall) {
                        const toolCall = {
                            id: (0, utils_1.generateId)('call'),
                            name: part.functionCall.name || '',
                            arguments: part.functionCall.args || {},
                        };
                        toolCalls.push(toolCall);
                        // Call onToolCall callback
                        if (options.onToolCall) {
                            options.onToolCall(toolCall);
                        }
                    }
                }
            }
            const unifiedChunk = {
                id: responseId,
                provider: this._provider,
                model,
                delta: {
                    content: content || undefined,
                    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
                },
                finishReason: candidate.finishReason ? this.mapFinishReason(candidate.finishReason) : undefined,
            };
            yield unifiedChunk;
        }
    }
    /**
     * Generate embeddings
     */
    async embed(input, options = {}) {
        const model = options.model || 'text-embedding-004';
        const inputArray = Array.isArray(input) ? input : [input];
        const fn = async () => {
            const embeddings = [];
            // Gemini requires individual embedding requests
            for (const text of inputArray) {
                const result = await this._client.models.embedContent({
                    model,
                    contents: text,
                });
                if (result.embeddings && result.embeddings.length > 0) {
                    embeddings.push(result.embeddings[0].values || []);
                }
            }
            return {
                embeddings,
                model,
                provider: this._provider,
            };
        };
        return (0, utils_1.withRetry)(fn, this._provider, {
            maxRetries: this._config.maxRetries,
            retryDelay: this._config.retryDelay,
        });
    }
    // ===========================================================================
    // Imagen - Image Generation
    // ===========================================================================
    /**
     * Generate images using Imagen
     *
     * @param options - Image generation options
     * @returns Generated images as buffers
     */
    async generateImage(options) {
        const model = options.model || 'imagen-3.0-generate-001';
        const fn = async () => {
            // Build the config
            const config = {
                numberOfImages: options.numberOfImages || 1,
                aspectRatio: options.aspectRatio || '1:1',
            };
            if (options.negativePrompt) {
                config.negativePrompt = options.negativePrompt;
            }
            if (options.personGeneration) {
                config.personGeneration = options.personGeneration;
            }
            if (options.safetyFilterLevel) {
                config.safetyFilterLevel = options.safetyFilterLevel;
            }
            if (options.addWatermark !== undefined) {
                config.addWatermark = options.addWatermark;
            }
            // Use the new SDK's image generation
            const response = await this._client.models.generateImages({
                model,
                prompt: options.prompt,
                config,
            });
            const images = [];
            if (response.generatedImages) {
                for (const img of response.generatedImages) {
                    if (img.image?.imageBytes) {
                        images.push(Buffer.from(img.image.imageBytes, 'base64'));
                    }
                }
            }
            return {
                images,
                provider: this._provider,
                model,
            };
        };
        return (0, utils_1.withRetry)(fn, this._provider, {
            maxRetries: this._config.maxRetries,
            retryDelay: this._config.retryDelay,
        });
    }
    // ==========================================================================
    // Private helper methods
    // ==========================================================================
    convertToGeminiMessages(messages) {
        let systemInstruction;
        const contents = [];
        for (const msg of messages) {
            // Extract system message
            if (msg.role === 'system') {
                if (typeof msg.content === 'string') {
                    systemInstruction = msg.content;
                }
                else if (Array.isArray(msg.content)) {
                    systemInstruction = msg.content
                        .map((c) => (typeof c === 'string' ? c : c.type === 'text' ? c.text : ''))
                        .join('\n');
                }
                else if (msg.content.type === 'text') {
                    systemInstruction = msg.content.text;
                }
                continue;
            }
            // Convert user/assistant messages
            const role = msg.role === 'assistant' ? 'model' : 'user';
            const parts = [];
            if (typeof msg.content === 'string') {
                parts.push({ text: msg.content });
            }
            else if (Array.isArray(msg.content)) {
                for (const part of msg.content) {
                    if (typeof part === 'string') {
                        parts.push({ text: part });
                    }
                    else if (part.type === 'text') {
                        parts.push({ text: part.text });
                    }
                    else if (part.type === 'image') {
                        parts.push({
                            inlineData: {
                                mimeType: part.source.mediaType || 'image/png',
                                data: part.source.data,
                            },
                        });
                    }
                    else if (part.type === 'audio') {
                        // Gemini supports audio input
                        parts.push({
                            inlineData: {
                                mimeType: part.source.mediaType || 'audio/mp3',
                                data: part.source.data,
                            },
                        });
                    }
                    else if (part.type === 'video') {
                        // Gemini supports video understanding
                        parts.push({
                            inlineData: {
                                mimeType: part.source.mediaType || 'video/mp4',
                                data: part.source.data,
                            },
                        });
                    }
                    else if (part.type === 'document') {
                        // Gemini supports PDF and document input
                        parts.push({
                            inlineData: {
                                mimeType: part.source.mediaType || 'application/pdf',
                                data: part.source.data,
                            },
                        });
                    }
                    else if (part.type === 'tool_result') {
                        parts.push({
                            functionResponse: {
                                name: part.toolUseId, // Gemini uses name for function responses
                                response: { result: part.content },
                            },
                        });
                    }
                }
            }
            else {
                const content = msg.content;
                if (content.type === 'text') {
                    parts.push({ text: content.text });
                }
                else if (content.type === 'tool_result') {
                    parts.push({
                        functionResponse: {
                            name: content.toolUseId,
                            response: { result: content.content },
                        },
                    });
                }
            }
            contents.push({ role, parts });
        }
        return { systemInstruction, contents };
    }
    convertToGeminiTools(tools) {
        return tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            parameters: {
                type: genai_1.Type.OBJECT,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                properties: tool.parameters.properties,
                required: tool.parameters.required,
            },
        }));
    }
    convertToolChoice(choice) {
        if (typeof choice === 'string') {
            switch (choice) {
                case 'none':
                    return genai_1.FunctionCallingConfigMode.NONE;
                case 'required':
                    return genai_1.FunctionCallingConfigMode.ANY;
                default:
                    return genai_1.FunctionCallingConfigMode.AUTO;
            }
        }
        // Gemini doesn't support specific function forcing in the same way
        return genai_1.FunctionCallingConfigMode.ANY;
    }
    convertFromGeminiResponse(response, model) {
        const candidates = response.candidates;
        if (!candidates || candidates.length === 0) {
            throw new errors_1.AIError('No response candidate received from Gemini', this._provider);
        }
        const candidate = candidates[0];
        let content = null;
        const toolCalls = [];
        if (candidate.content?.parts) {
            for (const part of candidate.content.parts) {
                if (part.text) {
                    content = (content || '') + part.text;
                }
                if (part.functionCall) {
                    toolCalls.push({
                        id: (0, utils_1.generateId)('call'),
                        name: part.functionCall.name || '',
                        arguments: part.functionCall.args || {},
                    });
                }
            }
        }
        // Also check for direct text property
        if (!content && response.text) {
            content = response.text;
        }
        const usageMetadata = response.usageMetadata;
        return {
            id: (0, utils_1.generateId)('gemini'),
            provider: this._provider,
            model,
            content,
            toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
            finishReason: candidate.finishReason ? this.mapFinishReason(candidate.finishReason) : 'stop',
            usage: usageMetadata
                ? {
                    promptTokens: usageMetadata.promptTokenCount || 0,
                    completionTokens: usageMetadata.candidatesTokenCount || 0,
                    totalTokens: usageMetadata.totalTokenCount || 0,
                }
                : undefined,
            raw: response,
        };
    }
    mapFinishReason(reason) {
        switch (reason) {
            case 'STOP':
                return 'stop';
            case 'MAX_TOKENS':
                return 'length';
            case 'SAFETY':
                return 'content_filter';
            case 'RECITATION':
                return 'content_filter';
            default:
                return 'stop';
        }
    }
}
exports.default = Gemini;
