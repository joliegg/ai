"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_openai_1 = require("./base-openai");
class Ollama extends base_openai_1.BaseOpenAI {
    _provider = 'ollama';
    constructor(apiKey, config = {}) {
        // Ollama doesn't require an API key by default
        const baseURL = config.baseURL || process.env.OLLAMA_HOST || 'http://localhost:11434/v1';
        super(apiKey || 'ollama', baseURL, config);
    }
    get provider() {
        return this._provider;
    }
    defaultModel() {
        return 'llama3.2';
    }
    defaultEmbeddingModel() {
        return 'nomic-embed-text';
    }
}
exports.default = Ollama;
