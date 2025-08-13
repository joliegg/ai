"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = __importDefault(require("openai"));
const ws_1 = __importDefault(require("ws"));
const ALLOWED_SIZES_V3 = ['1024x1024', '1024x1792', '1792x1024'];
const ALLOWED_SIZES_V2 = ['256x256', '512x512', '1024x1024'];
const ALLOWED_SIZES_GPT_IMAGE_1 = ['1024x1024', '1536x1024', '1024x1536', 'auto'];
const ALLOWED_QUALITIES_V3 = ['standard', 'hd'];
const ALLOWED_QUALITIES_V2 = ['standard'];
const ALLOWED_QUALITIES_GPT_IMAGE_1 = ['auto', 'low', 'medium', 'high'];
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
    /**
     * Generate images using OpenAI's image generation models
     *
     * @param options - Image generation options
     *
     * @returns Promise<Buffer[]> - Array of image buffer
     *
     */
    async generate(options) {
        const { prompt, n, size, model, quality, format, background } = options;
        if (this._client instanceof openai_1.default === false) {
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
        const query = {
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
        }
        else {
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
    converse(model = 'gpt-4o-realtime-preview') {
        const url = `wss://api.openai.com/v1/realtime?model=${model}`;
        const ws = new ws_1.default(url, {
            headers: {
                "Authorization": "Bearer " + this._client?.apiKey,
                "OpenAI-Beta": "realtime=v1",
            },
        });
        return ws;
    }
}
exports.default = ChatGPT;
