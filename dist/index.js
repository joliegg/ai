"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseError = exports.ServerError = exports.NetworkError = exports.TimeoutError = exports.ContextLengthError = exports.ModelNotFoundError = exports.ContentFilterError = exports.InvalidRequestError = exports.RateLimitError = exports.AuthenticationError = exports.AIError = exports.getGlobalConfig = exports.configure = exports.createMessageBuilder = exports.MessageBuilder = exports.assistantMessage = exports.systemMessage = exports.userMessage = exports.withDocuments = exports.withVideo = exports.withAudio = exports.withImages = exports.text = exports.documentFromFile = exports.documentFromBuffer = exports.documentFromURL = exports.documentFromBase64 = exports.videoFromFile = exports.videoFromBuffer = exports.videoFromURL = exports.videoFromBase64 = exports.audioFromFile = exports.audioFromBuffer = exports.audioFromURL = exports.audioFromBase64 = exports.imageFromFile = exports.imageFromBuffer = exports.imageFromURL = exports.imageFromBase64 = exports.createConversation = exports.Conversation = exports.RealtimeSession = exports.Ollama = exports.Mistral = exports.Claude = exports.Grok = exports.Gemini = exports.DeepSeek = exports.Dream = exports.ChatGPT = void 0;
exports.generateId = exports.calculateBackoff = exports.sleep = exports.withTimeout = exports.withRetry = exports.isRetryableError = void 0;
const openai_1 = __importStar(require("./openai"));
exports.ChatGPT = openai_1.default;
Object.defineProperty(exports, "RealtimeSession", { enumerable: true, get: function () { return openai_1.RealtimeSession; } });
const stability_1 = __importDefault(require("./stability"));
exports.Dream = stability_1.default;
const deepseek_1 = __importDefault(require("./deepseek"));
exports.DeepSeek = deepseek_1.default;
const gemini_1 = __importDefault(require("./gemini"));
exports.Gemini = gemini_1.default;
const grok_1 = __importDefault(require("./grok"));
exports.Grok = grok_1.default;
const claude_1 = __importDefault(require("./claude"));
exports.Claude = claude_1.default;
const mistral_1 = __importDefault(require("./mistral"));
exports.Mistral = mistral_1.default;
const ollama_1 = __importDefault(require("./ollama"));
exports.Ollama = ollama_1.default;
var conversation_1 = require("./conversation");
Object.defineProperty(exports, "Conversation", { enumerable: true, get: function () { return conversation_1.Conversation; } });
Object.defineProperty(exports, "createConversation", { enumerable: true, get: function () { return conversation_1.createConversation; } });
var helpers_1 = require("./helpers");
// Image helpers
Object.defineProperty(exports, "imageFromBase64", { enumerable: true, get: function () { return helpers_1.imageFromBase64; } });
Object.defineProperty(exports, "imageFromURL", { enumerable: true, get: function () { return helpers_1.imageFromURL; } });
Object.defineProperty(exports, "imageFromBuffer", { enumerable: true, get: function () { return helpers_1.imageFromBuffer; } });
Object.defineProperty(exports, "imageFromFile", { enumerable: true, get: function () { return helpers_1.imageFromFile; } });
// Audio helpers
Object.defineProperty(exports, "audioFromBase64", { enumerable: true, get: function () { return helpers_1.audioFromBase64; } });
Object.defineProperty(exports, "audioFromURL", { enumerable: true, get: function () { return helpers_1.audioFromURL; } });
Object.defineProperty(exports, "audioFromBuffer", { enumerable: true, get: function () { return helpers_1.audioFromBuffer; } });
Object.defineProperty(exports, "audioFromFile", { enumerable: true, get: function () { return helpers_1.audioFromFile; } });
// Video helpers
Object.defineProperty(exports, "videoFromBase64", { enumerable: true, get: function () { return helpers_1.videoFromBase64; } });
Object.defineProperty(exports, "videoFromURL", { enumerable: true, get: function () { return helpers_1.videoFromURL; } });
Object.defineProperty(exports, "videoFromBuffer", { enumerable: true, get: function () { return helpers_1.videoFromBuffer; } });
Object.defineProperty(exports, "videoFromFile", { enumerable: true, get: function () { return helpers_1.videoFromFile; } });
// Document helpers
Object.defineProperty(exports, "documentFromBase64", { enumerable: true, get: function () { return helpers_1.documentFromBase64; } });
Object.defineProperty(exports, "documentFromURL", { enumerable: true, get: function () { return helpers_1.documentFromURL; } });
Object.defineProperty(exports, "documentFromBuffer", { enumerable: true, get: function () { return helpers_1.documentFromBuffer; } });
Object.defineProperty(exports, "documentFromFile", { enumerable: true, get: function () { return helpers_1.documentFromFile; } });
// Text helpers
Object.defineProperty(exports, "text", { enumerable: true, get: function () { return helpers_1.text; } });
Object.defineProperty(exports, "withImages", { enumerable: true, get: function () { return helpers_1.withImages; } });
Object.defineProperty(exports, "withAudio", { enumerable: true, get: function () { return helpers_1.withAudio; } });
Object.defineProperty(exports, "withVideo", { enumerable: true, get: function () { return helpers_1.withVideo; } });
Object.defineProperty(exports, "withDocuments", { enumerable: true, get: function () { return helpers_1.withDocuments; } });
// Message helpers
Object.defineProperty(exports, "userMessage", { enumerable: true, get: function () { return helpers_1.userMessage; } });
Object.defineProperty(exports, "systemMessage", { enumerable: true, get: function () { return helpers_1.systemMessage; } });
Object.defineProperty(exports, "assistantMessage", { enumerable: true, get: function () { return helpers_1.assistantMessage; } });
// Message builder
Object.defineProperty(exports, "MessageBuilder", { enumerable: true, get: function () { return helpers_1.MessageBuilder; } });
Object.defineProperty(exports, "createMessageBuilder", { enumerable: true, get: function () { return helpers_1.createMessageBuilder; } });
// Configuration function
var types_1 = require("./types");
Object.defineProperty(exports, "configure", { enumerable: true, get: function () { return types_1.configure; } });
Object.defineProperty(exports, "getGlobalConfig", { enumerable: true, get: function () { return types_1.getGlobalConfig; } });
var errors_1 = require("./errors");
Object.defineProperty(exports, "AIError", { enumerable: true, get: function () { return errors_1.AIError; } });
Object.defineProperty(exports, "AuthenticationError", { enumerable: true, get: function () { return errors_1.AuthenticationError; } });
Object.defineProperty(exports, "RateLimitError", { enumerable: true, get: function () { return errors_1.RateLimitError; } });
Object.defineProperty(exports, "InvalidRequestError", { enumerable: true, get: function () { return errors_1.InvalidRequestError; } });
Object.defineProperty(exports, "ContentFilterError", { enumerable: true, get: function () { return errors_1.ContentFilterError; } });
Object.defineProperty(exports, "ModelNotFoundError", { enumerable: true, get: function () { return errors_1.ModelNotFoundError; } });
Object.defineProperty(exports, "ContextLengthError", { enumerable: true, get: function () { return errors_1.ContextLengthError; } });
Object.defineProperty(exports, "TimeoutError", { enumerable: true, get: function () { return errors_1.TimeoutError; } });
Object.defineProperty(exports, "NetworkError", { enumerable: true, get: function () { return errors_1.NetworkError; } });
Object.defineProperty(exports, "ServerError", { enumerable: true, get: function () { return errors_1.ServerError; } });
Object.defineProperty(exports, "parseError", { enumerable: true, get: function () { return errors_1.parseError; } });
Object.defineProperty(exports, "isRetryableError", { enumerable: true, get: function () { return errors_1.isRetryableError; } });
var utils_1 = require("./utils");
Object.defineProperty(exports, "withRetry", { enumerable: true, get: function () { return utils_1.withRetry; } });
Object.defineProperty(exports, "withTimeout", { enumerable: true, get: function () { return utils_1.withTimeout; } });
Object.defineProperty(exports, "sleep", { enumerable: true, get: function () { return utils_1.sleep; } });
Object.defineProperty(exports, "calculateBackoff", { enumerable: true, get: function () { return utils_1.calculateBackoff; } });
Object.defineProperty(exports, "generateId", { enumerable: true, get: function () { return utils_1.generateId; } });
