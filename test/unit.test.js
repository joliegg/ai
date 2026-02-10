const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const {
  ChatGPT,
  Claude,
  DeepSeek,
  Gemini,
  Grok,
  Mistral,
  Ollama,
  Qwen,
  Kimi,
  AIError,
  AuthenticationError,
  RateLimitError,
  InvalidRequestError,
  TimeoutError,
  parseError,
  isRetryableError,
  configure,
  getGlobalConfig,
  withRetry,
  sleep,
  calculateBackoff,
  Conversation,
  createConversation,
  createMessageBuilder,
  imageFromBase64,
  imageFromURL,
  imageFromBuffer,
  audioFromBase64,
  audioFromURL,
  audioFromBuffer,
  videoFromBase64,
  videoFromURL,
  documentFromBase64,
  documentFromURL,
  text,
  withImages,
  withAudio,
  withVideo,
  withDocuments,
  userMessage,
  systemMessage,
  assistantMessage,
} = require('./../dist');

// =============================================================================
// Mock for OpenAI client
// =============================================================================

class MockOpenAIClient {
  constructor() {
    this.apiKey = 'fake-key';
    this.chat = {
      completions: {
        create: async (params) => {
          this.lastChatParams = params;

          // Simulate streaming if stream: true
          if (params.stream) {
            return {
              async *[Symbol.asyncIterator]() {
                yield {
                  id: 'chatcmpl-123',
                  choices: [
                    {
                      delta: { content: 'Hello' },
                      finish_reason: null,
                    },
                  ],
                  model: params.model,
                };
                yield {
                  id: 'chatcmpl-123',
                  choices: [
                    {
                      delta: { content: ' World' },
                      finish_reason: 'stop',
                    },
                  ],
                  model: params.model,
                };
              },
            };
          }

          return {
            id: 'chatcmpl-123',
            model: params.model,
            choices: [
              {
                message: { content: 'Mock response', tool_calls: null },
                finish_reason: 'stop',
              },
            ],
            usage: {
              prompt_tokens: 10,
              completion_tokens: 5,
              total_tokens: 15,
            },
          };
        },
      },
    };
    this.images = {
      generate: async (params) => {
        this.lastImageParams = params;
        return {
          data: [
            {
              b64_json: Buffer.from('mock_image_data').toString('base64'),
            },
          ],
        };
      },
    };
    this.embeddings = {
      create: async (params) => {
        this.lastEmbeddingParams = params;
        return {
          data: [{ embedding: [0.1, 0.2, 0.3] }],
          model: params.model,
          usage: {
            prompt_tokens: 5,
            total_tokens: 5,
          },
        };
      },
    };
    this.audio = {
      transcriptions: {
        create: async (params) => {
          this.lastTranscriptionParams = params;
          return {
            text: 'Mock transcription',
            language: 'en',
            duration: 5.0,
            segments: [{ id: 0, start: 0, end: 5, text: 'Mock transcription' }],
          };
        },
      },
      speech: {
        create: async (params) => {
          this.lastSpeechParams = params;
          return {
            arrayBuffer: async () => Buffer.from('mock_audio_data').buffer,
          };
        },
      },
    };
    this.moderations = {
      create: async (params) => {
        this.lastModerationParams = params;
        return {
          id: 'modr-123',
          results: [
            {
              flagged: false,
              categories: {
                hate: false,
                'hate/threatening': false,
                harassment: false,
                'harassment/threatening': false,
                'self-harm': false,
                'self-harm/intent': false,
                'self-harm/instructions': false,
                sexual: false,
                'sexual/minors': false,
                violence: false,
                'violence/graphic': false,
              },
              category_scores: {
                hate: 0.001,
                'hate/threatening': 0.001,
                harassment: 0.001,
                'harassment/threatening': 0.001,
                'self-harm': 0.001,
                'self-harm/intent': 0.001,
                'self-harm/instructions': 0.001,
                sexual: 0.001,
                'sexual/minors': 0.001,
                violence: 0.001,
                'violence/graphic': 0.001,
              },
            },
          ],
        };
      },
    };
    this.models = {
      list: async () => {
        return {
          data: [
            { id: 'gpt-4o', created: 1700000000, owned_by: 'openai' },
            { id: 'gpt-5.2', created: 1700000001, owned_by: 'openai' },
            { id: 'text-embedding-3-small', created: 1700000002, owned_by: 'openai' },
          ],
        };
      },
      retrieve: async (modelId) => {
        return { id: modelId, created: 1700000000, owned_by: 'openai' };
      },
    };
    this.files = {
      create: async (params) => {
        this.lastFileParams = params;
        return {
          id: 'file-123',
          filename: 'test.txt',
          bytes: 100,
          created_at: 1700000000,
          purpose: params.purpose,
        };
      },
      list: async () => {
        return {
          data: [{ id: 'file-123', filename: 'test.txt', bytes: 100, created_at: 1700000000, purpose: 'assistants' }],
        };
      },
      delete: async () => {
        return { deleted: true };
      },
      content: async () => {
        return {
          arrayBuffer: async () => Buffer.from('file content').buffer,
        };
      },
    };
  }
}

// =============================================================================
// ChatGPT Unit Tests
// =============================================================================

describe('ChatGPT Unit Tests', () => {
  let chatGPT;
  let mockClient;

  beforeEach(() => {
    chatGPT = new ChatGPT('fake-key');
    mockClient = new MockOpenAIClient();
    // Inject mock client
    chatGPT._client = mockClient;
  });

  it('should complete chat successfully', async () => {
    const result = await chatGPT.complete([{ role: 'user', content: 'Hello' }]);
    assert.strictEqual(result.content, 'Mock response');
    assert.strictEqual(result.provider, 'openai');
    assert.strictEqual(mockClient.lastChatParams.model, 'gpt-5.2');
  });

  it('should use custom model', async () => {
    await chatGPT.complete([{ role: 'user', content: 'Hello' }], {
      model: 'gpt-4o-mini',
      maxTokens: 500,
    });
    assert.strictEqual(mockClient.lastChatParams.model, 'gpt-4o-mini');
  });

  it('should generate image successfully with valid params', async () => {
    const images = await chatGPT.generate({
      prompt: 'test',
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      model: 'dall-e-3',
      background: 'auto',
      format: 'png',
    });
    assert.ok(images[0] instanceof Buffer);
    assert.strictEqual(mockClient.lastImageParams.model, 'dall-e-3');
  });

  it('should throw error for invalid DALL-E 3 params (n > 1)', async () => {
    await assert.rejects(async () => {
      await chatGPT.generate({
        prompt: 'test',
        n: 2,
        size: '1024x1024',
        model: 'dall-e-3',
        quality: 'standard',
      });
    }, /DALL-E 3 only supports generating 1 image at a time/);
  });

  it('should throw error for invalid DALL-E 3 size', async () => {
    await assert.rejects(async () => {
      await chatGPT.generate({
        prompt: 'test',
        n: 1,
        size: '512x512',
        model: 'dall-e-3',
        quality: 'standard',
      });
    }, /Size must be one of/);
  });

  it('should throw error for more than 10 images', async () => {
    await assert.rejects(async () => {
      await chatGPT.generate({
        prompt: 'test',
        n: 11,
        size: '512x512',
        model: 'dall-e-2',
        quality: 'standard',
      });
    }, /Cannot generate more than 10 images at once/);
  });

  it('should generate embeddings successfully', async () => {
    const result = await chatGPT.embed('Hello world');
    assert.ok(Array.isArray(result.embeddings));
    assert.strictEqual(result.embeddings.length, 1);
    assert.strictEqual(result.provider, 'openai');
  });

  it('should return correct provider name', () => {
    assert.strictEqual(chatGPT.provider, 'openai');
  });

  it('should count tokens', () => {
    const messages = [
      { role: 'system', content: 'You are a helper.' },
      { role: 'user', content: 'Hello there!' },
    ];
    const result = chatGPT.countTokens(messages);
    assert.ok(result.tokens > 0);
    assert.strictEqual(result.provider, 'openai');
    assert.ok(result.breakdown);
  });

  it('should list models', async () => {
    const result = await chatGPT.listModels();
    assert.ok(Array.isArray(result.models));
    assert.strictEqual(result.models.length, 3);
    assert.strictEqual(result.provider, 'openai');
  });

  it('should get specific model', async () => {
    const result = await chatGPT.getModel('gpt-4o');
    assert.strictEqual(result.id, 'gpt-4o');
    assert.ok(result.capabilities);
  });

  it('should moderate content', async () => {
    const results = await chatGPT.moderate('Hello world');
    assert.ok(Array.isArray(results));
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].flagged, false);
    assert.ok(results[0].categories);
  });

  it('should upload file', async () => {
    const result = await chatGPT.uploadFile(Buffer.from('test'), { purpose: 'assistants' });
    assert.strictEqual(result.id, 'file-123');
    assert.strictEqual(result.provider, 'openai');
  });

  it('should list files', async () => {
    const result = await chatGPT.listFiles();
    assert.ok(Array.isArray(result.files));
    assert.strictEqual(result.provider, 'openai');
  });

  it('should delete file', async () => {
    const result = await chatGPT.deleteFile('file-123');
    assert.strictEqual(result, true);
  });

  it('should get file content', async () => {
    const result = await chatGPT.getFileContent('file-123');
    assert.ok(Buffer.isBuffer(result));
  });

  it('should process batch requests', async () => {
    const requests = [
      { id: '1', messages: [{ role: 'user', content: 'Hello' }] },
      { id: '2', messages: [{ role: 'user', content: 'World' }] },
    ];
    const results = await chatGPT.completeBatch(requests);
    assert.strictEqual(results.length, 2);
    assert.strictEqual(results[0].id, '1');
    assert.ok(results[0].response);
  });
});

// =============================================================================
// DeepSeek Unit Tests
// =============================================================================

describe('DeepSeek Unit Tests', () => {
  let deepSeek;
  let mockClient;

  beforeEach(() => {
    deepSeek = new DeepSeek('fake-key');
    mockClient = new MockOpenAIClient();
    deepSeek._client = mockClient;
  });

  it('should complete chat with correct default model', async () => {
    await deepSeek.complete([{ role: 'user', content: 'Hello' }]);
    assert.strictEqual(mockClient.lastChatParams.model, 'deepseek-reasoner');
  });

  it('should return correct provider name', () => {
    assert.strictEqual(deepSeek.provider, 'deepseek');
  });

  it('should generate embeddings with correct default model', async () => {
    await deepSeek.embed('Hello world');
    assert.strictEqual(mockClient.lastEmbeddingParams.model, 'deepseek-embedding-v2');
  });
});

// =============================================================================
// Grok Unit Tests
// =============================================================================

describe('Grok Unit Tests', () => {
  let grok;
  let mockClient;

  beforeEach(() => {
    grok = new Grok('fake-key');
    mockClient = new MockOpenAIClient();
    grok._client = mockClient;
  });

  it('should complete chat with correct default model', async () => {
    await grok.complete([{ role: 'user', content: 'Hello' }]);
    assert.strictEqual(mockClient.lastChatParams.model, 'grok-4-1-fast-reasoning');
  });

  it('should throw error if n > 10 for image generation', async () => {
    await assert.rejects(async () => {
      await grok.generate({
        prompt: 'test',
        n: 11,
        model: 'grok-2-image',
      });
    }, /Cannot generate more than 10 images at once/);
  });

  it('should return correct provider name', () => {
    assert.strictEqual(grok.provider, 'grok');
  });

  it('should throw error for video duration less than 1', async () => {
    await assert.rejects(async () => {
      await grok.generateVideo({
        prompt: 'test video',
        duration: 0,
      });
    }, /Video duration must be between 1 and 15 seconds/);
  });

  it('should throw error for video duration greater than 15', async () => {
    await assert.rejects(async () => {
      await grok.generateVideo({
        prompt: 'test video',
        duration: 20,
      });
    }, /Video duration must be between 1 and 15 seconds/);
  });

  it('should throw error for video generation with uninitialized client', async () => {
    const uninitGrok = new Grok();
    await assert.rejects(async () => {
      await uninitGrok.generateVideo({
        prompt: 'test video',
      });
    }, /Grok client not initialized/);
  });
});

// =============================================================================
// Mistral Unit Tests
// =============================================================================

describe('Mistral Unit Tests', () => {
  let mistral;
  let mockClient;

  beforeEach(() => {
    mistral = new Mistral('fake-key');
    mockClient = new MockOpenAIClient();
    mistral._client = mockClient;
  });

  it('should complete chat with correct default model', async () => {
    await mistral.complete([{ role: 'user', content: 'Hello' }]);
    assert.strictEqual(mockClient.lastChatParams.model, 'mistral-large-latest');
  });

  it('should return correct provider name', () => {
    assert.strictEqual(mistral.provider, 'mistral');
  });

  it('should generate embeddings with correct default model', async () => {
    await mistral.embed('Hello world');
    assert.strictEqual(mockClient.lastEmbeddingParams.model, 'mistral-embed');
  });
});

// =============================================================================
// Ollama Unit Tests
// =============================================================================

describe('Ollama Unit Tests', () => {
  let ollama;
  let mockClient;

  beforeEach(() => {
    ollama = new Ollama();
    mockClient = new MockOpenAIClient();
    ollama._client = mockClient;
  });

  it('should complete chat with correct default model', async () => {
    await ollama.complete([{ role: 'user', content: 'Hello' }]);
    assert.strictEqual(mockClient.lastChatParams.model, 'llama3.2');
  });

  it('should return correct provider name', () => {
    assert.strictEqual(ollama.provider, 'ollama');
  });
});

// =============================================================================
// Qwen Unit Tests
// =============================================================================

describe('Qwen Unit Tests', () => {
  let qwen;
  let mockClient;

  beforeEach(() => {
    qwen = new Qwen('fake-key');
    mockClient = new MockOpenAIClient();
    qwen._client = mockClient;
  });

  it('should complete chat with correct default model', async () => {
    await qwen.complete([{ role: 'user', content: 'Hello' }]);
    assert.strictEqual(mockClient.lastChatParams.model, 'qwen-plus');
  });

  it('should return correct provider name', () => {
    assert.strictEqual(qwen.provider, 'qwen');
  });

  it('should generate embeddings with correct default model', async () => {
    await qwen.embed('Hello world');
    assert.strictEqual(mockClient.lastEmbeddingParams.model, 'text-embedding-v4');
  });
});

// =============================================================================
// Kimi Unit Tests
// =============================================================================

describe('Kimi Unit Tests', () => {
  let kimi;
  let mockClient;

  beforeEach(() => {
    kimi = new Kimi('fake-key');
    mockClient = new MockOpenAIClient();
    kimi._client = mockClient;
  });

  it('should complete chat with correct default model', async () => {
    await kimi.complete([{ role: 'user', content: 'Hello' }]);
    assert.strictEqual(mockClient.lastChatParams.model, 'kimi-k2.5');
  });

  it('should return correct provider name', () => {
    assert.strictEqual(kimi.provider, 'kimi');
  });
});

// =============================================================================
// Error Classes Unit Tests
// =============================================================================

describe('Error Classes Unit Tests', () => {
  it('should create AIError with correct properties', () => {
    const error = new AIError('Test error', 'openai', 'TEST_CODE', 400);
    assert.strictEqual(error.message, 'Test error');
    assert.strictEqual(error.provider, 'openai');
    assert.strictEqual(error.code, 'TEST_CODE');
    assert.strictEqual(error.statusCode, 400);
    assert.strictEqual(error.name, 'AIError');
  });

  it('should create AuthenticationError with default message', () => {
    const error = new AuthenticationError('openai');
    assert.ok(error.message.includes('Authentication failed'));
    assert.strictEqual(error.statusCode, 401);
    assert.strictEqual(error.name, 'AuthenticationError');
  });

  it('should create RateLimitError with retryAfter', () => {
    const error = new RateLimitError('openai', 60);
    assert.ok(error.message.includes('Rate limit'));
    assert.strictEqual(error.retryAfter, 60);
    assert.strictEqual(error.statusCode, 429);
    assert.strictEqual(error.name, 'RateLimitError');
  });

  it('should create InvalidRequestError', () => {
    const error = new InvalidRequestError('openai', 'Invalid parameter');
    assert.strictEqual(error.message, 'Invalid parameter');
    assert.strictEqual(error.statusCode, 400);
    assert.strictEqual(error.name, 'InvalidRequestError');
  });

  it('should create TimeoutError', () => {
    const error = new TimeoutError('openai', 5000);
    assert.ok(error.message.includes('5000'));
    assert.strictEqual(error.statusCode, 408);
    assert.strictEqual(error.name, 'TimeoutError');
  });

  it('should serialize error to JSON', () => {
    const error = new AIError('Test error', 'openai', 'TEST', 500);
    const json = error.toJSON();
    assert.strictEqual(json.name, 'AIError');
    assert.strictEqual(json.message, 'Test error');
    assert.strictEqual(json.provider, 'openai');
    assert.strictEqual(json.code, 'TEST');
    assert.strictEqual(json.statusCode, 500);
  });

  it('should parse authentication error correctly', () => {
    const originalError = new Error('Invalid API key');
    originalError.status = 401;
    const parsed = parseError(originalError, 'openai');
    assert.ok(parsed instanceof AuthenticationError);
  });

  it('should parse rate limit error correctly', () => {
    const originalError = new Error('Rate limit exceeded');
    originalError.status = 429;
    const parsed = parseError(originalError, 'openai');
    assert.ok(parsed instanceof RateLimitError);
  });

  it('should identify retryable errors', () => {
    assert.strictEqual(isRetryableError(new RateLimitError('openai')), true);
    assert.strictEqual(isRetryableError(new TimeoutError('openai', 1000)), true);
    assert.strictEqual(isRetryableError(new AuthenticationError('openai')), false);
    assert.strictEqual(isRetryableError(new InvalidRequestError('openai', 'bad')), false);
  });
});

// =============================================================================
// Global Configuration Unit Tests
// =============================================================================

describe('Global Configuration Unit Tests', () => {
  it('should get default config', () => {
    const config = getGlobalConfig();
    assert.strictEqual(config.timeout, 60000);
    assert.strictEqual(config.maxRetries, 3);
    assert.strictEqual(config.retryDelay, 1000);
    assert.strictEqual(config.debug, false);
  });

  it('should update config with configure()', () => {
    configure({ debug: true, timeout: 30000 });
    const config = getGlobalConfig();
    assert.strictEqual(config.debug, true);
    assert.strictEqual(config.timeout, 30000);

    // Reset
    configure({ debug: false, timeout: 60000 });
  });
});

// =============================================================================
// Utility Functions Unit Tests
// =============================================================================

describe('Utility Functions Unit Tests', () => {
  it('should sleep for specified duration', async () => {
    const start = Date.now();
    await sleep(50);
    const elapsed = Date.now() - start;
    assert.ok(elapsed >= 45, `Expected at least 45ms, got ${elapsed}ms`);
  });

  it('should calculate exponential backoff', () => {
    const delay1 = calculateBackoff(1, 1000, 60000);
    const delay2 = calculateBackoff(2, 1000, 60000);
    const delay3 = calculateBackoff(3, 1000, 60000);

    // First attempt should be around 1000ms (+ jitter)
    assert.ok(delay1 >= 1000 && delay1 <= 1250);
    // Second attempt should be around 2000ms (+ jitter)
    assert.ok(delay2 >= 2000 && delay2 <= 2500);
    // Third attempt should be around 4000ms (+ jitter)
    assert.ok(delay3 >= 4000 && delay3 <= 5000);
  });

  it('should respect max delay in backoff', () => {
    const delay = calculateBackoff(10, 1000, 5000);
    assert.ok(delay <= 5000);
  });

  it('should retry on retryable error', async () => {
    let attempts = 0;

    const result = await withRetry(
      async () => {
        attempts++;
        if (attempts < 3) {
          const error = new Error('Rate limit');
          error.status = 429;
          throw error;
        }
        return 'success';
      },
      'test',
      { maxRetries: 3, retryDelay: 10 }
    );

    assert.strictEqual(result, 'success');
    assert.strictEqual(attempts, 3);
  });

  it('should not retry on non-retryable error', async () => {
    let attempts = 0;

    await assert.rejects(async () => {
      await withRetry(
        async () => {
          attempts++;
          const error = new Error('Invalid request');
          error.status = 400;
          throw error;
        },
        'test',
        { maxRetries: 3, retryDelay: 10 }
      );
    }, /Invalid request/);

    assert.strictEqual(attempts, 1);
  });
});

// =============================================================================
// Unified Interface Tests
// =============================================================================

describe('Unified Interface Tests', () => {
  let chatGPT;
  let mockClient;

  beforeEach(() => {
    chatGPT = new ChatGPT('fake-key');
    mockClient = new MockOpenAIClient();
    chatGPT._client = mockClient;
  });

  it('should use complete with unified message format', async () => {
    const result = await chatGPT.complete([
      { role: 'system', content: 'You are a helpful assistant' },
      { role: 'user', content: 'Hello' },
    ]);

    assert.strictEqual(result.provider, 'openai');
    assert.strictEqual(result.content, 'Mock response');
    assert.strictEqual(result.finishReason, 'stop');
    assert.ok(result.usage);
    assert.strictEqual(result.usage.totalTokens, 15);
  });

  it('should stream completions', async () => {
    const chunks = [];
    for await (const chunk of chatGPT.stream([{ role: 'user', content: 'Hello' }])) {
      chunks.push(chunk);
    }

    assert.ok(chunks.length >= 2);
    assert.strictEqual(chunks[0].delta.content, 'Hello');
    assert.strictEqual(chunks[1].delta.content, ' World');
    assert.strictEqual(chunks[1].finishReason, 'stop');
  });

  it('should call onToken callback during streaming', async () => {
    const tokens = [];
    for await (const chunk of chatGPT.stream([{ role: 'user', content: 'Hello' }], {
      onToken: (token) => tokens.push(token),
    })) {
      // Just iterate
    }

    assert.deepStrictEqual(tokens, ['Hello', ' World']);
  });
});

// =============================================================================
// Conversation Manager Tests
// =============================================================================

describe('Conversation Manager Tests', () => {
  let chatGPT;
  let mockClient;

  beforeEach(() => {
    chatGPT = new ChatGPT('fake-key');
    mockClient = new MockOpenAIClient();
    chatGPT._client = mockClient;
  });

  it('should create conversation with system prompt', () => {
    const conversation = createConversation(chatGPT, {
      systemPrompt: 'You are a helpful assistant.',
    });
    const history = conversation.getHistory();
    assert.strictEqual(history.length, 1);
    assert.strictEqual(history[0].role, 'system');
  });

  it('should send messages and maintain history', async () => {
    const conversation = createConversation(chatGPT);
    await conversation.send('Hello');

    const history = conversation.getHistory();
    assert.strictEqual(history.length, 2); // user + assistant
    assert.strictEqual(history[0].role, 'user');
    assert.strictEqual(history[1].role, 'assistant');
  });

  it('should clear history but keep system prompt', async () => {
    const conversation = createConversation(chatGPT, {
      systemPrompt: 'You are a helper.',
    });
    await conversation.send('Hello');
    conversation.clear();

    const history = conversation.getHistory();
    assert.strictEqual(history.length, 1);
    assert.strictEqual(history[0].role, 'system');
  });

  it('should undo last exchange', async () => {
    const conversation = createConversation(chatGPT);
    await conversation.send('Hello');
    await conversation.send('How are you?');

    conversation.undo();
    const history = conversation.getHistory();
    assert.strictEqual(history.length, 2); // Only first exchange
  });

  it('should fork conversation', async () => {
    const conversation = createConversation(chatGPT);
    await conversation.send('Hello');

    const forked = conversation.fork();
    await forked.send('Goodbye');

    assert.strictEqual(conversation.length, 2);
    assert.strictEqual(forked.length, 4);
  });

  it('should reset with new system prompt', async () => {
    const conversation = createConversation(chatGPT, {
      systemPrompt: 'Old prompt',
    });
    await conversation.send('Hello');
    conversation.reset('New prompt');

    const history = conversation.getHistory();
    assert.strictEqual(history.length, 1);
    assert.strictEqual(history[0].content, 'New prompt');
  });

  it('should report length excluding system', async () => {
    const conversation = createConversation(chatGPT, {
      systemPrompt: 'System',
    });
    await conversation.send('Hello');

    assert.strictEqual(conversation.length, 2); // user + assistant, not system
  });
});

// =============================================================================
// Message Helpers Tests
// =============================================================================

describe('Message Helpers Tests', () => {
  it('should create image from base64', () => {
    const content = imageFromBase64('abc123', 'image/png');
    assert.strictEqual(content.type, 'image');
    assert.strictEqual(content.source.type, 'base64');
    assert.strictEqual(content.source.data, 'abc123');
    assert.strictEqual(content.source.mediaType, 'image/png');
  });

  it('should create image from URL', () => {
    const content = imageFromURL('https://example.com/image.png');
    assert.strictEqual(content.type, 'image');
    assert.strictEqual(content.source.type, 'url');
    assert.strictEqual(content.source.data, 'https://example.com/image.png');
  });

  it('should create image from buffer', () => {
    const buffer = Buffer.from('test');
    const content = imageFromBuffer(buffer);
    assert.strictEqual(content.type, 'image');
    assert.strictEqual(content.source.type, 'base64');
    assert.strictEqual(content.source.data, buffer.toString('base64'));
  });

  it('should create audio from base64', () => {
    const content = audioFromBase64('audiodata', 'audio/mp3');
    assert.strictEqual(content.type, 'audio');
    assert.strictEqual(content.source.type, 'base64');
  });

  it('should create audio from URL', () => {
    const content = audioFromURL('https://example.com/audio.mp3');
    assert.strictEqual(content.type, 'audio');
    assert.strictEqual(content.source.type, 'url');
  });

  it('should create video from base64', () => {
    const content = videoFromBase64('videodata', 'video/mp4');
    assert.strictEqual(content.type, 'video');
    assert.strictEqual(content.source.type, 'base64');
  });

  it('should create video from URL', () => {
    const content = videoFromURL('https://example.com/video.mp4');
    assert.strictEqual(content.type, 'video');
    assert.strictEqual(content.source.type, 'url');
  });

  it('should create document from base64', () => {
    const content = documentFromBase64('docdata', 'application/pdf');
    assert.strictEqual(content.type, 'document');
    assert.strictEqual(content.source.type, 'base64');
  });

  it('should create document from URL', () => {
    const content = documentFromURL('https://example.com/doc.pdf');
    assert.strictEqual(content.type, 'document');
    assert.strictEqual(content.source.type, 'url');
  });

  it('should create text content', () => {
    const content = text('Hello world');
    assert.strictEqual(content.type, 'text');
    assert.strictEqual(content.text, 'Hello world');
  });

  it('should combine text with images', () => {
    const image = imageFromURL('https://example.com/img.png');
    const content = withImages('Describe this:', image);
    assert.strictEqual(content.length, 2);
    assert.strictEqual(content[0].type, 'text');
    assert.strictEqual(content[1].type, 'image');
  });

  it('should combine text with audio', () => {
    const audio = audioFromURL('https://example.com/audio.mp3');
    const content = withAudio('Listen to this:', audio);
    assert.strictEqual(content.length, 2);
    assert.strictEqual(content[0].type, 'text');
    assert.strictEqual(content[1].type, 'audio');
  });

  it('should combine text with video', () => {
    const video = videoFromURL('https://example.com/video.mp4');
    const content = withVideo('Watch this:', video);
    assert.strictEqual(content.length, 2);
    assert.strictEqual(content[0].type, 'text');
    assert.strictEqual(content[1].type, 'video');
  });

  it('should combine text with documents', () => {
    const doc = documentFromURL('https://example.com/doc.pdf');
    const content = withDocuments('Review this:', doc);
    assert.strictEqual(content.length, 2);
    assert.strictEqual(content[0].type, 'text');
    assert.strictEqual(content[1].type, 'document');
  });

  it('should create user message', () => {
    const msg = userMessage('Hello');
    assert.strictEqual(msg.role, 'user');
    assert.strictEqual(msg.content, 'Hello');
  });

  it('should create system message', () => {
    const msg = systemMessage('You are helpful');
    assert.strictEqual(msg.role, 'system');
    assert.strictEqual(msg.content, 'You are helpful');
  });

  it('should create assistant message', () => {
    const msg = assistantMessage('Hi there');
    assert.strictEqual(msg.role, 'assistant');
    assert.strictEqual(msg.content, 'Hi there');
  });
});

// =============================================================================
// Message Builder Tests
// =============================================================================

describe('Message Builder Tests', () => {
  it('should build messages with fluent API', () => {
    const builder = createMessageBuilder();
    builder.system('You are helpful').user('Hello').assistant('Hi!');

    const messages = builder.build();
    assert.strictEqual(messages.length, 3);
    assert.strictEqual(messages[0].role, 'system');
    assert.strictEqual(messages[1].role, 'user');
    assert.strictEqual(messages[2].role, 'assistant');
  });

  it('should support method chaining', () => {
    const messages = createMessageBuilder().system('Test').user('Question').build();

    assert.strictEqual(messages.length, 2);
  });

  it('should clear messages', () => {
    const builder = createMessageBuilder();
    builder.user('Hello');
    builder.clear();

    assert.strictEqual(builder.build().length, 0);
  });

  it('should add arbitrary message', () => {
    const builder = createMessageBuilder();
    builder.add({ role: 'tool', content: 'result' });

    const messages = builder.build();
    assert.strictEqual(messages[0].role, 'tool');
  });

  it('should support user with images', () => {
    const builder = createMessageBuilder();
    const image = imageFromURL('https://example.com/img.png');
    builder.userWithImages('What is this?', image);

    const messages = builder.build();
    assert.strictEqual(messages.length, 1);
    assert.ok(Array.isArray(messages[0].content));
  });

  it('should support user with audio', () => {
    const builder = createMessageBuilder();
    const audio = audioFromURL('https://example.com/audio.mp3');
    builder.userWithAudio('What do you hear?', audio);

    const messages = builder.build();
    assert.ok(Array.isArray(messages[0].content));
    assert.strictEqual(messages[0].content.length, 2);
  });

  it('should support user with video', () => {
    const builder = createMessageBuilder();
    const video = videoFromURL('https://example.com/video.mp4');
    builder.userWithVideo('What happens in this video?', video);

    const messages = builder.build();
    assert.ok(Array.isArray(messages[0].content));
  });

  it('should support user with documents', () => {
    const builder = createMessageBuilder();
    const doc = documentFromURL('https://example.com/doc.pdf');
    builder.userWithDocuments('Summarize this:', doc);

    const messages = builder.build();
    assert.ok(Array.isArray(messages[0].content));
  });
});

// =============================================================================
// Audio Features Tests (Mock)
// =============================================================================

describe('Audio Features Tests', () => {
  let chatGPT;
  let mockClient;

  beforeEach(() => {
    chatGPT = new ChatGPT('fake-key');
    mockClient = new MockOpenAIClient();
    chatGPT._client = mockClient;
  });

  it('should transcribe audio buffer', async () => {
    const result = await chatGPT.transcribe(Buffer.from('audio'));
    assert.strictEqual(result.text, 'Mock transcription');
    assert.strictEqual(result.provider, 'openai');
  });

  it('should generate speech', async () => {
    const result = await chatGPT.speak('Hello world');
    assert.ok(Buffer.isBuffer(result));
  });

  it('should use custom voice for TTS', async () => {
    await chatGPT.speak('Hello', { voice: 'nova', model: 'tts-1-hd' });
    assert.strictEqual(mockClient.lastSpeechParams.voice, 'nova');
    assert.strictEqual(mockClient.lastSpeechParams.model, 'tts-1-hd');
  });
});

// =============================================================================
// Mocks for Feature Tests
// =============================================================================

class MockGoogleGenAI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.lastGenerateParams = null; // Initialize
    this.models = {
      generateContent: async (params) => {
        this.lastGenerateParams = params;
        return {
          candidates: [
            {
              content: {
                parts: [{ text: 'Mock response' }],
              },
              finishReason: 'STOP',
            },
          ],
          usageMetadata: {
            promptTokenCount: 10,
            candidatesTokenCount: 5,
            totalTokenCount: 15,
          },
        };
      },
      generateContentStream: async function* (params) {
        this.lastStreamParams = params;
        yield {
          candidates: [
            {
              content: { parts: [{ text: 'Mock' }] },
            },
          ],
        };
        yield {
          candidates: [
            {
              content: { parts: [{ text: ' response' }] },
              finishReason: 'STOP',
            },
          ],
        };
      },
    };
  }
}

class MockAnthropic {
  constructor(options) {
    this.apiKey = options.apiKey;
    this.messages = {
      create: async (params) => {
        this.lastParams = params;
        return {
          id: 'mock-id',
          model: params.model,
          content: [{ type: 'text', text: 'Mock response' }],
          stop_reason: 'end_turn',
          usage: { input_tokens: 5, output_tokens: 5 }
        };
      }
    };
  }
}

// =============================================================================
// Gemini Feature Tests
// =============================================================================

describe('Gemini Feature Tests', () => {
  let gemini;
  let mockClient;

  beforeEach(() => {
    gemini = new Gemini('fake-key');
    mockClient = new MockGoogleGenAI('fake-key');
    // Inject mock client
    gemini._client = mockClient;
  });

  it('should use gemini-2.5-pro as default model', async () => {
    await gemini.complete([{ role: 'user', content: 'Hello' }]);
    assert.strictEqual(mockClient.lastGenerateParams.model, 'gemini-2.5-pro');
  });

  it('should set responseMimeType for JSON mode', async () => {
    await gemini.complete([{ role: 'user', content: 'Hello' }], {
      responseFormat: 'json',
    });
    assert.strictEqual(
      mockClient.lastGenerateParams.config.responseMimeType,
      'application/json'
    );
  });

  it('should include googleSearchRetrieval tool when searchGrounding is true', async () => {
    await gemini.complete([{ role: 'user', content: 'Hello' }], {
      searchGrounding: true,
    });
    const tools = mockClient.lastGenerateParams.config.tools;
    const hasSearch = tools.some((t) => t.googleSearchRetrieval);
    assert.ok(hasSearch, 'Should have googleSearchRetrieval tool');
  });

  it('should include codeExecution tool when codeExecution is true', async () => {
    await gemini.complete([{ role: 'user', content: 'Hello' }], {
      codeExecution: true,
    });
    const tools = mockClient.lastGenerateParams.config.tools;
    const hasCodeExec = tools.some((t) => t.codeExecution);
    assert.ok(hasCodeExec, 'Should have codeExecution tool');
  });

  it('should support mixed tools (custom + search + code)', async () => {
    const customTool = {
      name: 'test_tool',
      description: 'A test tool',
      parameters: {
        type: 'object',
        properties: { param: { type: 'string' } },
      },
    };

    await gemini.complete([{ role: 'user', content: 'Hello' }], {
      tools: [customTool],
      searchGrounding: true,
      codeExecution: true,
    });

    const tools = mockClient.lastGenerateParams.config.tools;
    assert.strictEqual(tools.length, 3);
    assert.ok(tools.some((t) => t.functionDeclarations));
    assert.ok(tools.some((t) => t.googleSearchRetrieval));
    assert.ok(tools.some((t) => t.codeExecution));
  });
});

// =============================================================================
// Reasoning Feature Tests
// =============================================================================

describe('Reasoning Feature Tests', () => {
  describe('OpenAI Reasoning', () => {
    let chatgpt;
    let mockClient;

    beforeEach(() => {
      chatgpt = new ChatGPT('fake-key');
      // Reuse MockOpenAIClient from unit.test.js but ensure it captures params
      mockClient = new MockOpenAIClient();
      // MockOpenAIClient stores params in this.lastChatParams
      chatgpt._client = mockClient;
    });

    it('should pass reasoning_effort for o1 models', async () => {
      await chatgpt.complete([{ role: 'user', content: 'Solve this' }], {
        model: 'o1-preview',
        reasoning: { effort: 'high' }
      });
      assert.strictEqual(mockClient.lastChatParams.reasoning_effort, 'high');
    });

    it('should pass reasoning_effort for o3 models', async () => {
      await chatgpt.complete([{ role: 'user', content: 'Solve this' }], {
        model: 'o3-mini',
        reasoning: { effort: 'medium' }
      });
      assert.strictEqual(mockClient.lastChatParams.reasoning_effort, 'medium');
    });

    it('should NOT pass reasoning_effort for gpt-4', async () => {
      await chatgpt.complete([{ role: 'user', content: 'Solve this' }], {
        model: 'gpt-4o',
        reasoning: { effort: 'high' }
      });
      assert.strictEqual(mockClient.lastChatParams.reasoning_effort, undefined);
    });
  });

  describe('DeepSeek Reasoning', () => {
    let deepseek;
    let mockClient;

    beforeEach(() => {
      deepseek = new DeepSeek('fake-key');
      mockClient = new MockOpenAIClient();
      deepseek._client = mockClient;
    });

    it('should use deepseek-reasoner as default model', async () => {
      await deepseek.complete([{ role: 'user', content: 'Think' }]);
      assert.strictEqual(mockClient.lastChatParams.model, 'deepseek-reasoner');
    });
  });

  describe('Grok Reasoning', () => {
    let grok;
    let mockClient;

    beforeEach(() => {
      grok = new Grok('fake-key');
      mockClient = new MockOpenAIClient();
      grok._client = mockClient;
    });

    it('should use grok-4-1-fast-reasoning as default model', async () => {
      await grok.complete([{ role: 'user', content: 'Think' }]);
      assert.strictEqual(mockClient.lastChatParams.model, 'grok-4-1-fast-reasoning');
    });
  });

  describe('Claude Extended Thinking', () => {
    let claude;
    let mockClient;

    beforeEach(() => {
      claude = new Claude('fake-key');
      mockClient = new MockAnthropic({ apiKey: 'fake-key' });
      claude._client = mockClient;
    });

    it('should enable thinking when budget is provided', async () => {
      await claude.complete([{ role: 'user', content: 'Think hard' }], {
        reasoning: { budget: 1000 }
      });

      assert.deepStrictEqual(mockClient.lastParams.thinking, {
        type: 'enabled',
        budget_tokens: 1000
      });
    });

    it('should set higher max_tokens when using thinking', async () => {
      await claude.complete([{ role: 'user', content: 'Think hard' }], {
        reasoning: { budget: 2000 },
        maxTokens: 1000 // Too low
      });

      assert.strictEqual(mockClient.lastParams.max_tokens, 2000 + 4096);
    });

    it('should NOT enable thinking if no budget provided', async () => {
      await claude.complete([{ role: 'user', content: 'Normal chat' }], {
        reasoning: { effort: 'high' } // Effort is OpenAI only
      });

      assert.strictEqual(mockClient.lastParams.thinking, undefined);
    });
  });
});

// =============================================================================
// Conversation Improvements Tests
// =============================================================================

/**
 * Helper: create a mock provider that resolves/rejects on demand.
 */
function createMockProvider(overrides = {}) {
  return {
    provider: 'mock',
    complete: async (messages, options) => ({
      id: 'resp-1',
      provider: 'mock',
      model: 'mock-model',
      content: 'Mock reply',
      finishReason: 'stop',
      usage: { promptTokens: 5, completionTokens: 3, totalTokens: 8 },
    }),
    stream: async function* (messages, options) {
      yield {
        id: 'stream-1',
        provider: 'mock',
        model: 'mock-model',
        delta: { content: 'Hello' },
      };
      yield {
        id: 'stream-1',
        provider: 'mock',
        model: 'mock-model',
        delta: { content: ' World' },
        finishReason: 'stop',
      };
    },
    ...overrides,
  };
}

// -----------------------------------------------------------------------------
// Error Rollback Tests
// -----------------------------------------------------------------------------

describe('Error Rollback Tests', () => {
  it('send() rolls back user message on API error', async () => {
    const provider = createMockProvider({
      complete: async () => { throw new Error('API failure'); },
    });
    const conv = createConversation(provider);

    await assert.rejects(() => conv.send('Hello'), /API failure/);
    assert.strictEqual(conv.getHistory().length, 0);
  });

  it('sendStream() rolls back user message on stream error', async () => {
    const provider = createMockProvider({
      stream: async function* () {
        yield { id: 's1', provider: 'mock', model: 'm', delta: { content: 'Hi' } };
        throw new Error('Stream broke');
      },
    });
    const conv = createConversation(provider);

    await assert.rejects(async () => {
      for await (const _chunk of conv.sendStream('Hello')) { /* consume */ }
    }, /Stream broke/);
    assert.strictEqual(conv.getHistory().length, 0);
  });

  it('send() preserves existing history on error (first succeeds, second fails)', async () => {
    let callCount = 0;
    const provider = createMockProvider({
      complete: async () => {
        callCount++;
        if (callCount === 2) throw new Error('Second call fails');
        return {
          id: 'r1', provider: 'mock', model: 'm', content: 'Reply 1',
          finishReason: 'stop',
        };
      },
    });
    const conv = createConversation(provider);

    await conv.send('First');
    assert.strictEqual(conv.getHistory().length, 2); // user + assistant

    await assert.rejects(() => conv.send('Second'), /Second call fails/);
    // Should still have exactly the first exchange
    assert.strictEqual(conv.getHistory().length, 2);
    assert.strictEqual(conv.getHistory()[0].content, 'First');
  });
});

// -----------------------------------------------------------------------------
// Stream Tool Call Accumulation Tests
// -----------------------------------------------------------------------------

describe('Stream Tool Call Accumulation Tests', () => {
  it('sendStream() captures tool calls in history via onToolCall callback', async () => {
    const provider = createMockProvider({
      stream: async function* (messages, options) {
        yield {
          id: 's1', provider: 'mock', model: 'm',
          delta: { content: 'I will use a tool' },
        };
        yield {
          id: 's1', provider: 'mock', model: 'm',
          delta: {},
          finishReason: 'tool_calls',
        };
        // Simulate onToolCall being called after stream ends (like base-openai does)
        if (options.onToolCall) {
          options.onToolCall({
            id: 'call_1',
            name: 'get_weather',
            arguments: { city: 'NYC' },
          });
        }
      },
    });
    const conv = createConversation(provider);

    for await (const _chunk of conv.sendStream('What is the weather?')) { /* consume */ }

    const history = conv.getHistory();
    assert.strictEqual(history.length, 2); // user + assistant
    const assistantMsg = history[1];
    assert.ok(Array.isArray(assistantMsg.content));
    const toolUsePart = assistantMsg.content.find((p) => p.type === 'tool_use');
    assert.ok(toolUsePart, 'Should have a tool_use content part');
    assert.strictEqual(toolUsePart.name, 'get_weather');
    assert.deepStrictEqual(toolUsePart.input, { city: 'NYC' });
  });

  it('sendStream() chains user-provided onToolCall callback', async () => {
    const userCalls = [];
    const provider = createMockProvider({
      stream: async function* (messages, options) {
        yield { id: 's1', provider: 'mock', model: 'm', delta: { content: 'ok' } };
        yield { id: 's1', provider: 'mock', model: 'm', delta: {}, finishReason: 'tool_calls' };
        if (options.onToolCall) {
          options.onToolCall({ id: 'call_2', name: 'search', arguments: { q: 'test' } });
        }
      },
    });
    const conv = createConversation(provider);

    for await (const _chunk of conv.sendStream('search', {
      onToolCall: (tc) => userCalls.push(tc),
    })) { /* consume */ }

    assert.strictEqual(userCalls.length, 1);
    assert.strictEqual(userCalls[0].name, 'search');
  });
});

// -----------------------------------------------------------------------------
// Exchange-Aware Trimming Tests
// -----------------------------------------------------------------------------

describe('Exchange-Aware Trimming Tests', () => {
  it('trims whole exchanges, not individual messages', async () => {
    const provider = createMockProvider();
    const conv = createConversation(provider, { maxHistory: 4 });

    // Send 3 exchanges: each creates user + assistant = 6 non-system messages total
    await conv.send('msg1');
    await conv.send('msg2');
    await conv.send('msg3');

    const history = conv.getHistory();
    // maxHistory=4, so oldest exchange(s) trimmed by exchange boundary
    // 3 exchanges = 6 messages. We need ≤4. Remove first exchange → 4 messages.
    assert.strictEqual(history.length, 4);
    assert.strictEqual(history[0].content, 'msg2');
  });

  it('never splits tool-use/tool-result sequences', async () => {
    const provider = createMockProvider({
      complete: async () => ({
        id: 'r1', provider: 'mock', model: 'm', content: 'Reply',
        finishReason: 'stop',
      }),
    });
    const conv = createConversation(provider, { maxHistory: 4 });

    // First exchange: user → assistant
    await conv.send('msg1');
    // Add tool result (part of first exchange context)
    conv.addToolResult('tool_1', 'result1');
    // Second exchange: user → assistant
    await conv.send('msg2');
    // Third exchange: user → assistant
    await conv.send('msg3');

    const history = conv.getHistory();
    // Verify no orphaned tool results - tool messages should stick with their exchange
    const toolMessages = history.filter((m) => m.role === 'tool');
    for (const tm of toolMessages) {
      const idx = history.indexOf(tm);
      // A tool message should always be preceded by an assistant message, not be first
      assert.ok(idx > 0, 'Tool message should not be first in history');
    }
  });

  it('keeps at least one exchange even if over limit', async () => {
    const provider = createMockProvider();
    // maxHistory=1 but one exchange has at least 2 messages (user + assistant)
    const conv = createConversation(provider, { maxHistory: 1 });

    await conv.send('Hello');

    const history = conv.getHistory();
    // Should keep at least 1 exchange (2 messages)
    assert.ok(history.length >= 2);
  });

  it('no trimming when under limit', async () => {
    const provider = createMockProvider();
    const conv = createConversation(provider, { maxHistory: 20 });

    await conv.send('msg1');
    await conv.send('msg2');

    assert.strictEqual(conv.getHistory().length, 4); // 2 exchanges × 2 messages
  });
});

// -----------------------------------------------------------------------------
// Deep Clone Tests
// -----------------------------------------------------------------------------

describe('Deep Clone Tests', () => {
  it('mutating returned history does not affect conversation', async () => {
    const provider = createMockProvider();
    const conv = createConversation(provider);
    await conv.send('Hello');

    const history = conv.getHistory();
    history[0].content = 'MUTATED';
    history.push({ role: 'user', content: 'injected' });

    const fresh = conv.getHistory();
    assert.strictEqual(fresh[0].content, 'Hello');
    assert.strictEqual(fresh.length, 2);
  });

  it('getHistory returns independent copy', async () => {
    const provider = createMockProvider();
    const conv = createConversation(provider);
    await conv.send('Hello');

    const h1 = conv.getHistory();
    const h2 = conv.getHistory();
    assert.notStrictEqual(h1, h2);
    assert.notStrictEqual(h1[0], h2[0]);
  });
});

// -----------------------------------------------------------------------------
// Serialization Tests
// -----------------------------------------------------------------------------

describe('Serialization Tests', () => {
  it('toJSON() captures version, options, history', async () => {
    const provider = createMockProvider();
    const conv = createConversation(provider, {
      systemPrompt: 'You are helpful',
      model: 'test-model',
    });
    await conv.send('Hello');

    const json = conv.toJSON();
    assert.strictEqual(json.version, 1);
    assert.strictEqual(json.options.systemPrompt, 'You are helpful');
    assert.strictEqual(json.options.model, 'test-model');
    assert.ok(json.history.length >= 2); // system + user + assistant
  });

  it('fromJSON() restores state correctly', async () => {
    const provider = createMockProvider();
    const conv = createConversation(provider, { systemPrompt: 'Be nice' });
    await conv.send('Hello');

    const json = conv.toJSON();
    const restored = Conversation.fromJSON(provider, json);

    const origHistory = conv.getHistory();
    const restoredHistory = restored.getHistory();
    assert.deepStrictEqual(restoredHistory, origHistory);
  });

  it('round-trip preserves tool call history', async () => {
    const provider = createMockProvider({
      complete: async () => ({
        id: 'r1', provider: 'mock', model: 'm',
        content: 'Using tool',
        toolCalls: [{ id: 'tc1', name: 'calc', arguments: { expr: '2+2' } }],
        finishReason: 'tool_calls',
      }),
    });
    const conv = createConversation(provider);
    await conv.send('Calculate 2+2');
    conv.addToolResult('tc1', '4', 'calc');

    const json = conv.toJSON();
    const restored = Conversation.fromJSON(provider, json);

    assert.deepStrictEqual(restored.getHistory(), conv.getHistory());
  });

  it('restored conversation allows continued chat', async () => {
    const provider = createMockProvider();
    const conv = createConversation(provider, { systemPrompt: 'Hi' });
    await conv.send('First');

    const json = conv.toJSON();
    const restored = Conversation.fromJSON(provider, json);
    await restored.send('Second');

    // Original has 3 messages (system + user + assistant), restored has 5
    assert.strictEqual(conv.getHistory().length, 3);
    assert.strictEqual(restored.getHistory().length, 5);
  });

  it('fromJSON() rejects unknown version', () => {
    const provider = createMockProvider();
    assert.throws(
      () => Conversation.fromJSON(provider, { version: 99, options: {}, history: [] }),
      /Unsupported conversation version: 99/
    );
  });
});

// -----------------------------------------------------------------------------
// Token-Aware Context Management Tests
// -----------------------------------------------------------------------------

describe('Token-Aware Context Management Tests', () => {
  it('trims exchanges when over token budget', async () => {
    const provider = createMockProvider();
    // Very small token budget to force trimming
    const conv = createConversation(provider, { maxContextTokens: 30 });

    await conv.send('First message with some content here');
    await conv.send('Second message with more content here');
    await conv.send('Third message with even more content');

    const history = conv.getHistory();
    // Should have trimmed older exchanges to fit within budget
    // At minimum, keeps 1 exchange
    assert.ok(history.length >= 2, 'Should keep at least one exchange');
    assert.ok(history.length < 6, 'Should have trimmed some exchanges');
  });

  it('token budget works alongside maxHistory (stricter wins)', async () => {
    const provider = createMockProvider();
    // maxHistory is generous, but token budget is tight
    const conv = createConversation(provider, { maxHistory: 100, maxContextTokens: 30 });

    await conv.send('First message with lots of content padding here');
    await conv.send('Second message also with lots of content padding');
    await conv.send('Third message yet more content padding here too');

    const history = conv.getHistory();
    // Token budget should be the binding constraint
    assert.ok(history.length < 6, 'Token budget should trim even though maxHistory is generous');
  });

  it('system prompt tokens count against budget', async () => {
    const longSystemPrompt = 'A'.repeat(200); // ~50+ tokens
    const provider = createMockProvider();
    const conv = createConversation(provider, {
      systemPrompt: longSystemPrompt,
      maxContextTokens: 60,
    });

    await conv.send('msg1');
    await conv.send('msg2');

    const history = conv.getHistory();
    // System prompt takes significant tokens, so fewer exchanges fit
    const systemMsg = history.find((m) => m.role === 'system');
    assert.ok(systemMsg, 'System prompt should be preserved');
  });
});

// -----------------------------------------------------------------------------
// Message Editing Tests
// -----------------------------------------------------------------------------

describe('Message Editing Tests', () => {
  it('replaces content and truncates after', async () => {
    const provider = createMockProvider();
    const conv = createConversation(provider);
    await conv.send('First');
    await conv.send('Second');

    // Edit the first user message (index 0)
    conv.editMessage(0, 'Edited first');

    const history = conv.getHistory();
    assert.strictEqual(history.length, 1);
    assert.strictEqual(history[0].content, 'Edited first');
    assert.strictEqual(history[0].role, 'user');
  });

  it('editMessage() + send() rebuilds from that point', async () => {
    const provider = createMockProvider();
    const conv = createConversation(provider);
    await conv.send('Original question');
    await conv.send('Follow up');

    // Edit the first user message and re-send
    conv.editMessage(0, 'Better question');
    await conv.send('Better question'); // This becomes a new send from the edited point

    const history = conv.getHistory();
    // After edit: [edited user]. After send: [edited user, new user, assistant]
    // Actually editMessage truncates to [edited user at idx 0], then send adds user + assistant
    assert.strictEqual(history.length, 3); // edited + new user + assistant
  });

  it('throws on out-of-bounds index', () => {
    const provider = createMockProvider();
    const conv = createConversation(provider);

    assert.throws(() => conv.editMessage(5, 'nope'), /out of bounds/);
    assert.throws(() => conv.editMessage(-1, 'nope'), /out of bounds/);
  });

  it('throws on system message edit', async () => {
    const provider = createMockProvider();
    const conv = createConversation(provider, { systemPrompt: 'System' });

    assert.throws(
      () => conv.editMessage(0, 'new system'),
      /Cannot edit system messages/
    );
  });
});

// =============================================================================
// Ergonomic Multimodal Send Tests
// =============================================================================

describe('Ergonomic Multimodal Send Tests', () => {
  it('send() accepts plain string (existing behavior)', async () => {
    const provider = createMockProvider();
    const conv = createConversation(provider);
    await conv.send('Hello');

    const history = conv.getHistory();
    assert.strictEqual(history[0].role, 'user');
    assert.strictEqual(history[0].content, 'Hello');
  });

  it('send() accepts Message with role (existing behavior)', async () => {
    const provider = createMockProvider();
    const conv = createConversation(provider);
    await conv.send({ role: 'user', content: 'Hello' });

    const history = conv.getHistory();
    assert.strictEqual(history[0].role, 'user');
    assert.strictEqual(history[0].content, 'Hello');
  });

  it('send() accepts single MessageContent object and wraps as user message', async () => {
    const provider = createMockProvider();
    const conv = createConversation(provider);
    const imageContent = { type: 'image', source: { type: 'url', data: 'https://example.com/img.png' } };
    await conv.send(imageContent);

    const history = conv.getHistory();
    assert.strictEqual(history[0].role, 'user');
    assert.deepStrictEqual(history[0].content, imageContent);
  });

  it('send() accepts MessageContent[] and wraps as user message', async () => {
    const provider = createMockProvider();
    const conv = createConversation(provider);
    const parts = [
      { type: 'text', text: 'Describe this:' },
      { type: 'image', source: { type: 'url', data: 'https://example.com/img.png' } },
    ];
    await conv.send(parts);

    const history = conv.getHistory();
    assert.strictEqual(history[0].role, 'user');
    assert.ok(Array.isArray(history[0].content));
    assert.strictEqual(history[0].content.length, 2);
  });

  it('sendStream() accepts MessageContent[]', async () => {
    const provider = createMockProvider();
    const conv = createConversation(provider);
    const parts = [
      { type: 'text', text: 'Hello' },
      { type: 'image', source: { type: 'url', data: 'https://example.com/img.png' } },
    ];

    for await (const _chunk of conv.sendStream(parts)) { /* consume */ }

    const history = conv.getHistory();
    assert.strictEqual(history[0].role, 'user');
    assert.ok(Array.isArray(history[0].content));
  });

  it('send() distinguishes Message (has role) from MessageContent (has type)', async () => {
    const provider = createMockProvider();
    const conv = createConversation(provider);

    // A Message has 'role', should be used as-is
    await conv.send({ role: 'user', content: 'Direct message' });
    const history1 = conv.getHistory();
    assert.strictEqual(history1[0].role, 'user');
    assert.strictEqual(history1[0].content, 'Direct message');

    // A MessageContent has 'type' but no 'role', should be wrapped
    const conv2 = createConversation(provider);
    await conv2.send({ type: 'text', text: 'Wrapped content' });
    const history2 = conv2.getHistory();
    assert.strictEqual(history2[0].role, 'user');
    assert.deepStrictEqual(history2[0].content, { type: 'text', text: 'Wrapped content' });
  });
});

// =============================================================================
// Provider Switching Tests
// =============================================================================

describe('Provider Switching Tests', () => {
  it('currentProvider returns the provider', () => {
    const provider = createMockProvider();
    const conv = createConversation(provider);
    assert.strictEqual(conv.currentProvider, provider);
  });

  it('setProvider() permanently changes provider', async () => {
    const provider1 = createMockProvider({ provider: 'provider1' });
    const provider2 = createMockProvider({
      provider: 'provider2',
      complete: async () => ({
        id: 'r2', provider: 'provider2', model: 'm2', content: 'From provider2',
        finishReason: 'stop',
      }),
    });
    const conv = createConversation(provider1);

    conv.setProvider(provider2);
    assert.strictEqual(conv.currentProvider, provider2);

    const response = await conv.send('Hello');
    assert.strictEqual(response.content, 'From provider2');
  });

  it('per-call provider override does not change permanent provider', async () => {
    const provider1 = createMockProvider({ provider: 'provider1' });
    const provider2 = createMockProvider({
      provider: 'provider2',
      complete: async () => ({
        id: 'r2', provider: 'provider2', model: 'm2', content: 'From provider2',
        finishReason: 'stop',
      }),
    });
    const conv = createConversation(provider1);

    const response = await conv.send('Hello', { provider: provider2 });
    assert.strictEqual(response.content, 'From provider2');
    // Permanent provider unchanged
    assert.strictEqual(conv.currentProvider, provider1);
  });

  it('per-call provider override works with sendStream()', async () => {
    const provider1 = createMockProvider({ provider: 'provider1' });
    const provider2 = createMockProvider({
      provider: 'provider2',
      stream: async function* () {
        yield { id: 's1', provider: 'provider2', model: 'm2', delta: { content: 'Streamed' }, finishReason: 'stop' };
      },
    });
    const conv = createConversation(provider1);
    const chunks = [];

    for await (const chunk of conv.sendStream('Hello', { provider: provider2 })) {
      chunks.push(chunk);
    }

    assert.strictEqual(chunks[0].provider, 'provider2');
    assert.strictEqual(conv.currentProvider, provider1);
  });

  it('fork() copies current provider after setProvider()', async () => {
    const provider1 = createMockProvider({ provider: 'provider1' });
    const provider2 = createMockProvider({ provider: 'provider2' });
    const conv = createConversation(provider1);

    conv.setProvider(provider2);
    const forked = conv.fork();

    assert.strictEqual(forked.currentProvider, provider2);
  });
});

// =============================================================================
// Automated Tool Loop Tests
// =============================================================================

describe('Automated Tool Loop Tests', () => {
  it('completes immediately when no tool calls', async () => {
    const provider = createMockProvider();
    const conv = createConversation(provider);

    const response = await conv.runToolLoop('Hello', {
      toolHandler: async () => 'result',
    });

    assert.strictEqual(response.finishReason, 'stop');
    assert.strictEqual(response.content, 'Mock reply');
  });

  it('executes one round of tool calls', async () => {
    let callCount = 0;
    const provider = createMockProvider({
      complete: async () => {
        callCount++;
        if (callCount === 1) {
          return {
            id: 'r1', provider: 'mock', model: 'm',
            content: 'Let me call a tool',
            toolCalls: [{ id: 'tc1', name: 'get_weather', arguments: { city: 'NYC' } }],
            finishReason: 'tool_calls',
          };
        }
        return {
          id: 'r2', provider: 'mock', model: 'm',
          content: 'The weather is sunny',
          finishReason: 'stop',
        };
      },
    });
    const conv = createConversation(provider);

    const response = await conv.runToolLoop('What is the weather?', {
      toolHandler: async (tc) => {
        assert.strictEqual(tc.name, 'get_weather');
        return 'Sunny, 72°F';
      },
    });

    assert.strictEqual(response.content, 'The weather is sunny');
    assert.strictEqual(response.finishReason, 'stop');

    // Check history: user → assistant(tool_calls) → tool → assistant(final)
    const history = conv.getHistory();
    assert.strictEqual(history[0].role, 'user');
    assert.strictEqual(history[1].role, 'assistant');
    assert.strictEqual(history[2].role, 'tool');
    assert.strictEqual(history[3].role, 'assistant');
  });

  it('handles multiple sequential rounds', async () => {
    let callCount = 0;
    const provider = createMockProvider({
      complete: async () => {
        callCount++;
        if (callCount <= 2) {
          return {
            id: `r${callCount}`, provider: 'mock', model: 'm',
            content: `Round ${callCount}`,
            toolCalls: [{ id: `tc${callCount}`, name: `tool${callCount}`, arguments: {} }],
            finishReason: 'tool_calls',
          };
        }
        return {
          id: 'r3', provider: 'mock', model: 'm',
          content: 'Final answer',
          finishReason: 'stop',
        };
      },
    });
    const conv = createConversation(provider);

    const response = await conv.runToolLoop('Start', {
      toolHandler: async () => 'ok',
    });

    assert.strictEqual(response.content, 'Final answer');
    assert.strictEqual(callCount, 3);
  });

  it('respects maxIterations', async () => {
    let callCount = 0;
    const provider = createMockProvider({
      complete: async () => {
        callCount++;
        return {
          id: `r${callCount}`, provider: 'mock', model: 'm',
          content: `Round ${callCount}`,
          toolCalls: [{ id: `tc${callCount}`, name: 'tool', arguments: {} }],
          finishReason: 'tool_calls',
        };
      },
    });
    const conv = createConversation(provider);

    const response = await conv.runToolLoop('Start', {
      toolHandler: async () => 'ok',
      maxIterations: 2,
    });

    // 1 initial send() + 2 loop iterations = 3 complete calls
    assert.strictEqual(callCount, 3);
    assert.strictEqual(response.finishReason, 'tool_calls');
  });

  it('default maxIterations is 10', async () => {
    let callCount = 0;
    const provider = createMockProvider({
      complete: async () => {
        callCount++;
        return {
          id: `r${callCount}`, provider: 'mock', model: 'm',
          content: `Round ${callCount}`,
          toolCalls: [{ id: `tc${callCount}`, name: 'tool', arguments: {} }],
          finishReason: 'tool_calls',
        };
      },
    });
    const conv = createConversation(provider);

    await conv.runToolLoop('Start', {
      toolHandler: async () => 'ok',
    });

    // 1 initial send() + 10 loop iterations = 11 complete calls
    assert.strictEqual(callCount, 11);
  });

  it('propagates toolHandler errors', async () => {
    const provider = createMockProvider({
      complete: async () => ({
        id: 'r1', provider: 'mock', model: 'm',
        content: 'Calling tool',
        toolCalls: [{ id: 'tc1', name: 'failing_tool', arguments: {} }],
        finishReason: 'tool_calls',
      }),
    });
    const conv = createConversation(provider);

    await assert.rejects(
      () => conv.runToolLoop('Do something', {
        toolHandler: async () => { throw new Error('Tool failed'); },
      }),
      /Tool failed/
    );
  });

  it('handles multiple parallel tool calls in one round', async () => {
    let callCount = 0;
    const handledTools = [];
    const provider = createMockProvider({
      complete: async () => {
        callCount++;
        if (callCount === 1) {
          return {
            id: 'r1', provider: 'mock', model: 'm',
            content: 'Calling two tools',
            toolCalls: [
              { id: 'tc1', name: 'tool_a', arguments: { x: 1 } },
              { id: 'tc2', name: 'tool_b', arguments: { y: 2 } },
            ],
            finishReason: 'tool_calls',
          };
        }
        return {
          id: 'r2', provider: 'mock', model: 'm',
          content: 'Done with both',
          finishReason: 'stop',
        };
      },
    });
    const conv = createConversation(provider);

    const response = await conv.runToolLoop('Use tools', {
      toolHandler: async (tc) => {
        handledTools.push(tc.name);
        return `result_${tc.name}`;
      },
    });

    assert.deepStrictEqual(handledTools, ['tool_a', 'tool_b']);
    assert.strictEqual(response.content, 'Done with both');

    // Check history has two tool result messages
    const history = conv.getHistory();
    const toolMessages = history.filter((m) => m.role === 'tool');
    assert.strictEqual(toolMessages.length, 2);
  });

  it('passes completion options through to provider', async () => {
    let capturedOptions = null;
    const provider = createMockProvider({
      complete: async (messages, options) => {
        capturedOptions = options;
        return {
          id: 'r1', provider: 'mock', model: 'm', content: 'Done',
          finishReason: 'stop',
        };
      },
    });
    const conv = createConversation(provider);

    await conv.runToolLoop('Hello', {
      toolHandler: async () => 'ok',
      temperature: 0.5,
      model: 'custom-model',
    });

    assert.strictEqual(capturedOptions.temperature, 0.5);
    assert.strictEqual(capturedOptions.model, 'custom-model');
  });
});
