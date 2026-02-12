"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeSession = void 0;
const base_openai_1 = require("./base-openai");
const errors_1 = require("./errors");
const conversation_1 = require("./conversation");
const ws_1 = __importDefault(require("ws"));
const fs = __importStar(require("fs"));
const ALLOWED_SIZES_V3 = ['1024x1024', '1024x1792', '1792x1024'];
const ALLOWED_SIZES_V2 = ['256x256', '512x512', '1024x1024'];
const ALLOWED_SIZES_GPT_IMAGE_1 = ['1024x1024', '1536x1024', '1024x1536', 'auto'];
const ALLOWED_QUALITIES_V3 = ['standard', 'hd'];
const ALLOWED_QUALITIES_V2 = ['standard'];
const ALLOWED_QUALITIES_GPT_IMAGE_1 = ['auto', 'low', 'medium', 'high'];
class ChatGPT extends base_openai_1.BaseOpenAI {
    _provider = 'openai';
    constructor(apiKey, config = {}) {
        const resolvedApiKey = apiKey || process.env.OPENAI_API_KEY;
        super(resolvedApiKey, undefined, config);
    }
    async generate(options) {
        const { n, size, model, quality } = options;
        if (!this._client) {
            throw new errors_1.AIError('OpenAI client not initialized', this._provider);
        }
        if (model === 'gpt-image-1' || model === 'gpt-image-1.5') {
            if (ALLOWED_SIZES_GPT_IMAGE_1.includes(size) === false) {
                throw new errors_1.AIError(`Size must be one of ${ALLOWED_SIZES_GPT_IMAGE_1.join(', ')}`, this._provider, 'INVALID_SIZE');
            }
            if (quality && ALLOWED_QUALITIES_GPT_IMAGE_1.includes(quality) === false) {
                throw new errors_1.AIError(`Quality must be one of ${ALLOWED_QUALITIES_GPT_IMAGE_1.join(', ')}`, this._provider, 'INVALID_QUALITY');
            }
        }
        if (model === 'dall-e-2') {
            if (ALLOWED_SIZES_V2.includes(size) === false) {
                throw new errors_1.AIError(`Size must be one of ${ALLOWED_SIZES_V2.join(', ')}`, this._provider, 'INVALID_SIZE');
            }
            if (quality && ALLOWED_QUALITIES_V2.includes(quality) === false) {
                throw new errors_1.AIError(`Quality must be one of ${ALLOWED_QUALITIES_V2.join(', ')}`, this._provider, 'INVALID_QUALITY');
            }
        }
        if (model === 'dall-e-3') {
            if (n > 1) {
                throw new errors_1.AIError('DALL-E 3 only supports generating 1 image at a time.', this._provider, 'INVALID_COUNT');
            }
            if (ALLOWED_SIZES_V3.includes(size) === false) {
                throw new errors_1.AIError(`Size must be one of ${ALLOWED_SIZES_V3.join(', ')}`, this._provider, 'INVALID_SIZE');
            }
            if (quality && ALLOWED_QUALITIES_V3.includes(quality) === false) {
                throw new errors_1.AIError(`Quality must be one of ${ALLOWED_QUALITIES_V3.join(', ')}`, this._provider, 'INVALID_QUALITY');
            }
        }
        if (n > 10) {
            throw new errors_1.AIError('Cannot generate more than 10 images at once.', this._provider, 'INVALID_COUNT');
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return super.generate(options);
    }
    /**
     * Create a realtime session for bidirectional audio streaming
     *
     * @param config - Session configuration
     * @returns RealtimeSession instance
     */
    createRealtimeSession(config = {}) {
        if (!this._client) {
            throw new errors_1.AIError('OpenAI client not initialized', this._provider);
        }
        return new RealtimeSession(this._client.apiKey, config);
    }
    /**
     * Transcribe audio to text using Whisper
     *
     * @param audio - Audio buffer or file path
     * @param options - Transcription options
     */
    async transcribe(audio, options = {}) {
        if (!this._client) {
            throw new errors_1.AIError('OpenAI client not initialized', this._provider);
        }
        const audioBuffer = typeof audio === 'string' ? fs.readFileSync(audio) : audio;
        const filename = typeof audio === 'string' ? audio : 'audio.mp3';
        const file = new File([audioBuffer], filename, { type: 'audio/mpeg' });
        const response = await this._client.audio.transcriptions.create({
            file,
            model: options.model || 'whisper-1',
            language: options.language,
            prompt: options.prompt,
            response_format: options.responseFormat || 'verbose_json',
            temperature: options.temperature,
        });
        // Handle different response formats
        if (typeof response === 'string') {
            return {
                text: response,
                provider: this._provider,
            };
        }
        // Cast to any for verbose_json response which has additional fields
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const verboseResponse = response;
        return {
            text: response.text,
            language: verboseResponse.language,
            duration: verboseResponse.duration,
            segments: verboseResponse.segments?.map((s) => ({
                id: s.id,
                start: s.start,
                end: s.end,
                text: s.text,
            })),
            provider: this._provider,
        };
    }
    /**
     * Convert text to speech
     *
     * @param text - Text to convert to speech
     * @param options - TTS options
     * @returns Audio buffer
     */
    async speak(text, options = {}) {
        if (!this._client) {
            throw new errors_1.AIError('OpenAI client not initialized', this._provider);
        }
        const response = await this._client.audio.speech.create({
            model: options.model || 'tts-1',
            voice: options.voice || 'alloy',
            input: text,
            speed: options.speed,
            response_format: options.responseFormat,
        });
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }
    /**
     * Check content for policy violations
     *
     * @param input - Text or array of texts to moderate
     * @param options - Moderation options
     */
    async moderate(input, options = {}) {
        if (!this._client) {
            throw new errors_1.AIError('OpenAI client not initialized', this._provider);
        }
        const response = await this._client.moderations.create({
            input,
            model: options.model || 'omni-moderation-latest',
        });
        return response.results.map((result, index) => {
            const createCategory = (key) => ({
                flagged: result.categories[key],
                score: result.category_scores[key],
            });
            return {
                id: `${response.id}-${index}`,
                flagged: result.flagged,
                categories: {
                    hate: createCategory('hate'),
                    hateThreatening: createCategory('hate/threatening'),
                    harassment: createCategory('harassment'),
                    harassmentThreatening: createCategory('harassment/threatening'),
                    selfHarm: createCategory('self-harm'),
                    selfHarmIntent: createCategory('self-harm/intent'),
                    selfHarmInstructions: createCategory('self-harm/instructions'),
                    sexual: createCategory('sexual'),
                    sexualMinors: createCategory('sexual/minors'),
                    violence: createCategory('violence'),
                    violenceGraphic: createCategory('violence/graphic'),
                },
                provider: this._provider,
            };
        });
    }
    /**
     * Upload a file
     *
     * @param file - File buffer or path
     * @param options - Upload options
     */
    async uploadFile(file, options) {
        if (!this._client) {
            throw new errors_1.AIError('OpenAI client not initialized', this._provider);
        }
        const fileBuffer = typeof file === 'string' ? fs.readFileSync(file) : file;
        const filename = typeof file === 'string' ? file.split('/').pop() || 'file' : 'file';
        const fileObj = new File([fileBuffer], filename);
        const response = await this._client.files.create({
            file: fileObj,
            purpose: options.purpose,
        });
        return {
            id: response.id,
            filename: response.filename,
            bytes: response.bytes,
            createdAt: new Date(response.created_at * 1000),
            purpose: response.purpose,
            provider: this._provider,
        };
    }
    /**
     * List uploaded files
     */
    async listFiles(purpose) {
        if (!this._client) {
            throw new errors_1.AIError('OpenAI client not initialized', this._provider);
        }
        const response = await this._client.files.list({
            purpose: purpose,
        });
        return {
            files: response.data.map((f) => ({
                id: f.id,
                filename: f.filename,
                bytes: f.bytes,
                createdAt: new Date(f.created_at * 1000),
                purpose: f.purpose,
                provider: this._provider,
            })),
            provider: this._provider,
        };
    }
    /**
     * Delete a file
     */
    async deleteFile(fileId) {
        if (!this._client) {
            throw new errors_1.AIError('OpenAI client not initialized', this._provider);
        }
        const response = await this._client.files.delete(fileId);
        return response.deleted;
    }
    /**
     * Retrieve file content
     */
    async getFileContent(fileId) {
        if (!this._client) {
            throw new errors_1.AIError('OpenAI client not initialized', this._provider);
        }
        const response = await this._client.files.content(fileId);
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }
    /**
     * List available models
     */
    async listModels() {
        if (!this._client) {
            throw new errors_1.AIError('OpenAI client not initialized', this._provider);
        }
        const response = await this._client.models.list();
        return {
            models: response.data.map((m) => ({
                id: m.id,
                name: m.id,
                created: new Date(m.created * 1000),
                ownedBy: m.owned_by,
                capabilities: this.inferCapabilities(m.id),
            })),
            provider: this._provider,
        };
    }
    /**
     * Get details for a specific model
     */
    async getModel(modelId) {
        if (!this._client) {
            throw new errors_1.AIError('OpenAI client not initialized', this._provider);
        }
        const model = await this._client.models.retrieve(modelId);
        return {
            id: model.id,
            name: model.id,
            created: new Date(model.created * 1000),
            ownedBy: model.owned_by,
            capabilities: this.inferCapabilities(model.id),
        };
    }
    /**
     * Infer model capabilities from its ID
     */
    inferCapabilities(modelId) {
        const id = modelId.toLowerCase();
        return {
            chat: id.includes('gpt') || id.includes('o1') || id.includes('o3') || id.includes('o4'),
            completion: id.includes('gpt-3.5') || id.includes('davinci'),
            embedding: id.includes('embedding'),
            image: id.includes('dall-e') || id.includes('gpt-image'),
            audio: id.includes('whisper') || id.includes('tts') || id.includes('transcribe'),
            vision: id.includes('gpt-4') || id.includes('gpt-5') || id.includes('o1') || id.includes('o3') || id.includes('o4'),
            functionCalling: id.includes('gpt-4') || id.includes('gpt-5') || id.includes('gpt-3.5-turbo') || id.includes('o3') || id.includes('o4'),
        };
    }
    /**
     * Process multiple completion requests in parallel
     *
     * @param requests - Array of batch requests
     * @param options - Shared options for all requests
     * @param concurrency - Max concurrent requests (default: 5)
     */
    async completeBatch(requests, options = {}, concurrency = 5) {
        if (!Number.isInteger(concurrency) || concurrency < 1) {
            throw new errors_1.AIError('Concurrency must be a positive integer', this._provider, 'INVALID_CONCURRENCY', 400);
        }
        const results = [];
        const queue = [...requests];
        const processRequest = async (request) => {
            try {
                const response = await this.complete(request.messages, {
                    ...options,
                    ...request.options,
                });
                return { id: request.id, response };
            }
            catch (error) {
                return { id: request.id, error: error };
            }
        };
        // Process in batches
        while (queue.length > 0) {
            const batch = queue.splice(0, concurrency);
            const batchResults = await Promise.all(batch.map(processRequest));
            results.push(...batchResults);
        }
        return results;
    }
    /**
     * Estimate token count for messages
     *
     * Note: This is an approximation. For exact counts, use tiktoken library.
     *
     * @param messages - Messages to count
     * @param model - Model to use for estimation
     */
    countTokens(messages, model = 'gpt-5.2') {
        // Rough estimation: ~4 chars per token on average
        // This is a simplified approximation
        let totalChars = 0;
        for (const message of messages) {
            if (typeof message.content === 'string') {
                totalChars += message.content.length;
            }
            else if (Array.isArray(message.content)) {
                for (const part of message.content) {
                    if (typeof part === 'string') {
                        totalChars += part.length;
                    }
                    else if ('text' in part && part.type === 'text') {
                        totalChars += part.text.length;
                    }
                }
            }
            // Add overhead for message structure
            totalChars += 4; // role + formatting
        }
        // Base overhead for chat format
        const overhead = 3;
        const estimatedTokens = Math.ceil(totalChars / 4) + overhead;
        return {
            tokens: estimatedTokens,
            model,
            provider: this._provider,
            breakdown: {
                messages: Math.ceil(totalChars / 4),
                overhead,
            },
        };
    }
    /**
     * Create a conversation manager for multi-turn chat
     *
     * @param options - Conversation options
     */
    createConversation(options = {}) {
        return new conversation_1.Conversation(this, {
            model: 'gpt-5.2',
            ...options,
        });
    }
    // ===========================================================================
    // Video Generation (Sora-2)
    // ===========================================================================
    /**
     * Generate a video using Sora-2
     *
     * @param options - Video generation options
     * @returns Video job information
     */
    async generateVideo(options) {
        if (!this._client) {
            throw new errors_1.AIError('OpenAI client not initialized', this._provider);
        }
        const model = options.model || 'sora-2';
        const size = options.size || '1280x720';
        const seconds = options.seconds || 4;
        // Validate duration
        if (![4, 8, 12].includes(seconds)) {
            throw new errors_1.AIError('Video duration must be 4, 8, or 12 seconds', this._provider, 'INVALID_DURATION');
        }
        // Build form data for the request
        const formData = new FormData();
        formData.append('prompt', options.prompt);
        formData.append('model', model);
        formData.append('size', size);
        formData.append('seconds', seconds.toString());
        if (options.inputReference) {
            const blob = new Blob([options.inputReference], { type: 'image/jpeg' });
            formData.append('input_reference', blob, 'reference.jpg');
        }
        // Make request to videos endpoint
        const response = await fetch('https://api.openai.com/v1/videos', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this._client.apiKey}`,
            },
            body: formData,
        });
        if (!response.ok) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const error = await response.json().catch(() => ({}));
            throw new errors_1.AIError(error.error?.message || `Video generation failed: ${response.status}`, this._provider, error.error?.code, response.status);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = await response.json();
        return {
            id: data.id,
            status: data.status,
            prompt: options.prompt,
            model,
            size,
            seconds,
            createdAt: new Date(data.created_at * 1000),
            provider: this._provider,
        };
    }
    /**
     * Get the status and result of a video generation job
     *
     * @param videoId - The video job ID
     * @returns Video job information with URL if completed
     */
    async getVideo(videoId) {
        if (!this._client) {
            throw new errors_1.AIError('OpenAI client not initialized', this._provider);
        }
        const response = await fetch(`https://api.openai.com/v1/videos/${videoId}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${this._client.apiKey}`,
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const error = await response.json().catch(() => ({}));
            throw new errors_1.AIError(error.error?.message || `Failed to get video: ${response.status}`, this._provider, error.error?.code, response.status);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = await response.json();
        return {
            id: data.id,
            status: data.status,
            prompt: data.prompt,
            model: data.model,
            size: data.size,
            seconds: data.seconds,
            createdAt: new Date(data.created_at * 1000),
            completedAt: data.completed_at ? new Date(data.completed_at * 1000) : undefined,
            videoUrl: data.video_url,
            error: data.error,
            provider: this._provider,
        };
    }
    /**
     * Generate a video and wait for completion
     *
     * @param options - Video generation options
     * @param pollInterval - How often to check status (ms), default 5000
     * @param timeout - Maximum time to wait (ms), default 300000 (5 minutes)
     * @returns Completed video response
     */
    async generateVideoAndWait(options, pollInterval = 5000, timeout = 300000) {
        const job = await this.generateVideo(options);
        const startTime = Date.now();
        while (true) {
            const status = await this.getVideo(job.id);
            if (status.status === 'completed' && status.videoUrl) {
                return {
                    id: status.id,
                    status: status.status,
                    videoUrl: status.videoUrl,
                    duration: status.seconds,
                    size: status.size,
                    model: status.model,
                    provider: this._provider,
                };
            }
            if (status.status === 'failed') {
                throw new errors_1.AIError(status.error || 'Video generation failed', this._provider, 'VIDEO_GENERATION_FAILED');
            }
            if (Date.now() - startTime > timeout) {
                throw new errors_1.AIError('Video generation timed out', this._provider, 'VIDEO_GENERATION_TIMEOUT');
            }
            // Wait before polling again
            await new Promise((resolve) => setTimeout(resolve, pollInterval));
        }
    }
    /**
     * Download a generated video as a Buffer
     *
     * @param videoUrl - The URL of the generated video
     * @returns Video buffer
     */
    async downloadVideo(videoUrl) {
        const response = await fetch(videoUrl);
        if (!response.ok) {
            throw new errors_1.AIError(`Failed to download video: ${response.status}`, this._provider, 'VIDEO_DOWNLOAD_FAILED', response.status);
        }
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }
    /**
     * Generate a video and download it
     *
     * @param options - Video generation options
     * @param pollInterval - How often to check status (ms)
     * @param timeout - Maximum time to wait (ms)
     * @returns Video buffer
     */
    async generateVideoBuffer(options, pollInterval = 5000, timeout = 300000) {
        const video = await this.generateVideoAndWait(options, pollInterval, timeout);
        if (!video.videoUrl) {
            throw new errors_1.AIError('No video URL returned', this._provider, 'NO_VIDEO_URL');
        }
        return this.downloadVideo(video.videoUrl);
    }
    defaultModel() {
        return 'gpt-5.2';
    }
}
// =============================================================================
// Realtime Session for Voice Apps
// =============================================================================
/**
 * RealtimeSession - Manages bidirectional audio streaming with OpenAI
 */
class RealtimeSession {
    ws = null;
    apiKey;
    config;
    eventHandlers = new Map();
    constructor(apiKey, config = {}) {
        this.apiKey = apiKey;
        this.config = {
            model: config.model || 'gpt-realtime',
            voice: config.voice || 'alloy',
            inputAudioFormat: config.inputAudioFormat || 'pcm16',
            outputAudioFormat: config.outputAudioFormat || 'pcm16',
            ...config,
        };
    }
    /**
     * Connect to the realtime API
     */
    async connect() {
        return new Promise((resolve, reject) => {
            const url = `wss://api.openai.com/v1/realtime?model=${this.config.model}`;
            this.ws = new ws_1.default(url, {
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'OpenAI-Beta': 'realtime=v1',
                },
            });
            this.ws.on('open', () => {
                // Send session configuration
                this.send({
                    type: 'session.update',
                    session: {
                        voice: this.config.voice,
                        instructions: this.config.instructions,
                        input_audio_format: this.config.inputAudioFormat,
                        output_audio_format: this.config.outputAudioFormat,
                        input_audio_transcription: this.config.inputAudioTranscription,
                        turn_detection: this.config.turnDetection,
                        tools: this.config.tools?.map((tool) => ({
                            type: 'function',
                            name: tool.name,
                            description: tool.description,
                            parameters: tool.parameters,
                        })),
                        temperature: this.config.temperature,
                        max_response_output_tokens: this.config.maxOutputTokens,
                    },
                });
                resolve();
            });
            this.ws.on('message', (data) => {
                try {
                    const event = JSON.parse(data.toString());
                    this.emit(event.type, event);
                    this.emit('*', event); // Wildcard handler
                }
                catch (err) {
                    this.emit('error', { type: 'error', error: err });
                }
            });
            this.ws.on('error', (error) => {
                this.emit('error', { type: 'error', error });
                reject(error);
            });
            this.ws.on('close', () => {
                this.emit('close', { type: 'close' });
            });
        });
    }
    /**
     * Send an event to the server
     */
    send(event) {
        if (!this.ws || this.ws.readyState !== ws_1.default.OPEN) {
            throw new Error('WebSocket is not connected');
        }
        this.ws.send(JSON.stringify(event));
    }
    /**
     * Send audio data
     */
    sendAudio(audioData) {
        const base64 = Buffer.isBuffer(audioData) ? audioData.toString('base64') : audioData;
        this.send({
            type: 'input_audio_buffer.append',
            audio: base64,
        });
    }
    /**
     * Commit the audio buffer and trigger a response
     */
    commitAudio() {
        this.send({ type: 'input_audio_buffer.commit' });
    }
    /**
     * Send a text message
     */
    sendText(text) {
        this.send({
            type: 'conversation.item.create',
            item: {
                type: 'message',
                role: 'user',
                content: [{ type: 'input_text', text }],
            },
        });
        this.send({ type: 'response.create' });
    }
    /**
     * Cancel the current response
     */
    cancelResponse() {
        this.send({ type: 'response.cancel' });
    }
    /**
     * Clear the audio buffer
     */
    clearAudioBuffer() {
        this.send({ type: 'input_audio_buffer.clear' });
    }
    /**
     * Register an event handler
     */
    on(eventType, handler) {
        const handlers = this.eventHandlers.get(eventType) || [];
        handlers.push(handler);
        this.eventHandlers.set(eventType, handlers);
    }
    /**
     * Remove an event handler
     */
    off(eventType, handler) {
        const handlers = this.eventHandlers.get(eventType) || [];
        const index = handlers.indexOf(handler);
        if (index > -1) {
            handlers.splice(index, 1);
        }
    }
    /**
     * Emit an event to handlers
     */
    emit(eventType, event) {
        const handlers = this.eventHandlers.get(eventType) || [];
        for (const handler of handlers) {
            handler(event);
        }
    }
    /**
     * Close the connection
     */
    close() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
    /**
     * Check if connected
     */
    get isConnected() {
        return this.ws !== null && this.ws.readyState === ws_1.default.OPEN;
    }
}
exports.RealtimeSession = RealtimeSession;
exports.default = ChatGPT;
