"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = __importDefault(require("openai"));
const ALLOWED_SIZES_V3 = ['1024x1024', '1024x1792', '1792x1024'];
const ALLOWED_SIZES_V2 = ['256x256', '512x512', '1024x1024'];
class ChatGPT {
    _client;
    constructor(apiKey) {
        this._client = new openai_1.default({ apiKey });
    }
    complete(messages, model = 'gpt-4o', maxTokens = 300) {
        if (this._client instanceof openai_1.default === false) {
            throw new Error('OpenAI client not initialized');
        }
        return this._client?.chat.completions.create({ model, messages, max_tokens: maxTokens });
    }
    generate(prompt, n = 1, size = '1024x1024', model = 'dall-e-3') {
        if (this._client instanceof openai_1.default === false) {
            throw new Error('OpenAI client not initialized');
        }
        if (model === 'dall-e-3') {
            if (n > 1) {
                throw new Error('DALL-E 3 only supports generating 1 image at a time.');
            }
            if (ALLOWED_SIZES_V3.includes(size) === false) {
                throw new Error(`Size must be one of ${ALLOWED_SIZES_V3.join(', ')}`);
            }
        }
        if (n > 10) {
            throw new Error('Cannot generate more than 10 images at once.');
        }
        if (ALLOWED_SIZES_V2.includes(size) === false) {
            throw new Error(`Size must be one of ${ALLOWED_SIZES_V2.join(', ')}`);
        }
        return this._client?.images.generate({
            model,
            prompt,
            n,
            size,
            quality: 'hd',
            response_format: 'b64_json',
        });
    }
}
exports.default = ChatGPT;
