"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = __importDefault(require("openai"));
class Grok {
    _client;
    constructor(apiKey) {
        this._client = new openai_1.default({
            apiKey,
            baseURL: "https://api.x.ai/v1",
            timeout: 360000,
        });
    }
    complete(messages, model = 'grok-4', maxTokens = 300) {
        if (this._client instanceof openai_1.default === false) {
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
    async generate(options) {
        const { prompt, n, model } = options;
        if (this._client instanceof openai_1.default === false) {
            throw new Error('OpenAI client not initialized');
        }
        if (n > 10) {
            throw new Error('Cannot generate more than 10 images at once.');
        }
        const query = {
            model,
            prompt,
            n,
            response_format: 'b64_json'
        };
        const response = await this._client.images.generate(query);
        if (!response.data) {
            throw new Error('No image data received from Grok');
        }
        return response.data.map((image) => {
            if (!image.b64_json) {
                throw new Error('No base64 data received from Grok');
            }
            return Buffer.from(image.b64_json, 'base64');
        });
    }
}
exports.default = Grok;
