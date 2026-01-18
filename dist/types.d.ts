export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';
export interface TextContent {
    type: 'text';
    text: string;
}
export interface ImageContent {
    type: 'image';
    source: {
        type: 'base64' | 'url';
        mediaType?: string;
        data: string;
    };
}
export interface AudioContent {
    type: 'audio';
    source: {
        type: 'base64' | 'url';
        mediaType?: string;
        data: string;
    };
}
export interface VideoContent {
    type: 'video';
    source: {
        type: 'base64' | 'url';
        mediaType?: string;
        data: string;
    };
}
export interface DocumentContent {
    type: 'document';
    source: {
        type: 'base64' | 'url';
        mediaType?: string;
        data: string;
        filename?: string;
    };
}
export interface ToolUseContent {
    type: 'tool_use';
    id: string;
    name: string;
    input: Record<string, unknown>;
}
export interface ToolResultContent {
    type: 'tool_result';
    toolUseId: string;
    content: string;
}
export type MessageContent = string | TextContent | ImageContent | AudioContent | VideoContent | DocumentContent | ToolUseContent | ToolResultContent;
export interface Message {
    role: MessageRole;
    content: MessageContent | MessageContent[];
    name?: string;
}
export interface ToolParameter {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description?: string;
    enum?: string[];
    items?: ToolParameter;
    properties?: Record<string, ToolParameter>;
    required?: string[];
}
export interface ToolDefinition {
    name: string;
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, ToolParameter>;
        required?: string[];
    };
}
export interface ToolCall {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
}
export interface CompletionOptions {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    stop?: string | string[];
    tools?: ToolDefinition[];
    toolChoice?: 'auto' | 'none' | 'required' | {
        name: string;
    };
    responseFormat?: 'text' | 'json';
    timeout?: number;
    searchGrounding?: boolean;
    codeExecution?: boolean;
    reasoning?: {
        effort?: 'low' | 'medium' | 'high';
        budget?: number;
    };
}
export interface StreamOptions extends CompletionOptions {
    onToken?: (token: string) => void;
    onToolCall?: (toolCall: ToolCall) => void;
}
export type FinishReason = 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'error';
export interface Response {
    id: string;
    provider: string;
    model: string;
    content: string | null;
    toolCalls?: ToolCall[];
    finishReason: FinishReason;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    raw?: unknown;
}
export interface Chunk {
    id: string;
    provider: string;
    model: string;
    delta: {
        content?: string;
        toolCalls?: Partial<ToolCall>[];
    };
    finishReason?: FinishReason;
}
export interface ImageGenerationOptions {
    prompt: string;
    n?: number;
    size?: string;
    quality?: string;
    style?: string;
    format?: string;
    negativePrompt?: string;
    seed?: number;
}
export interface ImageResponse {
    data: Buffer[];
    provider: string;
    model?: string;
}
export interface EmbeddingOptions {
    model?: string;
    dimensions?: number;
}
export interface EmbeddingResponse {
    embeddings: number[][];
    model: string;
    provider: string;
    usage?: {
        promptTokens: number;
        totalTokens: number;
    };
}
export interface ProviderConfig {
    apiKey?: string;
    baseURL?: string;
    timeout?: number;
    maxRetries?: number;
    retryDelay?: number;
    debug?: boolean;
}
export interface AIProvider {
    readonly provider: string;
    /**
     * Generate a chat completion
     */
    complete(messages: Message[], options?: CompletionOptions): Promise<Response>;
    /**
     * Generate a streaming chat completion
     */
    stream?(messages: Message[], options?: StreamOptions): AsyncIterable<Chunk>;
    /**
     * Generate embeddings for text
     */
    embed?(input: string | string[], options?: EmbeddingOptions): Promise<EmbeddingResponse>;
}
export interface ImageGenerationProvider {
    readonly provider: string;
    /**
     * Generate images from a prompt
     */
    generate(options: ImageGenerationOptions): Promise<Buffer | Buffer[]>;
}
export type AudioResponseFormat = 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
export type TTSVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
export type TTSModel = 'tts-1' | 'tts-1-hd';
export interface TranscriptionOptions {
    model?: string;
    language?: string;
    prompt?: string;
    responseFormat?: AudioResponseFormat;
    temperature?: number;
}
export interface TranscriptionResponse {
    text: string;
    language?: string;
    duration?: number;
    segments?: Array<{
        id: number;
        start: number;
        end: number;
        text: string;
    }>;
    provider: string;
}
export interface TTSOptions {
    model?: TTSModel;
    voice?: TTSVoice;
    speed?: number;
    responseFormat?: 'mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm';
}
export interface ModerationOptions {
    model?: string;
}
export interface ModerationCategory {
    flagged: boolean;
    score: number;
}
export interface ModerationResult {
    id: string;
    flagged: boolean;
    categories: {
        hate: ModerationCategory;
        hateThreatening: ModerationCategory;
        harassment: ModerationCategory;
        harassmentThreatening: ModerationCategory;
        selfHarm: ModerationCategory;
        selfHarmIntent: ModerationCategory;
        selfHarmInstructions: ModerationCategory;
        sexual: ModerationCategory;
        sexualMinors: ModerationCategory;
        violence: ModerationCategory;
        violenceGraphic: ModerationCategory;
    };
    provider: string;
}
export type FilePurpose = 'assistants' | 'fine-tune' | 'batch' | 'vision';
export interface FileUploadOptions {
    purpose: FilePurpose;
}
export interface FileInfo {
    id: string;
    filename: string;
    bytes: number;
    createdAt: Date;
    purpose: string;
    provider: string;
}
export interface FileListResponse {
    files: FileInfo[];
    provider: string;
}
export interface ModelInfo {
    id: string;
    name?: string;
    description?: string;
    created?: Date;
    ownedBy?: string;
    contextWindow?: number;
    maxOutputTokens?: number;
    capabilities?: {
        chat?: boolean;
        completion?: boolean;
        embedding?: boolean;
        image?: boolean;
        audio?: boolean;
        vision?: boolean;
        functionCalling?: boolean;
    };
}
export interface ModelListResponse {
    models: ModelInfo[];
    provider: string;
}
export interface BatchRequest<T = CompletionOptions> {
    id: string;
    messages: Message[];
    options?: T;
}
export interface BatchResponse<T = Response> {
    id: string;
    response?: T;
    error?: Error;
}
export interface ConversationOptions {
    systemPrompt?: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
    maxHistory?: number;
}
export type VideoModel = 'sora-2' | 'sora-2-pro';
export type VideoDuration = 4 | 8 | 12;
export type VideoSize = '1280x720' | '720x1280' | '1920x1080' | '1080x1920' | '1280x1280';
export type VideoStatus = 'pending' | 'processing' | 'completed' | 'failed';
export interface VideoGenerationOptions {
    prompt: string;
    model?: VideoModel;
    size?: VideoSize;
    seconds?: VideoDuration;
    inputReference?: Buffer;
}
export interface VideoJob {
    id: string;
    status: VideoStatus;
    prompt: string;
    model: string;
    size: string;
    seconds: number;
    createdAt: Date;
    completedAt?: Date;
    videoUrl?: string;
    error?: string;
    provider: string;
}
export interface VideoResponse {
    id: string;
    status: VideoStatus;
    videoUrl?: string;
    videoBuffer?: Buffer;
    duration: number;
    size: string;
    model: string;
    provider: string;
}
export interface TokenCountResult {
    tokens: number;
    model: string;
    provider: string;
    breakdown?: {
        messages: number;
        functions?: number;
        overhead?: number;
    };
}
export type RealtimeVoice = 'alloy' | 'echo' | 'shimmer' | 'ash' | 'ballad' | 'coral' | 'sage' | 'verse';
export interface RealtimeSessionConfig {
    model?: string;
    voice?: RealtimeVoice;
    instructions?: string;
    inputAudioFormat?: 'pcm16' | 'g711_ulaw' | 'g711_alaw';
    outputAudioFormat?: 'pcm16' | 'g711_ulaw' | 'g711_alaw';
    inputAudioTranscription?: {
        model?: string;
    };
    turnDetection?: {
        type: 'server_vad' | 'none';
        threshold?: number;
        prefixPaddingMs?: number;
        silenceDurationMs?: number;
    };
    tools?: ToolDefinition[];
    temperature?: number;
    maxOutputTokens?: number | 'inf';
}
export interface RealtimeEvent {
    type: string;
    event_id?: string;
    [key: string]: any;
}
export type ImagenModel = 'imagen-3.0-generate-001' | 'imagen-3.0-fast-generate-001';
export type ImagenAspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
export interface ImagenOptions {
    prompt: string;
    model?: ImagenModel;
    numberOfImages?: number;
    aspectRatio?: ImagenAspectRatio;
    negativePrompt?: string;
    personGeneration?: 'dont_allow' | 'allow_adult';
    safetyFilterLevel?: 'block_low_and_above' | 'block_medium_and_above' | 'block_only_high';
    addWatermark?: boolean;
}
export interface ImagenResponse {
    images: Buffer[];
    provider: string;
    model: string;
}
export interface GlobalConfig {
    timeout?: number;
    maxRetries?: number;
    retryDelay?: number;
    debug?: boolean;
}
export declare function configure(config: Partial<GlobalConfig>): void;
export declare function getGlobalConfig(): GlobalConfig;
