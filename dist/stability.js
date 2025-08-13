"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
class Dream {
    _apiKey;
    _engine;
    constructor(apiKey, engine = 'ultra') {
        this._apiKey = apiKey;
        this._engine = engine;
    }
    /**
     * Generate an image from a text prompt
     *
     * @param options - Generation options
     *
     * @returns Buffer containing the generated image
     */
    async generate(options) {
        const { prompt, aspectRatio = '1:1', style = null, seed, negativePrompt, outputFormat = 'png', cfgScale, model } = options;
        const formData = new form_data_1.default();
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
        const { data } = await axios_1.default.post(`https://api.stability.ai/v2beta/stable-image/generate/${this._engine}`, formData, {
            headers: {
                Authorization: `Bearer ${this._apiKey}`,
                Accept: 'image/*',
                ...formData.getHeaders()
            },
            responseType: 'arraybuffer'
        });
        return Buffer.from(data);
    }
    /**
     * Generate an image from a text prompt and starting image
     *
     * @param options - Image-to-image generation options
     *
     * @returns Buffer containing the generated image
     */
    async generateFromImage(options) {
        const { image, prompt, strength = 0.35, aspectRatio = '1:1', style = null, seed, negativePrompt, outputFormat = 'png', cfgScale, model } = options;
        const formData = new form_data_1.default();
        formData.append('prompt', prompt);
        formData.append('image', image, { filename: 'input_image.png', contentType: 'image/png' });
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
        const { data } = await axios_1.default.post(`https://api.stability.ai/v2beta/stable-image/generate/${this._engine}`, formData, {
            headers: {
                Authorization: `Bearer ${this._apiKey}`,
                Accept: 'image/*',
                ...formData.getHeaders()
            },
            responseType: 'arraybuffer'
        });
        return Buffer.from(data);
    }
}
exports.default = Dream;
