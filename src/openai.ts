import OpenAI from 'openai';
import { APIPromise } from 'openai/core.mjs';
import { ChatCompletion, ChatCompletionMessageParam } from 'openai/resources/chat/index.mjs';
import { ImageGenerateParams } from 'openai/resources/images.mjs';

import WebSocket from 'ws';

const ALLOWED_SIZES_V3 = ['1024x1024', '1024x1792', '1792x1024'];
const ALLOWED_SIZES_V2 = ['256x256', '512x512', '1024x1024'];
const ALLOWED_SIZES_GPT_IMAGE_1 = ['1024x1024', '1536x1024', '1024x1536', 'auto'];

const ALLOWED_QUALITIES_V3 = ['standard', 'hd'];
const ALLOWED_QUALITIES_V2 = ['standard'];
const ALLOWED_QUALITIES_GPT_IMAGE_1 = [ 'auto', 'low', 'medium', 'high'];


export type Size = '1024x1024' | '1024x1792' | '1792x1024' | '256x256' | '512x512' | '1536x1024' | '1024x1536' | 'auto';
export type Quality = 'auto' | 'low' | 'medium' | 'high' | 'standard' | 'hd';
export type OutputFormat = 'png' | 'jpeg' | 'webp';
export type Background = 'transparent' | 'opaque' | 'auto';

export type ImageGenerationModel = 'gpt-image-1' | 'dall-e-3' | 'dall-e-2';

export interface GenerateOptions {
  prompt: string;
  n: number;
  size: Size;
  quality: Quality;
  format: OutputFormat;
  model: ImageGenerationModel;
  background: Background;
}

class ChatGPT {
  private _client?: OpenAI;

  constructor (apiKey: string) {
    this._client = new OpenAI({ apiKey });
  }

  complete (messages: ChatCompletionMessageParam[], model: string = 'gpt-4o', maxTokens: number = 300): APIPromise<ChatCompletion> | undefined {
    if (this._client instanceof OpenAI === false) {
      throw new Error('OpenAI client not initialized');
    }

    return this._client?.chat.completions.create({ model, messages, max_tokens: maxTokens });
  }

  /**
   * Generate images using OpenAI's image generation models
   *
   * @param options - Image generation options
   *
   * @returns Promise<Buffer[]> - Array of image buffer
   *
   */
  async generate (options: GenerateOptions): Promise<Buffer[]> {
    const { prompt, n, size, model, quality, format, background } = options;

    if (this._client instanceof OpenAI === false) {
      throw new Error('OpenAI client not initialized');
    }

    if (model === 'gpt-image-1') {
      if (ALLOWED_SIZES_GPT_IMAGE_1.includes(size) === false) {
        throw new Error(`Size must be one of ${ALLOWED_SIZES_GPT_IMAGE_1.join(', ')}`);
      }

      if (quality && ALLOWED_QUALITIES_GPT_IMAGE_1.includes(quality) === false) {
        throw new Error(`Quality must be one of ${ALLOWED_QUALITIES_GPT_IMAGE_1.join(', ')}`);
      }
    }

    if (model === 'dall-e-2') {
      if (ALLOWED_SIZES_V2.includes(size) === false) {
        throw new Error(`Size must be one of ${ALLOWED_SIZES_V2.join(', ')}`);
      }

      if (quality && ALLOWED_QUALITIES_V2.includes(quality) === false) {
        throw new Error(`Quality must be one of ${ALLOWED_QUALITIES_V2.join(', ')}`);
      }
    }

    if (model === 'dall-e-3') {
      if (n > 1) {
        throw new Error('DALL-E 3 only supports generating 1 image at a time.');
      }

      if (ALLOWED_SIZES_V3.includes(size) === false) {
        throw new Error(`Size must be one of ${ALLOWED_SIZES_V3.join(', ')}`);
      }

      if (quality && ALLOWED_QUALITIES_V3.includes(quality) === false) {
        throw new Error(`Quality must be one of ${ALLOWED_QUALITIES_V3.join(', ')}`);
      }
    }

    if (n > 10) {
      throw new Error('Cannot generate more than 10 images at once.');
    }

    const query: ImageGenerateParams = {
      model,
      prompt,
      n,
      size,
    };

    if (model === 'gpt-image-1') {
      if (format) {
        query.output_format = format;
      }

      if (background) {
        query.background = background;
      }
    } else {
      query.response_format = 'b64_json';
    }

    if (model !== 'dall-e-2') {
      query.quality = quality;
    }

    const response = await this._client.images.generate(query);

    if (!response.data) {
      throw new Error('No image data received from OpenAI');
    }

    return response.data.map((image) => {
      if (!image.b64_json) {
        throw new Error('No base64 data received from OpenAI');
      }
      return Buffer.from(image.b64_json, 'base64');
    });
  }

  converse (model: string = 'gpt-4o-realtime-preview') {
    const url = `wss://api.openai.com/v1/realtime?model=${model}`;

    const ws = new WebSocket(url, {
      headers: {
        "Authorization": "Bearer " + this._client?.apiKey,
        "OpenAI-Beta": "realtime=v1",
      },
    });

    return ws;
  }

}

export default ChatGPT;