import OpenAI from 'openai';
import { ChatCompletion, ChatCompletionMessageParam, ChatCompletionChunk } from 'openai/resources/chat';
import { ImageGenerateParams } from 'openai/resources/images';
import { Stream } from 'openai/streaming';
import {
  Message,
  MessageContent,
  Response,
  Chunk,
  CompletionOptions,
  StreamOptions,
  ToolDefinition,
  ToolCall,
  EmbeddingOptions,
  EmbeddingResponse,
  ProviderConfig,
  FinishReason,
  getGlobalConfig,
} from './types';
import { AIError } from './errors';
import { withRetry, withTimeout, generateId } from './utils';

export abstract class BaseOpenAI {
  protected _client?: OpenAI;
  protected _config: ProviderConfig;
  protected abstract readonly _provider: string;

  get provider(): string {
    return this._provider;
  }

  constructor(apiKey?: string, baseURL?: string, config: Partial<ProviderConfig> = {}) {
    const resolvedApiKey = apiKey;

    this._config = {
      apiKey: resolvedApiKey,
      baseURL,
      timeout: config.timeout ?? getGlobalConfig().timeout,
      maxRetries: config.maxRetries ?? getGlobalConfig().maxRetries,
      retryDelay: config.retryDelay ?? getGlobalConfig().retryDelay,
      debug: config.debug ?? getGlobalConfig().debug,
    };

    if (resolvedApiKey) {
      this._client = new OpenAI({
        apiKey: resolvedApiKey,
        baseURL,
        timeout: this._config.timeout,
      });
    }
  }

  async complete(messages: Message[], options: CompletionOptions = {}): Promise<Response> {
    if (!this._client) {
      throw new AIError('OpenAI client not initialized', this._provider);
    }

    const model = options.model || this.defaultModel();
    const openAIMessages = this.convertToOpenAIMessages(messages);

    const fn = async (): Promise<Response> => {
      const params: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming = {
        model,
        messages: openAIMessages,
        temperature: options.temperature,
        top_p: options.topP,
        stop: options.stop,
      };
      this.applyTokenLimitParam(params, model, options.maxTokens);

      // Add tools if provided
      if (options.tools && options.tools.length > 0) {
        params.tools = this.convertToOpenAITools(options.tools);
        if (options.toolChoice) {
          params.tool_choice = this.convertToolChoice(options.toolChoice);
        }
      }

      // Add response format if JSON mode
      if (options.responseFormat === 'json') {
        params.response_format = { type: 'json_object' };
      }

      // Add reasoning effort for o-series models
      if (options.reasoning?.effort && (model.startsWith('o1') || model.startsWith('o3') || model.startsWith('o4'))) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (params as any).reasoning_effort = options.reasoning.effort;
      }

      const response = await this._client!.chat.completions.create(params);
      return this.convertFromOpenAIResponse(response);
    };

    const timeout = options.timeout ?? this._config.timeout ?? 60000;

    return withRetry(() => withTimeout(fn, timeout, this._provider), this._provider, {
      maxRetries: this._config.maxRetries,
      retryDelay: this._config.retryDelay,
    });
  }

  /**
   * Stream completions
   */
  async *stream(messages: Message[], options: StreamOptions = {}): AsyncIterable<Chunk> {
    if (!this._client) {
      throw new AIError('OpenAI client not initialized', this._provider);
    }

    const model = options.model || this.defaultModel();
    const openAIMessages = this.convertToOpenAIMessages(messages);

    const params: OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming = {
      model,
      messages: openAIMessages,
      temperature: options.temperature,
      top_p: options.topP,
      stop: options.stop,
      stream: true,
    };
    this.applyTokenLimitParam(params, model, options.maxTokens);

    // Add tools if provided
    if (options.tools && options.tools.length > 0) {
      params.tools = this.convertToOpenAITools(options.tools);
      if (options.toolChoice) {
        params.tool_choice = this.convertToolChoice(options.toolChoice);
      }
    }

    // Add response format if JSON mode
    if (options.responseFormat === 'json') {
      params.response_format = { type: 'json_object' };
    }

    const stream: Stream<ChatCompletionChunk> = await this._client.chat.completions.create(params);

    const responseId = generateId('chatcmpl');
    const toolCalls: Map<number, { id: string; name: string; argumentsJson: string }> = new Map();

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      const finishReason = chunk.choices[0]?.finish_reason;

      // Handle tool calls
      if (delta?.tool_calls) {
        for (const toolCall of delta.tool_calls) {
          const existing = toolCalls.get(toolCall.index) || { id: '', name: '', argumentsJson: '' };

          if (toolCall.id) existing.id = toolCall.id;
          if (toolCall.function?.name) existing.name = toolCall.function.name;
          if (toolCall.function?.arguments) {
            existing.argumentsJson += toolCall.function.arguments;
          }

          toolCalls.set(toolCall.index, existing);
        }
      }

      const unifiedChunk: Chunk = {
        id: chunk.id || responseId,
        provider: this._provider,
        model: chunk.model || model,
        delta: {
          content: delta?.content || undefined,
          toolCalls: delta?.tool_calls?.map((tc) => ({
            id: tc.id,
            name: tc.function?.name,
            arguments: undefined,
          })),
        },
        finishReason: finishReason ? this.mapFinishReason(finishReason) : undefined,
      };

      // Call onToken callback
      if (delta?.content && options.onToken) {
        options.onToken(delta.content);
      }

      yield unifiedChunk;
    }

    // Call onToolCall callback for completed tool calls
    if (options.onToolCall) {
      for (const toolCall of toolCalls.values()) {
        if (toolCall.id && toolCall.name) {
          options.onToolCall({
            id: toolCall.id,
            name: toolCall.name,
            arguments: toolCall.argumentsJson ? this.safeParseJson(toolCall.argumentsJson) : {},
          });
        }
      }
    }
  }

  /**
   * Generate embeddings
   */
  async embed(input: string | string[], options: EmbeddingOptions = {}): Promise<EmbeddingResponse> {
    if (!this._client) {
      throw new AIError('OpenAI client not initialized', this._provider);
    }

    const model = options.model || this.defaultEmbeddingModel();
    const inputArray = Array.isArray(input) ? input : [input];

    const fn = async (): Promise<EmbeddingResponse> => {
      const params: OpenAI.Embeddings.EmbeddingCreateParams = {
        model,
        input: inputArray,
      };

      if (options.dimensions) {
        params.dimensions = options.dimensions;
      }

      const response = await this._client!.embeddings.create(params);

      return {
        embeddings: response.data.map((d) => d.embedding),
        model: response.model,
        provider: this._provider,
        usage: {
          promptTokens: response.usage.prompt_tokens,
          totalTokens: response.usage.total_tokens,
        },
      };
    };

    return withRetry(fn, this._provider, {
      maxRetries: this._config.maxRetries,
      retryDelay: this._config.retryDelay,
    });
  }

  /**
   * Generate images
   */
  async generate(options: {
    prompt: string;
    n?: number;
    model?: string;
    size?: string;
    quality?: string;
    format?: string;
    background?: string;
  }): Promise<Buffer[]> {
    if (!this._client) {
      throw new AIError('OpenAI client not initialized', this._provider);
    }

    const { prompt, n = 1, model, size, quality, format, background } = options;

    const query: ImageGenerateParams = {
      model,
      prompt,
      n,
    };

    if (size) query.size = size as ImageGenerateParams['size'];
    if (quality) query.quality = quality as ImageGenerateParams['quality'];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (format && (model === 'gpt-image-1' || model === 'gpt-image-1.5')) (query as any).output_format = format;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (background && (model === 'gpt-image-1' || model === 'gpt-image-1.5')) (query as any).background = background;

    if (model !== 'gpt-image-1' && model !== 'gpt-image-1.5') {
      query.response_format = 'b64_json';
    }

    const fn = async (): Promise<Buffer[]> => {
      const response = await this._client!.images.generate(query);

      if (!response.data) {
        throw new AIError('No image data received from provider', this._provider);
      }

      return response.data.map((image) => {
        if (!image.b64_json) {
          throw new AIError('No base64 data received from provider', this._provider);
        }
        return Buffer.from(image.b64_json, 'base64');
      });
    };

    return withRetry(fn, this._provider, {
      maxRetries: this._config.maxRetries,
      retryDelay: this._config.retryDelay,
    });
  }


  protected defaultModel(): string {
    return 'gpt-4o';
  }

  protected defaultEmbeddingModel(): string {
    return 'text-embedding-3-small';
  }

  protected safeParseJson(value: string): Record<string, unknown> {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, unknown>;
      }
      return {};
    } catch {
      return {};
    }
  }

  protected usesMaxCompletionTokens(model: string): boolean {
    if (this._provider !== 'openai') {
      return false;
    }

    const normalizedModel = model.toLowerCase();
    return (
      normalizedModel.startsWith('gpt-5') ||
      normalizedModel.startsWith('o1') ||
      normalizedModel.startsWith('o3') ||
      normalizedModel.startsWith('o4')
    );
  }

  protected applyTokenLimitParam(
    params:
      | OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming
      | OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming,
    model: string,
    maxTokens: number | undefined
  ): void {
    if (maxTokens === undefined) {
      return;
    }

    // Prefer OpenAI's required parameter for GPT-5/o-series, keep compatibility
    // with OpenAI-compatible providers that still expect max_tokens.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mutableParams = params as any;
    if (this.usesMaxCompletionTokens(model)) {
      mutableParams.max_completion_tokens = maxTokens;
    } else {
      mutableParams.max_tokens = maxTokens;
    }
  }

  protected convertToOpenAIMessages(messages: Message[]): ChatCompletionMessageParam[] {
    return messages.flatMap((msg): ChatCompletionMessageParam[] => {
      if (msg.role === 'tool') {
        const toolResults = Array.isArray(msg.content)
          ? msg.content.filter(
            (part): part is Extract<MessageContent, { type: 'tool_result' }> =>
              typeof part !== 'string' && part.type === 'tool_result'
          )
          : typeof msg.content !== 'string' && msg.content.type === 'tool_result'
            ? [msg.content]
            : [];

        return toolResults.map((result) => ({
          role: 'tool',
          content: result.content,
          tool_call_id: result.toolUseId,
        })) as ChatCompletionMessageParam[];
      }

      // Handle string content
      if (typeof msg.content === 'string') {
        return [{
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content,
        }];
      }

      // Handle array content (multimodal)
      if (Array.isArray(msg.content)) {
        const textParts: string[] = [];
        const assistantToolCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parts: any[] = [];

        for (const part of msg.content) {
          if (typeof part === 'string') {
            if (msg.role === 'assistant') {
              textParts.push(part);
              continue;
            }
            parts.push({ type: 'text' as const, text: part });
            continue;
          }
          if (part.type === 'text') {
            if (msg.role === 'assistant') {
              textParts.push(part.text);
              continue;
            }
            parts.push({ type: 'text' as const, text: part.text });
            continue;
          }
          if (part.type === 'image') {
            parts.push({
              type: 'image_url' as const,
              image_url: {
                url:
                  part.source.type === 'url'
                    ? part.source.data
                    : `data:${part.source.mediaType || 'image/png'};base64,${part.source.data}`,
              },
            });
            continue;
          }
          if (part.type === 'audio') {
            if (part.source.type === 'url') {
              throw new AIError(
                'Audio URL inputs are not supported by OpenAI-compatible chat completions. Use base64 audio data.',
                this._provider,
                'INVALID_REQUEST',
                400
              );
            }
            // OpenAI GPT-4o audio input format
            parts.push({
              type: 'input_audio' as const,
              input_audio: {
                data: part.source.data,
                format: part.source.mediaType?.includes('wav') ? 'wav' : 'mp3',
              },
            });
            continue;
          }
          if (part.type === 'document') {
            if (part.source.type === 'url') {
              throw new AIError(
                'Document URL inputs are not supported by OpenAI-compatible chat completions. Use base64 document data.',
                this._provider,
                'INVALID_REQUEST',
                400
              );
            }
            // For documents, we include them as file content
            // OpenAI supports PDF and other documents in certain contexts
            parts.push({
              type: 'file' as const,
              file: {
                file_data: `data:${part.source.mediaType || 'application/pdf'};base64,${part.source.data}`,
                filename: part.source.filename,
              },
            });
            continue;
          }
          if (part.type === 'tool_use' && msg.role === 'assistant') {
            assistantToolCalls.push({
              id: part.id,
              type: 'function',
              function: {
                name: part.name,
                arguments: JSON.stringify(part.input ?? {}),
              },
            });
            continue;
          }
          // Tool use/result and unsupported parts are handled elsewhere or ignored
        }

        if (msg.role === 'assistant') {
          const assistantMessage: OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam = {
            role: 'assistant',
            content: textParts.join(''),
          };
          if (assistantToolCalls.length > 0) {
            assistantMessage.tool_calls = assistantToolCalls;
          }
          return [assistantMessage as ChatCompletionMessageParam];
        }

        return [{
          role: msg.role as 'system' | 'user',
          content: parts,
        }];
      }

      // Handle single content object
      const content = msg.content;
      if (content.type === 'text') {
        return [{
          role: msg.role as 'system' | 'user' | 'assistant',
          content: content.text,
        }];
      }

      if (content.type === 'tool_result') {
        return [{
          role: 'tool',
          content: content.content,
          tool_call_id: content.toolUseId,
        } as ChatCompletionMessageParam];
      }

      if (content.type === 'tool_use' && msg.role === 'assistant') {
        return [{
          role: 'assistant',
          content: '',
          tool_calls: [
            {
              id: content.id,
              type: 'function',
              function: {
                name: content.name,
                arguments: JSON.stringify(content.input ?? {}),
              },
            },
          ],
        } as ChatCompletionMessageParam];
      }

      return [{
        role: msg.role as 'system' | 'user' | 'assistant',
        content: '',
      }];
    });
  }

  protected convertToOpenAITools(tools: ToolDefinition[]): OpenAI.Chat.Completions.ChatCompletionTool[] {
    return tools.map((tool) => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }

  protected convertToolChoice(
    choice: 'auto' | 'none' | 'required' | { name: string }
  ): OpenAI.Chat.Completions.ChatCompletionToolChoiceOption {
    if (typeof choice === 'string') {
      if (choice === 'required') return 'required';
      return choice;
    }
    return {
      type: 'function',
      function: { name: choice.name },
    };
  }

  protected convertFromOpenAIResponse(response: ChatCompletion): Response {
    const choice = response.choices[0];
    const toolCalls = choice.message.tool_calls?.map((tc): ToolCall => {
      const func = 'function' in tc ? tc.function : undefined;
      return {
        id: tc.id,
        name: func?.name ?? '',
        arguments: func?.arguments ? this.safeParseJson(func.arguments) : {},
      };
    });

    return {
      id: response.id,
      provider: this._provider,
      model: response.model,
      content: choice.message.content,
      toolCalls,
      finishReason: this.mapFinishReason(choice.finish_reason),
      usage: response.usage
        ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        }
        : undefined,
      raw: response,
    };
  }

  protected mapFinishReason(reason: string | null): FinishReason {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      case 'tool_calls':
      case 'function_call':
        return 'tool_calls';
      case 'content_filter':
        return 'content_filter';
      default:
        return 'stop';
    }
  }
}
