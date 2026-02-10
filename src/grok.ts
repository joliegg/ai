import { BaseOpenAI } from './base-openai';
import { ProviderConfig, VideoStatus } from './types';
import { AIError } from './errors';

export type MODEL = 'grok-4-1-fast-reasoning' | 'grok-4-1-fast-non-reasoning' | 'grok-4-fast-reasoning' | 'grok-4-fast-non-reasoning' | 'grok-4-0709' | 'grok-code-fast-1' | 'grok-3' | 'grok-3-mini' | 'grok-2-vision-1212' | (string & {});

export type OutputFormat = 'png' | 'jpeg' | 'webp';

export type ImageGenerationModel = 'grok-imagine-image' | 'grok-2-image-1212' | (string & {});
export type VideoGenerationModel = 'grok-imagine-video' | (string & {});

export interface GenerateOptions {
  prompt: string;
  n: number; // Max is 10
  model: ImageGenerationModel;
}

export type GrokVideoAspectRatio = '16:9' | '4:3' | '1:1' | '9:16' | '3:4' | '3:2' | '2:3';
export type GrokVideoResolution = '720p' | '480p';

export interface GrokVideoGenerationOptions {
  prompt: string;
  model?: VideoGenerationModel;
  duration?: number;              // 1-15 seconds
  aspectRatio?: GrokVideoAspectRatio;
  resolution?: GrokVideoResolution;
  imageUrl?: string;              // for image-to-video
}

export interface GrokVideoJob {
  id: string;                     // from response.request_id
  status: VideoStatus;
  prompt: string;
  model: string;
  aspectRatio?: string;
  resolution?: string;
  duration?: number;
  videoUrl?: string;
  error?: string;
  provider: string;
}

export interface GrokVideoResponse {
  id: string;
  status: VideoStatus;
  videoUrl?: string;
  duration?: number;
  aspectRatio?: string;
  resolution?: string;
  model: string;
  provider: string;
}

class Grok extends BaseOpenAI {
  protected readonly _provider = 'grok';

  constructor(apiKey?: string, config: Partial<ProviderConfig> = {}) {
    const resolvedApiKey = apiKey || process.env.GROK_API_KEY;
    super(resolvedApiKey, 'https://api.x.ai/v1', config);
  }

  protected defaultModel(): MODEL {
    return 'grok-4-1-fast-reasoning';
  }



  /**
   * Generate images using Grok's image generation models
   *
   * @param options - Image generation options
   *
   * @returns Promise<Buffer[]> - Array of image buffer
   *
   */
  async generate(options: GenerateOptions): Promise<Buffer[]> {
    const { n } = options;

    if (n > 10) {
      throw new AIError('Cannot generate more than 10 images at once.', this._provider, 'INVALID_COUNT');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return super.generate(options as any);
  }

  // ===========================================================================
  // Video Generation
  // ===========================================================================

  /**
   * Generate a video using Grok's video generation models
   *
   * @param options - Video generation options
   * @returns Video job information
   */
  async generateVideo(options: GrokVideoGenerationOptions): Promise<GrokVideoJob> {
    if (!this._client) {
      throw new AIError('Grok client not initialized', this._provider);
    }

    const model = options.model || 'grok-imagine-video';
    const duration = options.duration;

    // Validate duration
    if (duration !== undefined && (duration < 1 || duration > 15)) {
      throw new AIError('Video duration must be between 1 and 15 seconds', this._provider, 'INVALID_DURATION');
    }

    // Build JSON body
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = {
      prompt: options.prompt,
      model,
    };

    if (duration !== undefined) body.duration = duration;
    if (options.aspectRatio) body.aspect_ratio = options.aspectRatio;
    if (options.resolution) body.resolution = options.resolution;
    if (options.imageUrl) body.image_url = options.imageUrl;

    const response = await fetch('https://api.x.ai/v1/videos/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this._client.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
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
      id: data.request_id,
      status: (data.status as VideoStatus) || 'pending',
      prompt: options.prompt,
      model,
      aspectRatio: options.aspectRatio,
      resolution: options.resolution,
      duration,
      provider: this._provider,
    };
  }

  /**
   * Get the status and result of a video generation job
   *
   * @param videoId - The video job ID (request_id)
   * @returns Video job information with URL if completed
   */
  async getVideo(videoId: string): Promise<GrokVideoJob> {
    if (!this._client) {
      throw new AIError('Grok client not initialized', this._provider);
    }

    const response = await fetch(`https://api.x.ai/v1/videos/${videoId}`, {
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
      id: data.request_id,
      status: data.status as VideoStatus,
      prompt: data.prompt,
      model: data.model,
      aspectRatio: data.aspect_ratio,
      resolution: data.resolution,
      duration: data.duration,
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
    options: GrokVideoGenerationOptions,
    pollInterval: number = 5000,
    timeout: number = 300000
  ): Promise<GrokVideoResponse> {
    const job = await this.generateVideo(options);

    const startTime = Date.now();

    while (true) {
      const status = await this.getVideo(job.id);

      if (status.status === 'completed' && status.videoUrl) {
        return {
          id: status.id,
          status: status.status,
          videoUrl: status.videoUrl,
          duration: status.duration,
          aspectRatio: status.aspectRatio,
          resolution: status.resolution,
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
    options: GrokVideoGenerationOptions,
    pollInterval: number = 5000,
    timeout: number = 300000
  ): Promise<Buffer> {
    const video = await this.generateVideoAndWait(options, pollInterval, timeout);

    if (!video.videoUrl) {
      throw new AIError('No video URL returned', this._provider, 'NO_VIDEO_URL');
    }

    return this.downloadVideo(video.videoUrl);
  }
}

export default Grok;
