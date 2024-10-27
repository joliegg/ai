"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const generative_ai_1 = require("@google/generative-ai");
class Gemini {
    _client;
    constructor(apiKey) {
        this._client = new generative_ai_1.GoogleGenerativeAI(apiKey);
    }
    complete(prompt, startParams = null, model = 'gemini-1.5-pro-002') {
        if (this._client instanceof generative_ai_1.GoogleGenerativeAI === false) {
            throw new Error('GoogleGenerativeAI client not initialized');
        }
        const _model = this._client.getGenerativeModel({ model });
        if (startParams !== null && typeof startParams !== 'undefined') {
            const chat = _model.startChat(startParams);
            return chat.sendMessage(prompt);
        }
        return _model.generateContent(prompt);
    }
}
exports.default = Gemini;
