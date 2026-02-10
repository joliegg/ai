import { ProviderConfig, getGlobalConfig } from './types';
import { AIError } from './errors';
import { withRetry, withTimeout } from './utils';

export type Style =
  | '3d-model'
  | 'analog-film'
  | 'anime'
  | 'cinematic'
  | 'comic-book'
  | 'digital-art'
  | 'enhance'
  | 'fantasy-art'
  | 'isometric'
  | 'line-art'
  | 'low-poly'
  | 'modeling-compound'
  | 'neon-punk'
  | 'origami'
  | 'photographic'
  | 'pixel-art'
  | 'tile-texture';

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

  // These are only supported by the SD3 engine
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

class Dream {
  private _apiKey?: string;
  private _engine?: Engine;
  private _config: ProviderConfig;
  private readonly _provider = 'stability';

  constructor(apiKey: string, engine: Engine = 'ultra', config: Partial<ProviderConfig> = {}) {
    this._apiKey = apiKey;
    this._engine = engine;

    this._config = {
      apiKey,
      timeout: config.timeout ?? getGlobalConfig().timeout,
      maxRetries: config.maxRetries ?? getGlobalConfig().maxRetries,
      retryDelay: config.retryDelay ?? getGlobalConfig().retryDelay,
      debug: config.debug ?? getGlobalConfig().debug,
    };
  }

  /**
   * Generate an image from a text prompt
   *
   * @param options - Generation options
   *
   * @returns Buffer containing the generated image
   */
  async generate(options: GenerateOptions): Promise<Buffer> {
    const {
      prompt,
      aspectRatio = '1:1',
      style = null,
      seed,
      negativePrompt,
      outputFormat = 'png',
      cfgScale,
      model,
    } = options;

    const formData = new FormData();

    formData.append('prompt', prompt);

    if (aspectRatio !== '1:1') {
      formData.append('aspect_ratio', aspectRatio);
    }

    if (style) {
      formData.append('style_preset', style);
    }

    if (seed !== undefined && seed !== null) {
      formData.append('seed', seed.toString());
    }

    if (negativePrompt) {
      formData.append('negative_prompt', negativePrompt);
    }

    if (outputFormat !== 'png') {
      formData.append('output_format', outputFormat);
    }

    // SD3-specific parameters
    if (this._engine === 'sd3') {
      if (cfgScale !== undefined && cfgScale !== null) {
        formData.append('cfg_scale', cfgScale.toString());
      }

      if (model) {
        formData.append('model', model);
      }
    }

    const fn = async (): Promise<Buffer> => {
      const response = await fetch(
        `https://api.stability.ai/v2beta/stable-image/generate/${this._engine}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this._apiKey}`,
            Accept: 'image/*',
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        throw new AIError(
          `Stability API error: ${response.status} ${errorBody}`,
          this._provider,
          undefined,
          response.status
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    };

    const timeout = this._config.timeout ?? 60000;

    return withRetry(() => withTimeout(fn, timeout, this._provider), this._provider, {
      maxRetries: this._config.maxRetries,
      retryDelay: this._config.retryDelay,
    });
  }

  /**
   * Generate an image from a text prompt and starting image
   *
   * @param options - Image-to-image generation options
   *
   * @returns Buffer containing the generated image
   */
  async generateFromImage(options: ImageToImageOptions): Promise<Buffer> {
    const {
      image,
      prompt,
      strength = 0.35,
      aspectRatio = '1:1',
      style = null,
      seed,
      negativePrompt,
      outputFormat = 'png',
      cfgScale,
      model,
    } = options;

    const formData = new FormData();

    formData.append('prompt', prompt);
    formData.append('image', new Blob([image], { type: 'image/png' }), 'input_image.png');

    if (typeof strength === 'number') {
      formData.append('strength', strength.toString());
    }

    if (aspectRatio !== '1:1') {
      formData.append('aspect_ratio', aspectRatio);
    }

    if (style) {
      formData.append('style_preset', style);
    }

    if (seed !== undefined && seed !== null) {
      formData.append('seed', seed.toString());
    }

    if (negativePrompt) {
      formData.append('negative_prompt', negativePrompt);
    }

    if (outputFormat !== 'png') {
      formData.append('output_format', outputFormat);
    }

    // SD3-specific parameters
    if (this._engine === 'sd3') {
      formData.append('mode', 'image-to-image');

      if (cfgScale !== undefined && cfgScale !== null) {
        formData.append('cfg_scale', cfgScale.toString());
      }

      if (model) {
        formData.append('model', model);
      }
    }

    const fn = async (): Promise<Buffer> => {
      const response = await fetch(
        `https://api.stability.ai/v2beta/stable-image/generate/${this._engine}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this._apiKey}`,
            Accept: 'image/*',
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        throw new AIError(
          `Stability API error: ${response.status} ${errorBody}`,
          this._provider,
          undefined,
          response.status
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    };

    const timeout = this._config.timeout ?? 60000;

    return withRetry(() => withTimeout(fn, timeout, this._provider), this._provider, {
      maxRetries: this._config.maxRetries,
      retryDelay: this._config.retryDelay,
    });
  }
}

export default Dream;
