import { APIPromise } from 'openai/core.mjs';
import { ChatCompletion, ChatCompletionMessageParam } from 'openai/resources/chat/index.mjs';
import { ImagesResponse } from 'openai/resources/images.mjs';
declare class ChatGPT {
    private _client?;
    constructor(apiKey: string);
    complete(messages: ChatCompletionMessageParam[], model?: string): APIPromise<ChatCompletion> | undefined;
    generate(prompt: string, n?: number, size?: '256x256' | '512x512' | '1024x1024'): APIPromise<ImagesResponse> | undefined;
}
export default ChatGPT;