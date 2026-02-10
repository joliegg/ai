import { BaseOpenAI } from './base-openai';
import { ProviderConfig, VideoStatus } from './types';
export type MODEL = 'grok-4-1-fast-reasoning' | 'grok-4-1-fast-non-reasoning' | 'grok-4-fast-reasoning' | 'grok-4-fast-non-reasoning' | 'grok-4-0709' | 'grok-code-fast-1' | 'grok-3' | 'grok-3-mini' | 'grok-2-vision-1212' | (string & {});
export type OutputFormat = 'png' | 'jpeg' | 'webp';
export type ImageGenerationModel = 'grok-imagine-image' | 'grok-2-image-1212' | (string & {});
export type VideoGenerationModel = 'grok-imagine-video' | (string & {});
export interface GenerateOptions {
    prompt: string;
    n: number;
    model: ImageGenerationModel;
}
export type GrokVideoAspectRatio = '16:9' | '4:3' | '1:1' | '9:16' | '3:4' | '3:2' | '2:3';
export type GrokVideoResolution = '720p' | '480p';
export interface GrokVideoGenerationOptions {
    prompt: string;
    model?: VideoGenerationModel;
    duration?: number;
    aspectRatio?: GrokVideoAspectRatio;
    resolution?: GrokVideoResolution;
    imageUrl?: string;
}
export interface GrokVideoJob {
    id: string;
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
declare class Grok extends BaseOpenAI {
    protected readonly _provider = "grok";
    constructor(apiKey?: string, config?: Partial<ProviderConfig>);
    protected defaultModel(): MODEL;
    /**
     * Generate images using Grok's image generation models
     *
     * @param options - Image generation options
     *
     * @returns Promise<Buffer[]> - Array of image buffer
     *
     */
    generate(options: GenerateOptions): Promise<Buffer[]>;
    /**
     * Generate a video using Grok's video generation models
     *
     * @param options - Video generation options
     * @returns Video job information
     */
    generateVideo(options: GrokVideoGenerationOptions): Promise<GrokVideoJob>;
    /**
     * Get the status and result of a video generation job
     *
     * @param videoId - The video job ID (request_id)
     * @returns Video job information with URL if completed
     */
    getVideo(videoId: string): Promise<GrokVideoJob>;
    /**
     * Generate a video and wait for completion
     *
     * @param options - Video generation options
     * @param pollInterval - How often to check status (ms), default 5000
     * @param timeout - Maximum time to wait (ms), default 300000 (5 minutes)
     * @returns Completed video response
     */
    generateVideoAndWait(options: GrokVideoGenerationOptions, pollInterval?: number, timeout?: number): Promise<GrokVideoResponse>;
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
    generateVideoBuffer(options: GrokVideoGenerationOptions, pollInterval?: number, timeout?: number): Promise<Buffer>;
}
export default Grok;
