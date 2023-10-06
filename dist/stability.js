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
    constructor(apiKey, engine = 'stable-diffusion-xl-1024-v1-0') {
        this._apiKey = apiKey;
        this._engine = engine;
    }
    async generate(prompt, n = 1, size, style, steps = 50, scale = 7) {
        const [height, width] = size.split('x');
        const { data } = await axios_1.default.post(`https://api.stability.ai/v1/generation/${this._engine}/text-to-image`, {
            text_prompts: [{ text: prompt }],
            height: parseInt(height),
            width: parseInt(width),
            steps,
            samples: n,
            style_preset: style,
            cfg_scale: scale,
        }, { headers: { Authorization: `Bearer ${this._apiKey}`, Accept: 'application/json' } });
        return data;
    }
    async generateFromImage(image, prompt, imageStrength = 0.35, n = 1, size, style, steps = 50, scale = 7) {
        // const [ height, width ] = size.split('x');
        const formData = new form_data_1.default();
        formData.append('text_prompts[0][text]', prompt);
        formData.append('init_image', image);
        formData.append('image_strength', imageStrength);
        formData.append('steps', steps);
        formData.append('samples', n);
        formData.append('cfg_scale', scale);
        if (style) {
            formData.append('style_preset', style);
        }
        const formHeaders = formData.getHeaders();
        const { data } = await axios_1.default.post(`https://api.stability.ai/v1/generation/${this._engine}/image-to-image`, formData, {
            headers: { Authorization: `Bearer ${this._apiKey}`, Accept: 'application/json', ...formHeaders },
        });
        return data;
    }
}
exports.default = Dream;
