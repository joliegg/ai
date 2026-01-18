import { BaseOpenAI } from './base-openai';
import { Message, CompletionOptions, ProviderConfig, TranscriptionOptions, TranscriptionResponse, TTSOptions, ModerationOptions, ModerationResult, FileUploadOptions, FileInfo, FileListResponse, ModelInfo, ModelListResponse, BatchRequest, BatchResponse, TokenCountResult, ConversationOptions, VideoGenerationOptions, VideoJob, VideoResponse, RealtimeSessionConfig, RealtimeEvent } from './types';
import { Conversation } from './conversation';
export type Size = '1024x1024' | '1024x1792' | '1792x1024' | '256x256' | '512x512' | '1536x1024' | '1024x1536' | 'auto';
export type Quality = 'auto' | 'low' | 'medium' | 'high' | 'standard' | 'hd';
export type OutputFormat = 'png' | 'jpeg' | 'webp';
export type Background = 'transparent' | 'opaque' | 'auto';
export type ImageGenerationModel = 'gpt-image-1.5' | 'gpt-image-1' | 'dall-e-3' | 'dall-e-2';
export interface GenerateOptions {
    prompt: string;
    n: number;
    size: Size;
    quality: Quality;
    format: OutputFormat;
    model: ImageGenerationModel;
    background: Background;
}
declare class ChatGPT extends BaseOpenAI {
    protected readonly _provider = "openai";
    constructor(apiKey?: string, config?: Partial<ProviderConfig>);
    get provider(): string;
    generate(options: GenerateOptions): Promise<Buffer[]>;
    /**
     * Create a realtime session for bidirectional audio streaming
     *
     * @param config - Session configuration
     * @returns RealtimeSession instance
     */
    createRealtimeSession(config?: RealtimeSessionConfig): RealtimeSession;
    /**
     * Transcribe audio to text using Whisper
     *
     * @param audio - Audio buffer or file path
     * @param options - Transcription options
     */
    transcribe(audio: Buffer | string, options?: TranscriptionOptions): Promise<TranscriptionResponse>;
    /**
     * Convert text to speech
     *
     * @param text - Text to convert to speech
     * @param options - TTS options
     * @returns Audio buffer
     */
    speak(text: string, options?: TTSOptions): Promise<Buffer>;
    /**
     * Check content for policy violations
     *
     * @param input - Text or array of texts to moderate
     * @param options - Moderation options
     */
    moderate(input: string | string[], options?: ModerationOptions): Promise<ModerationResult[]>;
    /**
     * Upload a file
     *
     * @param file - File buffer or path
     * @param options - Upload options
     */
    uploadFile(file: Buffer | string, options: FileUploadOptions): Promise<FileInfo>;
    /**
     * List uploaded files
     */
    listFiles(purpose?: string): Promise<FileListResponse>;
    /**
     * Delete a file
     */
    deleteFile(fileId: string): Promise<boolean>;
    /**
     * Retrieve file content
     */
    getFileContent(fileId: string): Promise<Buffer>;
    /**
     * List available models
     */
    listModels(): Promise<ModelListResponse>;
    /**
     * Get details for a specific model
     */
    getModel(modelId: string): Promise<ModelInfo>;
    /**
     * Infer model capabilities from its ID
     */
    private inferCapabilities;
    /**
     * Process multiple completion requests in parallel
     *
     * @param requests - Array of batch requests
     * @param options - Shared options for all requests
     * @param concurrency - Max concurrent requests (default: 5)
     */
    completeBatch(requests: BatchRequest[], options?: Partial<CompletionOptions>, concurrency?: number): Promise<BatchResponse[]>;
    /**
     * Estimate token count for messages
     *
     * Note: This is an approximation. For exact counts, use tiktoken library.
     *
     * @param messages - Messages to count
     * @param model - Model to use for estimation
     */
    countTokens(messages: Message[], model?: string): TokenCountResult;
    /**
     * Create a conversation manager for multi-turn chat
     *
     * @param options - Conversation options
     */
    createConversation(options?: ConversationOptions): Conversation;
    /**
     * Generate a video using Sora-2
     *
     * @param options - Video generation options
     * @returns Video job information
     */
    generateVideo(options: VideoGenerationOptions): Promise<VideoJob>;
    /**
     * Get the status and result of a video generation job
     *
     * @param videoId - The video job ID
     * @returns Video job information with URL if completed
     */
    getVideo(videoId: string): Promise<VideoJob>;
    /**
     * Generate a video and wait for completion
     *
     * @param options - Video generation options
     * @param pollInterval - How often to check status (ms), default 5000
     * @param timeout - Maximum time to wait (ms), default 300000 (5 minutes)
     * @returns Completed video response
     */
    generateVideoAndWait(options: VideoGenerationOptions, pollInterval?: number, timeout?: number): Promise<VideoResponse>;
    /**
     * Download a generated video as a Buffer
     *
     * @param videoUrl - The URL of the generated video
     * @returns Video buffer
     */
    downloadVideo(videoUrl: string): Promise<Buffer>;
    /**
     * Generate a video and download it
     *
     * @param options - Video generation options
     * @param pollInterval - How often to check status (ms)
     * @param timeout - Maximum time to wait (ms)
     * @returns Video buffer
     */
    generateVideoBuffer(options: VideoGenerationOptions, pollInterval?: number, timeout?: number): Promise<Buffer>;
    protected getDefaultModel(): string;
}
/**
 * RealtimeSession - Manages bidirectional audio streaming with OpenAI
 */
export declare class RealtimeSession {
    private ws;
    private apiKey;
    private config;
    private eventHandlers;
    constructor(apiKey: string, config?: RealtimeSessionConfig);
    /**
     * Connect to the realtime API
     */
    connect(): Promise<void>;
    /**
     * Send an event to the server
     */
    send(event: RealtimeEvent): void;
    /**
     * Send audio data
     */
    sendAudio(audioData: Buffer | string): void;
    /**
     * Commit the audio buffer and trigger a response
     */
    commitAudio(): void;
    /**
     * Send a text message
     */
    sendText(text: string): void;
    /**
     * Cancel the current response
     */
    cancelResponse(): void;
    /**
     * Clear the audio buffer
     */
    clearAudioBuffer(): void;
    /**
     * Register an event handler
     */
    on(eventType: string, handler: (event: RealtimeEvent) => void): void;
    /**
     * Remove an event handler
     */
    off(eventType: string, handler: (event: RealtimeEvent) => void): void;
    /**
     * Emit an event to handlers
     */
    private emit;
    /**
     * Close the connection
     */
    close(): void;
    /**
     * Check if connected
     */
    get isConnected(): boolean;
}
export default ChatGPT;
