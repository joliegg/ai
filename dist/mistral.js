"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_openai_1 = require("./base-openai");
class Mistral extends base_openai_1.BaseOpenAI {
    _provider = 'mistral';
    constructor(apiKey, config = {}) {
        const resolvedApiKey = apiKey || process.env.MISTRAL_API_KEY;
        super(resolvedApiKey, 'https://api.mistral.ai/v1', config);
    }
    get provider() {
        return this._provider;
    }
    getDefaultModel() {
        return 'mistral-large-latest';
    }
    getDefaultEmbeddingModel() {
        return 'mistral-embed';
    }
}
exports.default = Mistral;
