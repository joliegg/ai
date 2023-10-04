"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
class Dream {
    _apiKey;
    _engine;
    constructor(apiKey, engine = 'stable-diffusion-xl-1024-v1-0') {
        this._apiKey = apiKey;
        this._engine = engine;
    }
    async generate(prompt, n = 1, size, style, steps = 50) {
        const [height, width] = size.split('x');
        const { data } = await axios_1.default.post(`https://api.stability.ai/v1/generation/${this._engine}/text-to-image`, {
            text_prompts: [{ text: prompt }],
            height: parseInt(height),
            width: parseInt(width),
            steps,
            samples: n,
        }, { headers: { Authorization: `Bearer ${this._apiKey}`, Accept: 'application/json' } });
        return data;
    }
}
exports.default = Dream;
