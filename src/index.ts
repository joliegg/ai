import ChatGPT, { RealtimeSession } from './openai';
import Dream from './stability';
import DeepSeek from './deepseek';
import Gemini from './gemini';
import Grok from './grok';
import Claude from './claude';
import Mistral from './mistral';
import Ollama from './ollama';

export { ChatGPT, Dream, DeepSeek, Gemini, Grok, Claude, Mistral, Ollama, RealtimeSession };

export { Conversation, createConversation } from './conversation';

export {
  // Image helpers
  imageFromBase64,
  imageFromURL,
  imageFromBuffer,
  imageFromFile,
  // Audio helpers
  audioFromBase64,
  audioFromURL,
  audioFromBuffer,
  audioFromFile,
  // Video helpers
  videoFromBase64,
  videoFromURL,
  videoFromBuffer,
  videoFromFile,
  // Document helpers
  documentFromBase64,
  documentFromURL,
  documentFromBuffer,
  documentFromFile,
  // Text helpers
  text,
  withImages,
  withAudio,
  withVideo,
  withDocuments,
  // Message helpers
  userMessage,
  systemMessage,
  assistantMessage,
  // Message builder
  MessageBuilder,
  createMessageBuilder,
} from './helpers';

export type {
  // Message types
  MessageRole,
  TextContent,
  ImageContent,
  AudioContent,
  VideoContent,
  DocumentContent,
  ToolUseContent,
  ToolResultContent,
  MessageContent,
  Message,

  // Tool types
  ToolParameter,
  ToolDefinition,
  ToolCall,

  // Options types
  CompletionOptions,
  StreamOptions,
  ImageGenerationOptions,
  EmbeddingOptions,

  // Response types
  FinishReason,
  Response,
  Chunk,
  ImageResponse,
  EmbeddingResponse,

  // Audio types
  AudioResponseFormat,
  TTSVoice,
  TTSModel,
  TranscriptionOptions,
  TranscriptionResponse,
  TTSOptions,

  // Moderation types
  ModerationOptions,
  ModerationCategory,
  ModerationResult,

  // File types
  FilePurpose,
  FileUploadOptions,
  FileInfo,
  FileListResponse,

  // Model types
  ModelInfo,
  ModelListResponse,

  // Batch types
  BatchRequest,
  BatchResponse,

  // Conversation types
  ConversationOptions,

  // Token counting types
  TokenCountResult,

  // Video generation types
  VideoModel,
  VideoDuration,
  VideoSize,
  VideoStatus,
  VideoGenerationOptions,
  VideoJob,
  VideoResponse,

  // Realtime API types
  RealtimeVoice,
  RealtimeSessionConfig,
  RealtimeEvent,

  // Imagen types (Gemini)
  ImagenModel,
  ImagenAspectRatio,
  ImagenOptions,
  ImagenResponse,

  // Config types
  ProviderConfig,
  GlobalConfig,

  // Provider interfaces
  AIProvider,
  ImageGenerationProvider,
} from './types';

// Configuration function
export { configure, getGlobalConfig } from './types';

export {
  AIError,
  AuthenticationError,
  RateLimitError,
  InvalidRequestError,
  ContentFilterError,
  ModelNotFoundError,
  ContextLengthError,
  TimeoutError,
  NetworkError,
  ServerError,
  parseError,
  isRetryableError,
} from './errors';

export { withRetry, withTimeout, sleep, calculateBackoff, generateId } from './utils';

// OpenAI types
export type {
  Size as OpenAISize,
  Quality as OpenAIQuality,
  OutputFormat as OpenAIOutputFormat,
  Background as OpenAIBackground,
  ImageGenerationModel as OpenAIImageModel,
  GenerateOptions as OpenAIGenerateOptions,
} from './openai';

// Grok types
export type {
  OutputFormat as GrokOutputFormat,
  ImageGenerationModel as GrokImageModel,
  GenerateOptions as GrokGenerateOptions,
} from './grok';

// Stability types
export type {
  Style as StabilityStyle,
  AspectRatio as StabilityAspectRatio,
  OutputFormat as StabilityOutputFormat,
  Engine as StabilityEngine,
  SD3_Engine as StabilitySD3Engine,
  GenerateOptions as StabilityGenerateOptions,
  ImageToImageOptions as StabilityImageToImageOptions,
  DreamResponse as StabilityDreamResponse,
} from './stability';

// Claude types
export type { MODEL as ClaudeModel } from './claude';
