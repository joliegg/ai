"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_openai_1 = require("./base-openai");
class DeepSeek extends base_openai_1.BaseOpenAI {
    _provider = 'deepseek';
    constructor(apiKey, config = {}) {
        const resolvedApiKey = apiKey || process.env.DEEPSEEK_API_KEY;
        super(resolvedApiKey, 'https://api.deepseek.com', config);
    }
    get provider() {
        return this._provider;
    }
    defaultModel() {
        return 'deepseek-reasoner';
    }
}
exports.default = DeepSeek;
