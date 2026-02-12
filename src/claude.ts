import Anthropic from '@anthropic-ai/sdk';
import {
  Message as AnthropicMessage,
  MessageParam,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  MessageStreamEvent,
} from '@anthropic-ai/sdk/resources/messages/messages';

import {
  Message,
  Response,
  Chunk,
  CompletionOptions,
  StreamOptions,
  ToolDefinition,
  ToolCall,
  ProviderConfig,
  FinishReason,
  getGlobalConfig,
} from './types';
import { AIError } from './errors';
import { withRetry, withTimeout, generateId } from './utils';

export type MODEL =
  | 'claude-opus-4-1'
  | 'claude-opus-4-1-20250805'
  | 'claude-opus-4-0'
  | 'claude-opus-4-0-20250514'
  | 'claude-sonnet-4-0'
  | 'claude-sonnet-4-0-20250514'
  | 'claude-sonnet-4-20250514'
  | 'claude-3-7-sonnet-latest'
  | 'claude-3-7-sonnet-20250219'
  | 'claude-3-5-sonnet-latest'
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-5-haiku-latest'
  | 'claude-3-5-haiku-20241022'
  | 'claude-3-opus-20240229'
  | 'claude-3-haiku-20240307'
  | 'claude-opus-4-6'
  | 'claude-opus-4-5-20251101'
  | 'claude-opus-4-5'
  | 'claude-sonnet-4-5'
  | 'claude-sonnet-4-5-20250929'
  | 'claude-haiku-4-5'
  | 'claude-haiku-4-5-20251001'
  | (string & {});

class Claude {
  private _client?: Anthropic;
  private _config: ProviderConfig;
  private readonly _provider = 'claude';

  constructor(apiKey?: string, config: Partial<ProviderConfig> = {}) {
    const resolvedApiKey = apiKey || process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;

    this._config = {
      apiKey: resolvedApiKey,
      timeout: config.timeout ?? getGlobalConfig().timeout,
      maxRetries: config.maxRetries ?? getGlobalConfig().maxRetries,
      retryDelay: config.retryDelay ?? getGlobalConfig().retryDelay,
      debug: config.debug ?? getGlobalConfig().debug,
    };

    if (resolvedApiKey) {
      this._client = new Anthropic({
        apiKey: resolvedApiKey,
        timeout: this._config.timeout,
      });
    }
  }

  /**
   * Get the provider name
   */
  get provider(): string {
    return this._provider;
  }

  /**
   * Generate a chat completion
   */
  async complete(messages: Message[], options: CompletionOptions = {}): Promise<Response> {
    if (!this._client) {
      throw new AIError('Anthropic client not initialized', this._provider);
    }

    const model = options.model || 'claude-sonnet-4-0';
    const { systemPrompt, claudeMessages } = this.convertToClaudeMessages(messages);

    const fn = async (): Promise<Response> => {
      const params: Anthropic.Messages.MessageCreateParamsNonStreaming = {
        model,
        messages: claudeMessages,
        max_tokens: options.maxTokens || 1024,
        temperature: options.temperature,
        top_p: options.topP,
        stop_sequences: options.stop ? (Array.isArray(options.stop) ? options.stop : [options.stop]) : undefined,
      };

      // Extended Thinking
      if (options.reasoning?.budget) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (params as any).thinking = {
          type: 'enabled',
          budget_tokens: options.reasoning.budget,
        };

        // Ensure max_tokens is set higher than budget if using thinking
        if (!options.maxTokens || options.maxTokens <= options.reasoning.budget) {
          params.max_tokens = options.reasoning.budget + 4096; // Add buffer
        }
      }

      // Add system prompt if present
      if (systemPrompt) {
        params.system = systemPrompt;
      }

      // Add tools if provided
      if (options.tools && options.tools.length > 0) {
        params.tools = this.convertToClaudeTools(options.tools);
        if (options.toolChoice) {
          params.tool_choice = this.convertToolChoice(options.toolChoice);
        }
      }

      const response = await this._client!.messages.create(params);

      return this.convertFromClaudeResponse(response, model);
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
      throw new AIError('Anthropic client not initialized', this._provider);
    }

    const model = options.model || 'claude-sonnet-4-0';
    const { systemPrompt, claudeMessages } = this.convertToClaudeMessages(messages);

    const params: Anthropic.Messages.MessageCreateParamsStreaming = {
      model,
      messages: claudeMessages,
      max_tokens: options.maxTokens || 1024,
      temperature: options.temperature,
      top_p: options.topP,
      stop_sequences: options.stop ? (Array.isArray(options.stop) ? options.stop : [options.stop]) : undefined,
      stream: true,
    };

    // Add system prompt if present
    if (systemPrompt) {
      params.system = systemPrompt;
    }

    // Add tools if provided
    if (options.tools && options.tools.length > 0) {
      params.tools = this.convertToClaudeTools(options.tools);
      if (options.toolChoice) {
        params.tool_choice = this.convertToolChoice(options.toolChoice);
      }
    }

    const stream = this._client.messages.stream(params);
    const responseId = generateId('msg');

    let currentToolCall: Partial<ToolCall> | null = null;
    let toolCallInput = '';

    for await (const event of stream) {
      const chunk = this.processStreamEvent(event, responseId, model, options);

      if (chunk) {
        yield chunk;
      }

      // Handle tool call completion
      if (event.type === 'content_block_start') {
        const contentBlock = (event as { content_block: ContentBlock }).content_block;
        if (contentBlock.type === 'tool_use') {
          currentToolCall = {
            id: (contentBlock as ToolUseBlock).id,
            name: (contentBlock as ToolUseBlock).name,
          };
          toolCallInput = '';
        }
      }

      if (event.type === 'content_block_delta') {
        const delta = (event as { delta: { type: string; partial_json?: string } }).delta;
        if (delta.type === 'input_json_delta' && delta.partial_json) {
          toolCallInput += delta.partial_json;
        }
      }

      if (event.type === 'content_block_stop' && currentToolCall) {
        try {
          currentToolCall.arguments = JSON.parse(toolCallInput || '{}');
        } catch {
          currentToolCall.arguments = {};
        }

        if (options.onToolCall && currentToolCall.id && currentToolCall.name) {
          options.onToolCall(currentToolCall as ToolCall);
        }
        currentToolCall = null;
        toolCallInput = '';
      }
    }
  }

  private convertToClaudeMessages(messages: Message[]): {
    systemPrompt: string | undefined;
    claudeMessages: MessageParam[];
  } {
    let systemPrompt: string | undefined;
    const claudeMessages: MessageParam[] = [];

    for (const msg of messages) {
      // Extract system message
      if (msg.role === 'system') {
        if (typeof msg.content === 'string') {
          systemPrompt = msg.content;
        } else if (Array.isArray(msg.content)) {
          systemPrompt = msg.content
            .map((c) => (typeof c === 'string' ? c : c.type === 'text' ? c.text : ''))
            .join('\n');
        } else if (msg.content.type === 'text') {
          systemPrompt = msg.content.text;
        }
        continue;
      }

      // Convert user/assistant messages
      const role = msg.role === 'tool' ? 'user' : msg.role;

      if (typeof msg.content === 'string') {
        claudeMessages.push({
          role: role as 'user' | 'assistant',
          content: msg.content,
        });
      } else if (Array.isArray(msg.content)) {
        const contentBlocks: Anthropic.Messages.ContentBlockParam[] = [];

        for (const part of msg.content) {
          if (typeof part === 'string') {
            contentBlocks.push({ type: 'text', text: part });
          } else if (part.type === 'text') {
            contentBlocks.push({ type: 'text', text: part.text });
          } else if (part.type === 'image') {
            if (part.source.type === 'url') {
              contentBlocks.push({
                type: 'image',
                source: {
                  type: 'url',
                  url: part.source.data,
                },
              } as Anthropic.Messages.ContentBlockParam);
            } else {
              contentBlocks.push({
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: (part.source.mediaType || 'image/png') as
                    | 'image/jpeg'
                    | 'image/png'
                    | 'image/gif'
                    | 'image/webp',
                  data: part.source.data,
                },
              });
            }
          } else if (part.type === 'document') {
            // Claude supports PDF documents
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (contentBlocks as any[]).push({
              type: 'document',
              source: {
                type: 'base64',
                media_type: part.source.mediaType || 'application/pdf',
                data: part.source.data,
              },
            });
          } else if (part.type === 'tool_result') {
            contentBlocks.push({
              type: 'tool_result',
              tool_use_id: part.toolUseId,
              content: part.content,
            });
          }
        }

        claudeMessages.push({
          role: role as 'user' | 'assistant',
          content: contentBlocks,
        });
      } else {
        const content = msg.content;
        if (content.type === 'text') {
          claudeMessages.push({
            role: role as 'user' | 'assistant',
            content: content.text,
          });
        } else if (content.type === 'tool_result') {
          claudeMessages.push({
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: content.toolUseId,
                content: content.content,
              },
            ],
          });
        }
      }
    }

    return { systemPrompt, claudeMessages };
  }

  private convertToClaudeTools(tools: ToolDefinition[]): Anthropic.Messages.Tool[] {
    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: {
        type: 'object' as const,
        properties: tool.parameters.properties,
        required: tool.parameters.required,
      },
    }));
  }

  private convertToolChoice(choice: 'auto' | 'none' | 'required' | { name: string }): Anthropic.Messages.ToolChoice {
    if (typeof choice === 'string') {
      if (choice === 'none') return { type: 'auto' }; // Claude doesn't have 'none', use 'auto'
      if (choice === 'required') return { type: 'any' };
      return { type: 'auto' };
    }
    return { type: 'tool', name: choice.name };
  }

  private convertFromClaudeResponse(response: AnthropicMessage, model: string): Response {
    let content: string | null = null;
    const toolCalls: ToolCall[] = [];

    for (const block of response.content) {
      if (block.type === 'text') {
        content = (content || '') + (block as TextBlock).text;
      } else if (block.type === 'tool_use') {
        const toolUse = block as ToolUseBlock;
        toolCalls.push({
          id: toolUse.id,
          name: toolUse.name,
          arguments: toolUse.input as Record<string, unknown>,
        });
      }
    }

    return {
      id: response.id,
      provider: this._provider,
      model,
      content,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      finishReason: this.mapStopReason(response.stop_reason),
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      raw: response,
    };
  }

  private processStreamEvent(
    event: MessageStreamEvent,
    responseId: string,
    model: string,
    options: StreamOptions
  ): Chunk | null {
    if (event.type === 'content_block_delta') {
      const delta = (event as { delta: { type: string; text?: string } }).delta;
      if (delta.type === 'text_delta' && delta.text) {
        // Call onToken callback
        if (options.onToken) {
          options.onToken(delta.text);
        }

        return {
          id: responseId,
          provider: this._provider,
          model,
          delta: {
            content: delta.text,
          },
        };
      }
    }

    if (event.type === 'message_delta') {
      const messageDelta = event as { delta: { stop_reason?: string } };
      if (messageDelta.delta.stop_reason) {
        return {
          id: responseId,
          provider: this._provider,
          model,
          delta: {},
          finishReason: this.mapStopReason(messageDelta.delta.stop_reason),
        };
      }
    }

    return null;
  }

  private mapStopReason(reason: string | null): FinishReason {
    switch (reason) {
      case 'end_turn':
      case 'stop_sequence':
        return 'stop';
      case 'max_tokens':
        return 'length';
      case 'tool_use':
        return 'tool_calls';
      default:
        return 'stop';
    }
  }
}

export default Claude;
