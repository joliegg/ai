import OpenAI from 'openai';
import { APIPromise } from 'openai/core.mjs';
import { ChatCompletion, ChatCompletionMessageParam } from 'openai/resources/chat/index.mjs';

class DeepSeek {
  private _client: OpenAI;

  constructor (apiKey: string) {
    this._client = new OpenAI({ apiKey, baseURL: 'https://api.deepseek.com' });
  }

  complete (messages: ChatCompletionMessageParam[], model: string = 'deepseek-chat	', maxTokens: number = 300): APIPromise<ChatCompletion> {
    return this._client.chat.completions.create({ model, messages, max_tokens: maxTokens });
  }

}

export default DeepSeek;