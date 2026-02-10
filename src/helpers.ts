import * as fs from 'fs';
import * as path from 'path';

import {
  ImageContent,
  AudioContent,
  VideoContent,
  DocumentContent,
  TextContent,
  MessageContent,
  Message,
} from './types';

/**
 * Create an image content block from a base64 string
 */
export function imageFromBase64(base64Data: string, mediaType: string = 'image/png'): ImageContent {
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
export function imageFromURL(url: string): ImageContent {
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
export function imageFromBuffer(buffer: Buffer, mediaType: string = 'image/png'): ImageContent {
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
export function imageFromFile(filePath: string): ImageContent {
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();

  const mediaTypes: Record<string, string> = {
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
export function text(content: string): TextContent {
  return {
    type: 'text',
    text: content,
  };
}

/**
 * Combine text and images into a content array
 */
export function withImages(textContent: string, ...images: ImageContent[]): MessageContent[] {
  return [text(textContent), ...images];
}

/**
 * Create an audio content block from a base64 string
 */
export function audioFromBase64(base64Data: string, mediaType: string = 'audio/mp3'): AudioContent {
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
export function audioFromURL(url: string): AudioContent {
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
export function audioFromBuffer(buffer: Buffer, mediaType: string = 'audio/mp3'): AudioContent {
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
export function audioFromFile(filePath: string): AudioContent {
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();

  const mediaTypes: Record<string, string> = {
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
export function withAudio(textContent: string, ...audio: AudioContent[]): MessageContent[] {
  return [text(textContent), ...audio];
}

/**
 * Create a video content block from a base64 string
 */
export function videoFromBase64(base64Data: string, mediaType: string = 'video/mp4'): VideoContent {
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
export function videoFromURL(url: string): VideoContent {
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
export function videoFromBuffer(buffer: Buffer, mediaType: string = 'video/mp4'): VideoContent {
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
export function videoFromFile(filePath: string): VideoContent {
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();

  const mediaTypes: Record<string, string> = {
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
export function withVideo(textContent: string, ...videos: VideoContent[]): MessageContent[] {
  return [text(textContent), ...videos];
}

/**
 * Create a document content block from a base64 string
 */
export function documentFromBase64(
  base64Data: string,
  mediaType: string = 'application/pdf',
  filename?: string
): DocumentContent {
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
export function documentFromURL(url: string, filename?: string): DocumentContent {
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
export function documentFromBuffer(
  buffer: Buffer,
  mediaType: string = 'application/pdf',
  filename?: string
): DocumentContent {
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
export function documentFromFile(filePath: string): DocumentContent {
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const filename = path.basename(filePath);

  const mediaTypes: Record<string, string> = {
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
export function withDocuments(textContent: string, ...documents: DocumentContent[]): MessageContent[] {
  return [text(textContent), ...documents];
}

/**
 * Create a user message with text and optional images
 */
export function userMessage(content: string | MessageContent | MessageContent[]): Message {
  return {
    role: 'user',
    content,
  };
}

/**
 * Create a system message
 */
export function systemMessage(content: string): Message {
  return {
    role: 'system',
    content,
  };
}

/**
 * Create an assistant message
 */
export function assistantMessage(content: string): Message {
  return {
    role: 'assistant',
    content,
  };
}

/**
 * Builder class for constructing conversations with multimodal content
 */
export class MessageBuilder {
  private messages: Message[] = [];

  /**
   * Add a system message
   */
  system(content: string): this {
    this.messages.push(systemMessage(content));
    return this;
  }

  /**
   * Add a user message with text
   */
  user(content: string): this {
    this.messages.push(userMessage(content));
    return this;
  }

  /**
   * Add a user message with text and images
   */
  userWithImages(textContent: string, ...images: ImageContent[]): this {
    this.messages.push(userMessage(withImages(textContent, ...images)));
    return this;
  }

  /**
   * Add a user message with text and audio
   */
  userWithAudio(textContent: string, ...audio: AudioContent[]): this {
    this.messages.push(userMessage(withAudio(textContent, ...audio)));
    return this;
  }

  /**
   * Add a user message with text and video
   */
  userWithVideo(textContent: string, ...videos: VideoContent[]): this {
    this.messages.push(userMessage(withVideo(textContent, ...videos)));
    return this;
  }

  /**
   * Add a user message with text and documents
   */
  userWithDocuments(textContent: string, ...documents: DocumentContent[]): this {
    this.messages.push(userMessage(withDocuments(textContent, ...documents)));
    return this;
  }

  /**
   * Add a user message with mixed content
   */
  userWithContent(textContent: string, ...content: MessageContent[]): this {
    this.messages.push(userMessage([text(textContent), ...content]));
    return this;
  }

  /**
   * Add an assistant message
   */
  assistant(content: string): this {
    this.messages.push(assistantMessage(content));
    return this;
  }

  /**
   * Add a custom message
   */
  add(message: Message): this {
    this.messages.push(message);
    return this;
  }

  /**
   * Build and return the messages array
   */
  build(): Message[] {
    return [...this.messages];
  }

  /**
   * Clear all messages
   */
  clear(): this {
    this.messages = [];
    return this;
  }
}

/**
 * Create a new message builder
 */
export function createMessageBuilder(): MessageBuilder {
  return new MessageBuilder();
}