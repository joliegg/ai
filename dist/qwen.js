"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_openai_1 = require("./base-openai");
class Qwen extends base_openai_1.BaseOpenAI {
    _provider = 'qwen';
    constructor(apiKey, config = {}) {
        const resolvedApiKey = apiKey || process.env.DASHSCOPE_API_KEY;
        super(resolvedApiKey, 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1', config);
    }
    defaultModel() {
        return 'qwen-max-latest';
    }
    defaultEmbeddingModel() {
        return 'text-embedding-v4';
    }
}
exports.default = Qwen;
