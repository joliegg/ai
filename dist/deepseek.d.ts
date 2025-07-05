import { APIPromise } from 'openai/core.mjs';
import { ChatCompletion, ChatCompletionMessageParam } from 'openai/resources/chat/index.mjs';
declare class DeepSeek {
    private _client;
    constructor(apiKey: string);
    complete(messages: ChatCompletionMessageParam[], model?: string, maxTokens?: number): APIPromise<ChatCompletion>;
}
export default DeepSeek;
