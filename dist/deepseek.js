"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = __importDefault(require("openai"));
class DeepSeek {
    _client;
    constructor(apiKey) {
        this._client = new openai_1.default({ apiKey, baseURL: 'https://api.deepseek.com' });
    }
    complete(messages, model = 'deepseek-chat	', maxTokens = 300) {
        return this._client.chat.completions.create({ model, messages, max_tokens: maxTokens });
    }
}
exports.default = DeepSeek;
