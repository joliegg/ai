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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageBuilder = void 0;
exports.imageFromBase64 = imageFromBase64;
exports.imageFromURL = imageFromURL;
exports.imageFromBuffer = imageFromBuffer;
exports.imageFromFile = imageFromFile;
exports.text = text;
exports.withImages = withImages;
exports.audioFromBase64 = audioFromBase64;
exports.audioFromURL = audioFromURL;
exports.audioFromBuffer = audioFromBuffer;
exports.audioFromFile = audioFromFile;
exports.withAudio = withAudio;
exports.videoFromBase64 = videoFromBase64;
exports.videoFromURL = videoFromURL;
exports.videoFromBuffer = videoFromBuffer;
exports.videoFromFile = videoFromFile;
exports.withVideo = withVideo;
exports.documentFromBase64 = documentFromBase64;
exports.documentFromURL = documentFromURL;
exports.documentFromBuffer = documentFromBuffer;
exports.documentFromFile = documentFromFile;
exports.withDocuments = withDocuments;
exports.userMessage = userMessage;
exports.systemMessage = systemMessage;
exports.assistantMessage = assistantMessage;
exports.createMessageBuilder = createMessageBuilder;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// =============================================================================
// Vision/Multimodal Helpers
// =============================================================================
/**
 * Create an image content block from a base64 string
 */
function imageFromBase64(base64Data, mediaType = 'image/png') {
    return {
        type: 'image',
        source: {
            type: 'base64',
            mediaType,
            data: base64Data,
        },
    };
}
/**
 * Create an image content block from a URL
 */
function imageFromURL(url) {
    return {
        type: 'image',
        source: {
            type: 'url',
            data: url,
        },
    };
}
/**
 * Create an image content block from a Buffer
 */
function imageFromBuffer(buffer, mediaType = 'image/png') {
    return {
        type: 'image',
        source: {
            type: 'base64',
            mediaType,
            data: buffer.toString('base64'),
        },
    };
}
/**
 * Create an image content block from a file path
 */
function imageFromFile(filePath) {
    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mediaTypes = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
    };
    const mediaType = mediaTypes[ext] || 'image/png';
    return imageFromBuffer(buffer, mediaType);
}
/**
 * Create a text content block
 */
function text(content) {
    return {
        type: 'text',
        text: content,
    };
}
/**
 * Combine text and images into a content array
 */
function withImages(textContent, ...images) {
    return [text(textContent), ...images];
}
// =============================================================================
// Audio Helpers
// =============================================================================
/**
 * Create an audio content block from a base64 string
 */
function audioFromBase64(base64Data, mediaType = 'audio/mp3') {
    return {
        type: 'audio',
        source: {
            type: 'base64',
            mediaType,
            data: base64Data,
        },
    };
}
/**
 * Create an audio content block from a URL
 */
function audioFromURL(url) {
    return {
        type: 'audio',
        source: {
            type: 'url',
            data: url,
        },
    };
}
/**
 * Create an audio content block from a Buffer
 */
function audioFromBuffer(buffer, mediaType = 'audio/mp3') {
    return {
        type: 'audio',
        source: {
            type: 'base64',
            mediaType,
            data: buffer.toString('base64'),
        },
    };
}
/**
 * Create an audio content block from a file path
 */
function audioFromFile(filePath) {
    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mediaTypes = {
        '.mp3': 'audio/mp3',
        '.wav': 'audio/wav',
        '.webm': 'audio/webm',
        '.m4a': 'audio/m4a',
        '.ogg': 'audio/ogg',
        '.flac': 'audio/flac',
    };
    const mediaType = mediaTypes[ext] || 'audio/mp3';
    return audioFromBuffer(buffer, mediaType);
}
/**
 * Combine text and audio into a content array
 */
function withAudio(textContent, ...audio) {
    return [text(textContent), ...audio];
}
// =============================================================================
// Video Helpers
// =============================================================================
/**
 * Create a video content block from a base64 string
 */
function videoFromBase64(base64Data, mediaType = 'video/mp4') {
    return {
        type: 'video',
        source: {
            type: 'base64',
            mediaType,
            data: base64Data,
        },
    };
}
/**
 * Create a video content block from a URL
 */
function videoFromURL(url) {
    return {
        type: 'video',
        source: {
            type: 'url',
            data: url,
        },
    };
}
/**
 * Create a video content block from a Buffer
 */
function videoFromBuffer(buffer, mediaType = 'video/mp4') {
    return {
        type: 'video',
        source: {
            type: 'base64',
            mediaType,
            data: buffer.toString('base64'),
        },
    };
}
/**
 * Create a video content block from a file path
 */
function videoFromFile(filePath) {
    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mediaTypes = {
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.mov': 'video/quicktime',
        '.avi': 'video/x-msvideo',
        '.mkv': 'video/x-matroska',
    };
    const mediaType = mediaTypes[ext] || 'video/mp4';
    return videoFromBuffer(buffer, mediaType);
}
/**
 * Combine text and video into a content array
 */
function withVideo(textContent, ...videos) {
    return [text(textContent), ...videos];
}
// =============================================================================
// Document/PDF Helpers
// =============================================================================
/**
 * Create a document content block from a base64 string
 */
function documentFromBase64(base64Data, mediaType = 'application/pdf', filename) {
    return {
        type: 'document',
        source: {
            type: 'base64',
            mediaType,
            data: base64Data,
            filename,
        },
    };
}
/**
 * Create a document content block from a URL
 */
function documentFromURL(url, filename) {
    return {
        type: 'document',
        source: {
            type: 'url',
            data: url,
            filename,
        },
    };
}
/**
 * Create a document content block from a Buffer
 */
function documentFromBuffer(buffer, mediaType = 'application/pdf', filename) {
    return {
        type: 'document',
        source: {
            type: 'base64',
            mediaType,
            data: buffer.toString('base64'),
            filename,
        },
    };
}
/**
 * Create a document content block from a file path
 */
function documentFromFile(filePath) {
    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const filename = path.basename(filePath);
    const mediaTypes = {
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.txt': 'text/plain',
        '.csv': 'text/csv',
        '.json': 'application/json',
        '.xml': 'application/xml',
        '.html': 'text/html',
        '.md': 'text/markdown',
    };
    const mediaType = mediaTypes[ext] || 'application/octet-stream';
    return documentFromBuffer(buffer, mediaType, filename);
}
/**
 * Combine text and documents into a content array
 */
function withDocuments(textContent, ...documents) {
    return [text(textContent), ...documents];
}
/**
 * Create a user message with text and optional images
 */
function userMessage(content) {
    return {
        role: 'user',
        content,
    };
}
/**
 * Create a system message
 */
function systemMessage(content) {
    return {
        role: 'system',
        content,
    };
}
/**
 * Create an assistant message
 */
function assistantMessage(content) {
    return {
        role: 'assistant',
        content,
    };
}
// =============================================================================
// Conversation Builder
// =============================================================================
/**
 * Builder class for constructing conversations with multimodal content
 */
class MessageBuilder {
    messages = [];
    /**
     * Add a system message
     */
    system(content) {
        this.messages.push(systemMessage(content));
        return this;
    }
    /**
     * Add a user message with text
     */
    user(content) {
        this.messages.push(userMessage(content));
        return this;
    }
    /**
     * Add a user message with text and images
     */
    userWithImages(textContent, ...images) {
        this.messages.push(userMessage(withImages(textContent, ...images)));
        return this;
    }
    /**
     * Add a user message with text and audio
     */
    userWithAudio(textContent, ...audio) {
        this.messages.push(userMessage(withAudio(textContent, ...audio)));
        return this;
    }
    /**
     * Add a user message with text and video
     */
    userWithVideo(textContent, ...videos) {
        this.messages.push(userMessage(withVideo(textContent, ...videos)));
        return this;
    }
    /**
     * Add a user message with text and documents
     */
    userWithDocuments(textContent, ...documents) {
        this.messages.push(userMessage(withDocuments(textContent, ...documents)));
        return this;
    }
    /**
     * Add a user message with mixed content
     */
    userWithContent(textContent, ...content) {
        this.messages.push(userMessage([text(textContent), ...content]));
        return this;
    }
    /**
     * Add an assistant message
     */
    assistant(content) {
        this.messages.push(assistantMessage(content));
        return this;
    }
    /**
     * Add a custom message
     */
    add(message) {
        this.messages.push(message);
        return this;
    }
    /**
     * Build and return the messages array
     */
    build() {
        return [...this.messages];
    }
    /**
     * Clear all messages
     */
    clear() {
        this.messages = [];
        return this;
    }
}
exports.MessageBuilder = MessageBuilder;
/**
 * Create a new message builder
 */
function createMessageBuilder() {
    return new MessageBuilder();
}
