import { ProviderConfig } from './types';
export type Style = '3d-model' | 'analog-film' | 'anime' | 'cinematic' | 'comic-book' | 'digital-art' | 'enhance' | 'fantasy-art' | 'isometric' | 'line-art' | 'low-poly' | 'modeling-compound' | 'neon-punk' | 'origami' | 'photographic' | 'pixel-art' | 'tile-texture';
export type AspectRatio = '16:9' | '1:1' | '21:9' | '2:3' | '3:2' | '4:5' | '5:4' | '9:16' | '9:21';
export type OutputFormat = 'png' | 'jpeg' | 'webp';
export type Engine = 'ultra' | 'core' | 'sd3';
export type SD3_Engine = 'sd3.5-large' | 'sd3.5-large-turbo' | 'sd3.5-medium';
export interface GenerateOptions {
    prompt: string;
    aspectRatio?: AspectRatio;
    style?: Style;
    seed?: number;
    negativePrompt?: string;
    outputFormat?: OutputFormat;
    cfgScale?: number;
    model?: SD3_Engine;
}
export interface ImageToImageOptions extends GenerateOptions {
    image: Buffer;
    strength?: number;
}
export interface DreamResponse {
    image?: string;
    finish_reason: string;
    seed: number;
}
declare class Dream {
    private _apiKey?;
    private _engine?;
    private _config;
    private readonly _provider;
    constructor(apiKey: string, engine?: Engine, config?: Partial<ProviderConfig>);
    /**
     * Generate an image from a text prompt
     *
     * @param options - Generation options
     *
     * @returns Buffer containing the generated image
     */
    generate(options: GenerateOptions): Promise<Buffer>;
    /**
     * Generate an image from a text prompt and starting image
     *
     * @param options - Image-to-image generation options
     *
     * @returns Buffer containing the generated image
     */
    generateFromImage(options: ImageToImageOptions): Promise<Buffer>;
}
export default Dream;
