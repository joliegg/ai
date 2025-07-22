import Anthropic, { APIPromise } from '@anthropic-ai/sdk';
import { Message, MessageParam } from '@anthropic-ai/sdk/resources/messages/messages';

export type MODEL = 'claude-opus-4-20250514' | 'claude-opus-4-0' | 'claude-sonnet-4-20250514' | 'claude-sonnet-4-0' | 'claude-3-7-sonnet-20250219' | 'claude-3-7-sonnet-latest' | 'claude-3-5-haiku-20241022' | 'claude-3-5-haiku-latest' | 'claude-3-5-sonnet-20241022' | 'claude-3-5-sonnet-latest' | 'claude-3-5-sonnet-20240620' | 'claude-3-opus-20240229' | 'claude-3-opus-latest' | 'claude-3-sonnet-20240229' | 'claude-3-haiku-20240307';


class Claude {
  private _client?: Anthropic;

  constructor(apiKey: string) {
    this._client = new Anthropic({ apiKey });
  }

  complete(messages: MessageParam[], model: MODEL = 'claude-opus-4-20250514', maxTokens: number = 300): APIPromise<Message> | undefined {
    if (this._client instanceof Anthropic === false) {
      throw new Error('Anthropic client not initialized');
    }

    return this._client?.messages.create({ model, messages, max_tokens: maxTokens });
  }
}

export default Claude;