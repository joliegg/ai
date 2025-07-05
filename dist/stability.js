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
    async generate(prompt, n = 1, size = '1024x1024', style = null, steps = 50, scale = 7) {
        const formData = new form_data_1.default();
        formData.append('text_prompts[0][text]', prompt);
        formData.append('text_prompts[0][weight]', '1');
        formData.append('cfg_scale', scale.toString());
        formData.append('height', size.split('x')[0]);
        formData.append('width', size.split('x')[1]);
        formData.append('samples', n.toString());
        formData.append('steps', steps.toString());
        if (style) {
            formData.append('style_preset', style);
        }
        const { data } = await axios_1.default.post(`https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image`, formData, {
            headers: {
                Authorization: `Bearer ${this._apiKey}`,
                Accept: 'application/json'
            }
        });
        return data;
    }
    async generateFromImage(image, prompt, imageStrength = 0.35, n = 1, size = '1024x1024', style = null, steps = 50, scale = 7) {
        const formData = new form_data_1.default();
        formData.append('text_prompts[0][text]', prompt);
        formData.append('text_prompts[0][weight]', '1');
        formData.append('cfg_scale', scale.toString());
        formData.append('height', size.split('x')[0]);
        formData.append('width', size.split('x')[1]);
        formData.append('samples', n.toString());
        formData.append('steps', steps.toString());
        formData.append('init_image', image, { filename: 'init_image.png', contentType: 'image/png' });
        formData.append('init_image_mode', 'IMAGE_TO_IMAGE');
        formData.append('image_strength', imageStrength.toString());
        if (style) {
            formData.append('style_preset', style);
        }
        const { data } = await axios_1.default.post(`https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image`, formData, {
            headers: {
                Authorization: `Bearer ${this._apiKey}`,
                Accept: 'application/json'
            }
        });
        return data;
    }
}
exports.default = Dream;
