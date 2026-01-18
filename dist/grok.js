"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_openai_1 = require("./base-openai");
const errors_1 = require("./errors");
class Grok extends base_openai_1.BaseOpenAI {
    _provider = 'grok';
    constructor(apiKey, config = {}) {
        const resolvedApiKey = apiKey || process.env.GROK_API_KEY;
        super(resolvedApiKey, 'https://api.x.ai/v1', config);
    }
    get provider() {
        return this._provider;
    }
    getDefaultModel() {
        return 'grok-4';
    }
    /**
     * Generate images using Grok's image generation models
     *
     * @param options - Image generation options
     *
     * @returns Promise<Buffer[]> - Array of image buffer
     *
     */
    async generate(options) {
        const { n } = options;
        if (n > 10) {
            throw new errors_1.AIError('Cannot generate more than 10 images at once.', this._provider, 'INVALID_COUNT');
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return super.generate(options);
    }
}
exports.default = Grok;
