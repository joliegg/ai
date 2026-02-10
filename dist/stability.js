"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("./types");
const errors_1 = require("./errors");
const utils_1 = require("./utils");
class Dream {
    _apiKey;
    _engine;
    _config;
    _provider = 'stability';
    constructor(apiKey, engine = 'ultra', config = {}) {
        this._apiKey = apiKey;
        this._engine = engine;
        this._config = {
            apiKey,
            timeout: config.timeout ?? (0, types_1.getGlobalConfig)().timeout,
            maxRetries: config.maxRetries ?? (0, types_1.getGlobalConfig)().maxRetries,
            retryDelay: config.retryDelay ?? (0, types_1.getGlobalConfig)().retryDelay,
            debug: config.debug ?? (0, types_1.getGlobalConfig)().debug,
        };
    }
    /**
     * Generate an image from a text prompt
     *
     * @param options - Generation options
     *
     * @returns Buffer containing the generated image
     */
    async generate(options) {
        const { prompt, aspectRatio = '1:1', style = null, seed, negativePrompt, outputFormat = 'png', cfgScale, model, } = options;
        const formData = new FormData();
        formData.append('prompt', prompt);
        if (aspectRatio !== '1:1') {
            formData.append('aspect_ratio', aspectRatio);
        }
        if (style) {
            formData.append('style_preset', style);
        }
        if (seed !== undefined && seed !== null) {
            formData.append('seed', seed.toString());
        }
        if (negativePrompt) {
            formData.append('negative_prompt', negativePrompt);
        }
        if (outputFormat !== 'png') {
            formData.append('output_format', outputFormat);
        }
        // SD3-specific parameters
        if (this._engine === 'sd3') {
            if (cfgScale !== undefined && cfgScale !== null) {
                formData.append('cfg_scale', cfgScale.toString());
            }
            if (model) {
                formData.append('model', model);
            }
        }
        const fn = async () => {
            const response = await fetch(`https://api.stability.ai/v2beta/stable-image/generate/${this._engine}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this._apiKey}`,
                    Accept: 'image/*',
                },
                body: formData,
            });
            if (!response.ok) {
                const errorBody = await response.text().catch(() => '');
                throw new errors_1.AIError(`Stability API error: ${response.status} ${errorBody}`, this._provider, undefined, response.status);
            }
            const arrayBuffer = await response.arrayBuffer();
            return Buffer.from(arrayBuffer);
        };
        const timeout = this._config.timeout ?? 60000;
        return (0, utils_1.withRetry)(() => (0, utils_1.withTimeout)(fn, timeout, this._provider), this._provider, {
            maxRetries: this._config.maxRetries,
            retryDelay: this._config.retryDelay,
        });
    }
    /**
     * Generate an image from a text prompt and starting image
     *
     * @param options - Image-to-image generation options
     *
     * @returns Buffer containing the generated image
     */
    async generateFromImage(options) {
        const { image, prompt, strength = 0.35, aspectRatio = '1:1', style = null, seed, negativePrompt, outputFormat = 'png', cfgScale, model, } = options;
        const formData = new FormData();
        formData.append('prompt', prompt);
        formData.append('image', new Blob([image], { type: 'image/png' }), 'input_image.png');
        if (typeof strength === 'number') {
            formData.append('strength', strength.toString());
        }
        if (aspectRatio !== '1:1') {
            formData.append('aspect_ratio', aspectRatio);
        }
        if (style) {
            formData.append('style_preset', style);
        }
        if (seed !== undefined && seed !== null) {
            formData.append('seed', seed.toString());
        }
        if (negativePrompt) {
            formData.append('negative_prompt', negativePrompt);
        }
        if (outputFormat !== 'png') {
            formData.append('output_format', outputFormat);
        }
        // SD3-specific parameters
        if (this._engine === 'sd3') {
            formData.append('mode', 'image-to-image');
            if (cfgScale !== undefined && cfgScale !== null) {
                formData.append('cfg_scale', cfgScale.toString());
            }
            if (model) {
                formData.append('model', model);
            }
        }
        const fn = async () => {
            const response = await fetch(`https://api.stability.ai/v2beta/stable-image/generate/${this._engine}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this._apiKey}`,
                    Accept: 'image/*',
                },
                body: formData,
            });
            if (!response.ok) {
                const errorBody = await response.text().catch(() => '');
                throw new errors_1.AIError(`Stability API error: ${response.status} ${errorBody}`, this._provider, undefined, response.status);
            }
            const arrayBuffer = await response.arrayBuffer();
            return Buffer.from(arrayBuffer);
        };
        const timeout = this._config.timeout ?? 60000;
        return (0, utils_1.withRetry)(() => (0, utils_1.withTimeout)(fn, timeout, this._provider), this._provider, {
            maxRetries: this._config.maxRetries,
            retryDelay: this._config.retryDelay,
        });
    }
}
exports.default = Dream;
