"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_openai_1 = require("./base-openai");
class Kimi extends base_openai_1.BaseOpenAI {
    _provider = 'kimi';
    constructor(apiKey, config = {}) {
        const resolvedApiKey = apiKey || process.env.MOONSHOT_API_KEY;
        super(resolvedApiKey, 'https://api.moonshot.ai/v1', config);
    }
    defaultModel() {
        return 'kimi-k2-thinking';
    }
}
exports.default = Kimi;
