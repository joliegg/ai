import { APIPromise } from 'openai/core.mjs';
import { ChatCompletion, ChatCompletionMessageParam } from 'openai/resources/chat/index.mjs';
import { ImagesResponse } from 'openai/resources/images.mjs';
import WebSocket from 'ws';
declare class ChatGPT {
    private _client?;
    constructor(apiKey: string);
    complete(messages: ChatCompletionMessageParam[], model?: string, maxTokens?: number): APIPromise<ChatCompletion> | undefined;
    generate(prompt: string, n?: number, size?: '1024x1024' | '1024x1792' | '1792x1024' | '256x256' | '512x512' | '1536x1024' | '1024x1536' | 'auto', model?: 'gpt-image-1' | 'dall-e-3' | 'dall-e-2'): APIPromise<ImagesResponse> | undefined;
    converse(model?: string): WebSocket;
}
export default ChatGPT;
