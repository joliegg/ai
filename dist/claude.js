"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
class Claude {
    _client;
    constructor(apiKey) {
        this._client = new sdk_1.default({ apiKey });
    }
    complete(messages, model = 'claude-opus-4-20250514', maxTokens = 300) {
        if (this._client instanceof sdk_1.default === false) {
            throw new Error('Anthropic client not initialized');
        }
        return this._client?.messages.create({ model, messages, max_tokens: maxTokens });
    }
}
exports.default = Claude;
