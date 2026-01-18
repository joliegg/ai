import axios from 'axios';
import FormData from 'form-data';

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

  constructor(apiKey: string, engine: Engine = 'ultra') {
    this._apiKey = apiKey;
    this._engine = engine;
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

    const { data } = await axios.post(
      `https://api.stability.ai/v2beta/stable-image/generate/${this._engine}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${this._apiKey}`,
          Accept: 'image/*',
          ...formData.getHeaders(),
        },
        responseType: 'arraybuffer',
      }
    );

    return Buffer.from(data);
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
    formData.append('image', image, { filename: 'input_image.png', contentType: 'image/png' });

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

    const { data } = await axios.post(
      `https://api.stability.ai/v2beta/stable-image/generate/${this._engine}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${this._apiKey}`,
          Accept: 'image/*',
          ...formData.getHeaders(),
        },
        responseType: 'arraybuffer',
      }
    );

    return Buffer.from(data);
  }
}

export default Dream;
