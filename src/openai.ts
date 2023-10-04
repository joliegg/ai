import OpenAI from 'openai';
import { APIPromise } from 'openai/core.mjs';
import { ChatCompletion, ChatCompletionMessageParam } from 'openai/resources/chat/index.mjs';
import { ImagesResponse } from 'openai/resources/images.mjs';

const ALLOWED_SIZES = ['256x256', '512x512', '1024x1024'];

class ChatGPT {
  private _client?: OpenAI;

  constructor (apiKey: string) {
    this._client = new OpenAI({ apiKey });
  }

  complete (messages: ChatCompletionMessageParam[], model: string = 'gpt-4' ): APIPromise<ChatCompletion> | undefined {
    if (this._client instanceof OpenAI === false) {
      throw new Error('OpenAI client not initialized');
    }

    return this._client?.chat.completions.create({ model, messages });
  }

  generate (prompt: string, n: number = 1, size: '256x256' | '512x512' | '1024x1024'  = '512x512'): APIPromise<ImagesResponse> | undefined {
    if (this._client instanceof OpenAI === false) {
      throw new Error('OpenAI client not initialized');
    }

    if (n > 10) {
      throw new Error('Cannot generate more than 10 images at once.');
    }


    if (ALLOWED_SIZES.includes(size) === false) {
      throw new Error(`Size must be one of ${ALLOWED_SIZES.join(', ')}`);
    }

    return this._client?.images.generate({ prompt, n, size, response_format: 'url' });
  }

}

export default ChatGPT;