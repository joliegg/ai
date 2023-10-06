import axios from 'axios';
import FormData from 'form-data';


export type Style = '3d-model' | 'analog-film' | 'anime' | 'cinematic' | 'comic-book' | 'digital-art' | 'enhance' | 'fantasy-art' | 'isometric' | 'line-art' | 'low-poly' | 'modeling-compound' | 'neon-punk' | 'origami' | 'photographic' | 'pixel-art' | 'tile-texture';

export type Size = '1024x1024' | '1152x896' | '896x1152' | '1216x832' | '832x1216' | '1344x768' | '768x1344' | '1536x640' | '640x1536';

export interface DreamResponse {
  base64: string;
  finishReason: string;
  seed: number;
}

class Dream {
  private _apiKey?: string;
  private _engine?: string;


  constructor (apiKey: string, engine: string = 'stable-diffusion-xl-1024-v1-0') {
    this._apiKey = apiKey;
    this._engine = engine;
  }

  async generate (prompt: string, n: number = 1, size: Size, style?: Style, steps: number = 50, scale: number = 7): Promise<DreamResponse[]> {
    const [ height, width ] = size.split('x');


    const { data } = await axios.post<DreamResponse[]>(`https://api.stability.ai/v1/generation/${this._engine}/text-to-image`, {
      text_prompts: [{ text: prompt }],
      height: parseInt(height),
      width: parseInt(width),
      steps,
      samples: n,
      style_preset: style,
      cfg_scale: scale,
    }, { headers: { Authorization: `Bearer ${this._apiKey}`, Accept: 'application/json' } });

    return data;
  }

  async generateFromImage (image: string, prompt: string, imageStrength = 0.35, n: number = 1, size: Size, style?: Style, steps: number = 50, scale: number = 7): Promise<DreamResponse[]> {
    // const [ height, width ] = size.split('x');

    const formData = new FormData();

    formData.append('text_prompts[0][text]', prompt);
    formData.append('init_image', image);
    formData.append('image_strength', imageStrength);
    formData.append('steps', steps);
    formData.append('samples', n);
    formData.append('cfg_scale', scale);

    if (style) {
      formData.append('style_preset',  style);
    }


    const formHeaders = formData.getHeaders();

    const { data } = await axios.post<DreamResponse[]>(`https://api.stability.ai/v1/generation/${this._engine}/image-to-image`, formData, {
      headers: { Authorization: `Bearer ${this._apiKey}`, Accept: 'application/json', ...formHeaders },
    });

    return data;
  }

}

export default Dream;