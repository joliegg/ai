"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = __importDefault(require("openai"));
const ALLOWED_SIZES = ['256x256', '512x512', '1024x1024'];
class ChatGPT {
    _client;
    constructor(apiKey) {
        this._client = new openai_1.default({ apiKey });
    }
    complete(messages, model = 'gpt-4') {
        if (this._client instanceof openai_1.default === false) {
            throw new Error('OpenAI client not initialized');
        }
        return this._client?.chat.completions.create({ model, messages });
    }
    generate(prompt, n = 1, size = '512x512') {
        if (this._client instanceof openai_1.default === false) {
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
exports.default = ChatGPT;
