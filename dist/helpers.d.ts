import { ImageContent, AudioContent, VideoContent, DocumentContent, TextContent, MessageContent, Message } from './types';
/**
 * Create an image content block from a base64 string
 */
export declare function imageFromBase64(base64Data: string, mediaType?: string): ImageContent;
/**
 * Create an image content block from a URL
 */
export declare function imageFromURL(url: string): ImageContent;
/**
 * Create an image content block from a Buffer
 */
export declare function imageFromBuffer(buffer: Buffer, mediaType?: string): ImageContent;
/**
 * Create an image content block from a file path
 */
export declare function imageFromFile(filePath: string): ImageContent;
/**
 * Create a text content block
 */
export declare function text(content: string): TextContent;
/**
 * Combine text and images into a content array
 */
export declare function withImages(textContent: string, ...images: ImageContent[]): MessageContent[];
/**
 * Create an audio content block from a base64 string
 */
export declare function audioFromBase64(base64Data: string, mediaType?: string): AudioContent;
/**
 * Create an audio content block from a URL
 */
export declare function audioFromURL(url: string): AudioContent;
/**
 * Create an audio content block from a Buffer
 */
export declare function audioFromBuffer(buffer: Buffer, mediaType?: string): AudioContent;
/**
 * Create an audio content block from a file path
 */
export declare function audioFromFile(filePath: string): AudioContent;
/**
 * Combine text and audio into a content array
 */
export declare function withAudio(textContent: string, ...audio: AudioContent[]): MessageContent[];
/**
 * Create a video content block from a base64 string
 */
export declare function videoFromBase64(base64Data: string, mediaType?: string): VideoContent;
/**
 * Create a video content block from a URL
 */
export declare function videoFromURL(url: string): VideoContent;
/**
 * Create a video content block from a Buffer
 */
export declare function videoFromBuffer(buffer: Buffer, mediaType?: string): VideoContent;
/**
 * Create a video content block from a file path
 */
export declare function videoFromFile(filePath: string): VideoContent;
/**
 * Combine text and video into a content array
 */
export declare function withVideo(textContent: string, ...videos: VideoContent[]): MessageContent[];
/**
 * Create a document content block from a base64 string
 */
export declare function documentFromBase64(base64Data: string, mediaType?: string, filename?: string): DocumentContent;
/**
 * Create a document content block from a URL
 */
export declare function documentFromURL(url: string, filename?: string): DocumentContent;
/**
 * Create a document content block from a Buffer
 */
export declare function documentFromBuffer(buffer: Buffer, mediaType?: string, filename?: string): DocumentContent;
/**
 * Create a document content block from a file path
 */
export declare function documentFromFile(filePath: string): DocumentContent;
/**
 * Combine text and documents into a content array
 */
export declare function withDocuments(textContent: string, ...documents: DocumentContent[]): MessageContent[];
/**
 * Create a user message with text and optional images
 */
export declare function userMessage(content: string | MessageContent | MessageContent[]): Message;
/**
 * Create a system message
 */
export declare function systemMessage(content: string): Message;
/**
 * Create an assistant message
 */
export declare function assistantMessage(content: string): Message;
/**
 * Builder class for constructing conversations with multimodal content
 */
export declare class MessageBuilder {
    private messages;
    /**
     * Add a system message
     */
    system(content: string): this;
    /**
     * Add a user message with text
     */
    user(content: string): this;
    /**
     * Add a user message with text and images
     */
    userWithImages(textContent: string, ...images: ImageContent[]): this;
    /**
     * Add a user message with text and audio
     */
    userWithAudio(textContent: string, ...audio: AudioContent[]): this;
    /**
     * Add a user message with text and video
     */
    userWithVideo(textContent: string, ...videos: VideoContent[]): this;
    /**
     * Add a user message with text and documents
     */
    userWithDocuments(textContent: string, ...documents: DocumentContent[]): this;
    /**
     * Add a user message with mixed content
     */
    userWithContent(textContent: string, ...content: MessageContent[]): this;
    /**
     * Add an assistant message
     */
    assistant(content: string): this;
    /**
     * Add a custom message
     */
    add(message: Message): this;
    /**
     * Build and return the messages array
     */
    build(): Message[];
    /**
     * Clear all messages
     */
    clear(): this;
}
/**
 * Create a new message builder
 */
export declare function createMessageBuilder(): MessageBuilder;
