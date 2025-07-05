import axios from 'axios';
import FormData from 'form-data';

export type Style = '3d-model' | 'analog-film' | 'anime' | 'cinematic' | 'comic-book' | 'digital-art' | 'enhance' | 'fantasy-art' | 'isometric' | 'line-art' | 'low-poly' | 'modeling-compound' | 'neon-punk' | 'origami' | 'photographic' | 'pixel-art' | 'tile-texture';

export type Size = '1024x1024' | '1152x896' | '896x1152' | '1216x832' | '832x1216' | '1344x768' | '768x1344' | '1536x640' | '640x1536';

export type AspectRatio = '16:9' | '1:1' | '21:9' | '2:3' | '3:2' | '4:5' | '5:4' | '9:16' | '9:21';

export type Engine = 'ultra' | 'core' | 'sd3';

export interface DreamResponse {
  base64: string;
  finishReason: string;
  seed: number;
}

export interface DreamArtifact {
  base64: string;
  finishReason: string;
  seed: number;
}

class Dream {
  private _apiKey?: string;
  private _engine?: Engine;

  constructor (apiKey: string, engine: Engine = 'ultra') {
    this._apiKey = apiKey;
    this._engine = engine;
  }

  async generate (prompt: string, n: number = 1, size: Size = '1024x1024', style: Style | null = null, steps: number = 50, scale: number = 7): Promise<{ artifacts: DreamArtifact[] }> {
    const formData = new FormData();

    formData.append('text_prompts[0][text]', prompt);
    formData.append('text_prompts[0][weight]', '1');
    formData.append('cfg_scale', scale.toString());
    formData.append('height', size.split('x')[0]);
    formData.append('width', size.split('x')[1]);
    formData.append('samples', n.toString());
    formData.append('steps', steps.toString());

    if (style) {
      formData.append('style_preset', style);
    }

    const { data } = await axios.post(`https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image`, formData, {
      headers: {
        Authorization: `Bearer ${this._apiKey}`,
        Accept: 'application/json'
      }
    });

    return data;
  }

  async generateFromImage (image: Buffer, prompt: string, imageStrength: number = 0.35, n: number = 1, size: Size = '1024x1024', style: Style | null = null, steps: number = 50, scale: number = 7): Promise<{ artifacts: DreamArtifact[] }> {
    const formData = new FormData();

    formData.append('text_prompts[0][text]', prompt);
    formData.append('text_prompts[0][weight]', '1');
    formData.append('cfg_scale', scale.toString());
    formData.append('height', size.split('x')[0]);
    formData.append('width', size.split('x')[1]);
    formData.append('samples', n.toString());
    formData.append('steps', steps.toString());
    formData.append('init_image', image, { filename: 'init_image.png', contentType: 'image/png' });
    formData.append('init_image_mode', 'IMAGE_TO_IMAGE');
    formData.append('image_strength', imageStrength.toString());

    if (style) {
      formData.append('style_preset', style);
    }

    const { data } = await axios.post(`https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image`, formData, {
      headers: {
        Authorization: `Bearer ${this._apiKey}`,
        Accept: 'application/json'
      }
    });

    return data;
  }
}

export default Dream;