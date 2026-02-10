import { BaseOpenAI } from './base-openai';
import {
  Message,
  CompletionOptions,
  ProviderConfig,
  TranscriptionOptions,
  TranscriptionResponse,
  TTSOptions,
  ModerationOptions,
  ModerationResult,
  ModerationCategory,
  FileUploadOptions,
  FileInfo,
  FileListResponse,
  ModelInfo,
  ModelListResponse,
  BatchRequest,
  BatchResponse,
  TokenCountResult,
  ConversationOptions,
  VideoGenerationOptions,
  VideoJob,
  VideoResponse,
  VideoStatus,
  RealtimeSessionConfig,
  RealtimeEvent,
} from './types';
import { AIError } from './errors';
import { Conversation } from './conversation';
import WebSocket from 'ws';
import * as fs from 'fs';

const ALLOWED_SIZES_V3 = ['1024x1024', '1024x1792', '1792x1024'];
const ALLOWED_SIZES_V2 = ['256x256', '512x512', '1024x1024'];
const ALLOWED_SIZES_GPT_IMAGE_1 = ['1024x1024', '1536x1024', '1024x1536', 'auto'];

const ALLOWED_QUALITIES_V3 = ['standard', 'hd'];
const ALLOWED_QUALITIES_V2 = ['standard'];
const ALLOWED_QUALITIES_GPT_IMAGE_1 = ['auto', 'low', 'medium', 'high'];

export type Size = '1024x1024' | '1024x1792' | '1792x1024' | '256x256' | '512x512' | '1536x1024' | '1024x1536' | 'auto';
export type Quality = 'auto' | 'low' | 'medium' | 'high' | 'standard' | 'hd';
export type OutputFormat = 'png' | 'jpeg' | 'webp';
export type Background = 'transparent' | 'opaque' | 'auto';

export type MODEL = 'gpt-5.2' | 'gpt-5.1' | 'gpt-5' | 'gpt-5-mini' | 'gpt-5-nano' | 'gpt-5.2-pro' | 'gpt-5-pro' | 'o3' | 'o3-mini' | 'o3-pro' | 'o4-mini' | 'o1' | 'o1-pro' | 'gpt-4.1' | 'gpt-4.1-mini' | 'gpt-4.1-nano' | 'gpt-4o' | 'gpt-4o-mini' | (string & {});
export type EMBEDDING_MODEL = 'text-embedding-3-large' | 'text-embedding-3-small' | 'text-embedding-ada-002' | (string & {});

export type ImageGenerationModel = 'gpt-image-1.5' | 'chatgpt-image-latest' | 'gpt-image-1' | 'gpt-image-1-mini' | 'dall-e-3' | 'dall-e-2';

export interface GenerateOptions {
  prompt: string;
  n: number;
  size: Size;
  quality: Quality;
  format: OutputFormat;
  model: ImageGenerationModel;
  background: Background;
}

class ChatGPT extends BaseOpenAI {
  protected readonly _provider = 'openai';

  constructor(apiKey?: string, config: Partial<ProviderConfig> = {}) {
    const resolvedApiKey = apiKey || process.env.OPENAI_API_KEY;
    super(resolvedApiKey, undefined, config);
  }

  async generate(options: GenerateOptions): Promise<Buffer[]> {
    const { n, size, model, quality } = options;

    if (!this._client) {
      throw new AIError('OpenAI client not initialized', this._provider);
    }

    if (model === 'gpt-image-1' || model === 'gpt-image-1.5') {
      if (ALLOWED_SIZES_GPT_IMAGE_1.includes(size) === false) {
        throw new AIError(
          `Size must be one of ${ALLOWED_SIZES_GPT_IMAGE_1.join(', ')}`,
          this._provider,
          'INVALID_SIZE'
        );
      }

      if (quality && ALLOWED_QUALITIES_GPT_IMAGE_1.includes(quality) === false) {
        throw new AIError(
          `Quality must be one of ${ALLOWED_QUALITIES_GPT_IMAGE_1.join(', ')}`,
          this._provider,
          'INVALID_QUALITY'
        );
      }
    }

    if (model === 'dall-e-2') {
      if (ALLOWED_SIZES_V2.includes(size) === false) {
        throw new AIError(`Size must be one of ${ALLOWED_SIZES_V2.join(', ')}`, this._provider, 'INVALID_SIZE');
      }

      if (quality && ALLOWED_QUALITIES_V2.includes(quality) === false) {
        throw new AIError(
          `Quality must be one of ${ALLOWED_QUALITIES_V2.join(', ')}`,
          this._provider,
          'INVALID_QUALITY'
        );
      }
    }

    if (model === 'dall-e-3') {
      if (n > 1) {
        throw new AIError('DALL-E 3 only supports generating 1 image at a time.', this._provider, 'INVALID_COUNT');
      }

      if (ALLOWED_SIZES_V3.includes(size) === false) {
        throw new AIError(`Size must be one of ${ALLOWED_SIZES_V3.join(', ')}`, this._provider, 'INVALID_SIZE');
      }

      if (quality && ALLOWED_QUALITIES_V3.includes(quality) === false) {
        throw new AIError(
          `Quality must be one of ${ALLOWED_QUALITIES_V3.join(', ')}`,
          this._provider,
          'INVALID_QUALITY'
        );
      }
    }

    if (n > 10) {
      throw new AIError('Cannot generate more than 10 images at once.', this._provider, 'INVALID_COUNT');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return super.generate(options as any);
  }

  /**
   * Create a realtime session for bidirectional audio streaming
   *
   * @param config - Session configuration
   * @returns RealtimeSession instance
   */
  createRealtimeSession(config: RealtimeSessionConfig = {}): RealtimeSession {
    if (!this._client) {
      throw new AIError('OpenAI client not initialized', this._provider);
    }

    return new RealtimeSession(this._client.apiKey, config);
  }

  /**
   * Transcribe audio to text using Whisper
   *
   * @param audio - Audio buffer or file path
   * @param options - Transcription options
   */
  async transcribe(audio: Buffer | string, options: TranscriptionOptions = {}): Promise<TranscriptionResponse> {
    if (!this._client) {
      throw new AIError('OpenAI client not initialized', this._provider);
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
    const verboseResponse = response as any;

    return {
      text: response.text,
      language: verboseResponse.language,
      duration: verboseResponse.duration,
      segments: verboseResponse.segments?.map((s: { id: number; start: number; end: number; text: string }) => ({
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
  async speak(text: string, options: TTSOptions = {}): Promise<Buffer> {
    if (!this._client) {
      throw new AIError('OpenAI client not initialized', this._provider);
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
  async moderate(input: string | string[], options: ModerationOptions = {}): Promise<ModerationResult[]> {
    if (!this._client) {
      throw new AIError('OpenAI client not initialized', this._provider);
    }

    const response = await this._client.moderations.create({
      input,
      model: options.model || 'omni-moderation-latest',
    });

    return response.results.map((result, index) => {
      const createCategory = (key: string): ModerationCategory => ({
        flagged: result.categories[key as keyof typeof result.categories] as boolean,
        score: result.category_scores[key as keyof typeof result.category_scores] as number,
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
  async uploadFile(file: Buffer | string, options: FileUploadOptions): Promise<FileInfo> {
    if (!this._client) {
      throw new AIError('OpenAI client not initialized', this._provider);
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
  async listFiles(purpose?: string): Promise<FileListResponse> {
    if (!this._client) {
      throw new AIError('OpenAI client not initialized', this._provider);
    }

    const response = await this._client.files.list({
      purpose: purpose as 'assistants' | 'fine-tune' | 'batch' | 'vision' | undefined,
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
  async deleteFile(fileId: string): Promise<boolean> {
    if (!this._client) {
      throw new AIError('OpenAI client not initialized', this._provider);
    }

    const response = await this._client.files.delete(fileId);
    return response.deleted;
  }

  /**
   * Retrieve file content
   */
  async getFileContent(fileId: string): Promise<Buffer> {
    if (!this._client) {
      throw new AIError('OpenAI client not initialized', this._provider);
    }

    const response = await this._client.files.content(fileId);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * List available models
   */
  async listModels(): Promise<ModelListResponse> {
    if (!this._client) {
      throw new AIError('OpenAI client not initialized', this._provider);
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
  async getModel(modelId: string): Promise<ModelInfo> {
    if (!this._client) {
      throw new AIError('OpenAI client not initialized', this._provider);
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
  private inferCapabilities(modelId: string): ModelInfo['capabilities'] {
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
  async completeBatch(
    requests: BatchRequest[],
    options: Partial<CompletionOptions> = {},
    concurrency: number = 5
  ): Promise<BatchResponse[]> {
    const results: BatchResponse[] = [];
    const queue = [...requests];

    const processRequest = async (request: BatchRequest): Promise<BatchResponse> => {
      try {
        const response = await this.complete(request.messages, {
          ...options,
          ...request.options,
        });
        return { id: request.id, response };
      } catch (error) {
        return { id: request.id, error: error as Error };
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
  countTokens(messages: Message[], model: string = 'gpt-5.2'): TokenCountResult {
    // Rough estimation: ~4 chars per token on average
    // This is a simplified approximation
    let totalChars = 0;

    for (const message of messages) {
      if (typeof message.content === 'string') {
        totalChars += message.content.length;
      } else if (Array.isArray(message.content)) {
        for (const part of message.content) {
          if (typeof part === 'string') {
            totalChars += part.length;
          } else if ('text' in part && part.type === 'text') {
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
  createConversation(options: ConversationOptions = {}): Conversation {
    return new Conversation(this, {
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
  async generateVideo(options: VideoGenerationOptions): Promise<VideoJob> {
    if (!this._client) {
      throw new AIError('OpenAI client not initialized', this._provider);
    }

    const model = options.model || 'sora-2';
    const size = options.size || '1280x720';
    const seconds = options.seconds || 4;

    // Validate duration
    if (![4, 8, 12].includes(seconds)) {
      throw new AIError('Video duration must be 4, 8, or 12 seconds', this._provider, 'INVALID_DURATION');
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
      const error: any = await response.json().catch(() => ({}));
      throw new AIError(
        error.error?.message || `Video generation failed: ${response.status}`,
        this._provider,
        error.error?.code,
        response.status
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await response.json();

    return {
      id: data.id,
      status: data.status as VideoStatus,
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
  async getVideo(videoId: string): Promise<VideoJob> {
    if (!this._client) {
      throw new AIError('OpenAI client not initialized', this._provider);
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
      const error: any = await response.json().catch(() => ({}));
      throw new AIError(
        error.error?.message || `Failed to get video: ${response.status}`,
        this._provider,
        error.error?.code,
        response.status
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await response.json();

    return {
      id: data.id,
      status: data.status as VideoStatus,
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
  async generateVideoAndWait(
    options: VideoGenerationOptions,
    pollInterval: number = 5000,
    timeout: number = 300000
  ): Promise<VideoResponse> {
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
        throw new AIError(status.error || 'Video generation failed', this._provider, 'VIDEO_GENERATION_FAILED');
      }

      if (Date.now() - startTime > timeout) {
        throw new AIError('Video generation timed out', this._provider, 'VIDEO_GENERATION_TIMEOUT');
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
  async downloadVideo(videoUrl: string): Promise<Buffer> {
    const response = await fetch(videoUrl);

    if (!response.ok) {
      throw new AIError(
        `Failed to download video: ${response.status}`,
        this._provider,
        'VIDEO_DOWNLOAD_FAILED',
        response.status
      );
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
  async generateVideoBuffer(
    options: VideoGenerationOptions,
    pollInterval: number = 5000,
    timeout: number = 300000
  ): Promise<Buffer> {
    const video = await this.generateVideoAndWait(options, pollInterval, timeout);

    if (!video.videoUrl) {
      throw new AIError('No video URL returned', this._provider, 'NO_VIDEO_URL');
    }

    return this.downloadVideo(video.videoUrl);
  }

  protected defaultModel(): MODEL {
    return 'gpt-5.2';
  }
}

// =============================================================================
// Realtime Session for Voice Apps
// =============================================================================

/**
 * RealtimeSession - Manages bidirectional audio streaming with OpenAI
 */
export class RealtimeSession {
  private ws: WebSocket | null = null;
  private apiKey: string;
  private config: RealtimeSessionConfig;
  private eventHandlers: Map<string, ((event: RealtimeEvent) => void)[]> = new Map();

  constructor(apiKey: string, config: RealtimeSessionConfig = {}) {
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
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `wss://api.openai.com/v1/realtime?model=${this.config.model}`;

      this.ws = new WebSocket(url, {
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
          const event = JSON.parse(data.toString()) as RealtimeEvent;
          this.emit(event.type, event);
          this.emit('*', event); // Wildcard handler
        } catch (err) {
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
  send(event: RealtimeEvent): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    this.ws.send(JSON.stringify(event));
  }

  /**
   * Send audio data
   */
  sendAudio(audioData: Buffer | string): void {
    const base64 = Buffer.isBuffer(audioData) ? audioData.toString('base64') : audioData;

    this.send({
      type: 'input_audio_buffer.append',
      audio: base64,
    });
  }

  /**
   * Commit the audio buffer and trigger a response
   */
  commitAudio(): void {
    this.send({ type: 'input_audio_buffer.commit' });
  }

  /**
   * Send a text message
   */
  sendText(text: string): void {
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
  cancelResponse(): void {
    this.send({ type: 'response.cancel' });
  }

  /**
   * Clear the audio buffer
   */
  clearAudioBuffer(): void {
    this.send({ type: 'input_audio_buffer.clear' });
  }

  /**
   * Register an event handler
   */
  on(eventType: string, handler: (event: RealtimeEvent) => void): void {
    const handlers = this.eventHandlers.get(eventType) || [];
    handlers.push(handler);
    this.eventHandlers.set(eventType, handlers);
  }

  /**
   * Remove an event handler
   */
  off(eventType: string, handler: (event: RealtimeEvent) => void): void {
    const handlers = this.eventHandlers.get(eventType) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  /**
   * Emit an event to handlers
   */
  private emit(eventType: string, event: RealtimeEvent): void {
    const handlers = this.eventHandlers.get(eventType) || [];
    for (const handler of handlers) {
      handler(event);
    }
  }

  /**
   * Close the connection
   */
  close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Check if connected
   */
  get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export default ChatGPT;
