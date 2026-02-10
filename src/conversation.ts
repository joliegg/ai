import { Message, MessageContent, Response, Chunk, ToolCall, ConversationOptions, ConversationJSON, AIProvider, SendContent, ConversationSendOptions, ConversationStreamOptions, ToolLoopOptions } from './types';
import { deepClone } from './utils';

export class Conversation {
  private provider: AIProvider;
  private options: ConversationOptions;
  private history: Message[] = [];

  constructor(provider: AIProvider, options: ConversationOptions = {}) {
    this.provider = provider;
    this.options = options;

    // Add system prompt if provided
    if (options.systemPrompt) {
      this.history.push({
        role: 'system',
        content: options.systemPrompt,
      });
    }
  }

  get currentProvider(): AIProvider { return this.provider; }

  setProvider(provider: AIProvider): void { this.provider = provider; }

  private addAssistantResponse(content: string | null, toolCalls: ToolCall[]): void {
    if (!content && toolCalls.length === 0) return;

    const contentParts: MessageContent[] = [];

    if (content) {
      contentParts.push({ type: 'text' as const, text: content });
    }

    for (const tc of toolCalls) {
      contentParts.push({
        type: 'tool_use' as const,
        id: tc.id,
        name: tc.name,
        input: tc.arguments,
      });
    }

    this.history.push({
      role: 'assistant',
      content: contentParts.length === 1 && typeof contentParts[0] !== 'string' && contentParts[0].type === 'text'
        ? contentParts[0].text
        : contentParts,
    });
  }

  private resolveUserMessage(content: SendContent): Message {
    if (typeof content === 'string') return { role: 'user', content };
    if (Array.isArray(content)) return { role: 'user', content };
    if ('role' in content) return content as Message;
    return { role: 'user', content: content as MessageContent };
  }

  private resolveProvider(options?: { provider?: AIProvider }): AIProvider {
    return options?.provider ?? this.provider;
  }

  /**
   * Send a message and get a response
   */
  async send(content: SendContent, options: Partial<ConversationSendOptions> = {}): Promise<Response> {
    const { provider: providerOverride, ...completionOptions } = options;
    const activeProvider = this.resolveProvider({ provider: providerOverride });
    const userMessage = this.resolveUserMessage(content);

    this.history.push(userMessage);

    let response: Response;
    try {
      response = await activeProvider.complete(this.history, {
        model: this.options.model,
        maxTokens: this.options.maxTokens,
        temperature: this.options.temperature,
        ...completionOptions,
      });
    } catch (error) {
      this.history.pop();
      throw error;
    }

    this.addAssistantResponse(response.content, response.toolCalls ?? []);
    this.trimHistory();

    return response;
  }

  /**
   * Send a message and stream the response
   */
  async *sendStream(content: SendContent, options: Partial<ConversationStreamOptions> = {}): AsyncIterable<Chunk> {
    const { provider: providerOverride, ...streamOptions } = options;
    const activeProvider = this.resolveProvider({ provider: providerOverride });

    if (!activeProvider.stream) {
      throw new Error(`Provider ${activeProvider.provider} does not support streaming`);
    }

    const userMessage = this.resolveUserMessage(content);
    this.history.push(userMessage);

    let responseContent = '';
    const completedToolCalls: ToolCall[] = [];
    const mergedOptions = {
      model: this.options.model,
      maxTokens: this.options.maxTokens,
      temperature: this.options.temperature,
      ...streamOptions,
      onToolCall: (toolCall: ToolCall) => {
        completedToolCalls.push(toolCall);
        streamOptions.onToolCall?.(toolCall);
      },
    };

    try {
      for await (const chunk of activeProvider.stream(this.history, mergedOptions)) {
        if (chunk.delta.content) {
          responseContent += chunk.delta.content;
        }
        yield chunk;
      }
    } catch (error) {
      this.history.pop();
      throw error;
    }

    this.addAssistantResponse(responseContent || null, completedToolCalls);
    this.trimHistory();
  }

  /**
   * Add a tool result to the conversation
   */
  addToolResult(toolUseId: string, result: string, name?: string): void {
    this.history.push({
      role: 'tool',
      content: [
        {
          type: 'tool_result',
          toolUseId,
          content: result,
          ...(name ? { name } : {}),
        },
      ],
    });
  }

  /**
   * Run an automated tool loop: send, handle tool calls, repeat until done
   */
  async runToolLoop(content: SendContent, options: ToolLoopOptions): Promise<Response> {
    const { toolHandler, maxIterations = 10, ...sendOptions } = options;
    const { provider: providerOverride, ...completionOptions } = sendOptions;
    const activeProvider = this.resolveProvider({ provider: providerOverride });

    let response = await this.send(content, { provider: activeProvider, ...completionOptions });
    let iterations = 0;

    while (
      response.finishReason === 'tool_calls' &&
      response.toolCalls &&
      response.toolCalls.length > 0 &&
      iterations < maxIterations
    ) {
      // Execute each tool call and add results
      for (const tc of response.toolCalls) {
        const result = await toolHandler(tc);
        this.addToolResult(tc.id, result, tc.name);
      }

      // Continue the conversation (no new user message)
      response = await activeProvider.complete(this.history, {
        model: this.options.model,
        maxTokens: this.options.maxTokens,
        temperature: this.options.temperature,
        ...completionOptions,
      });
      this.addAssistantResponse(response.content, response.toolCalls ?? []);
      this.trimHistory();

      iterations++;
    }

    return response;
  }

  /**
   * Get the current conversation history (deep cloned)
   */
  getHistory(): Message[] {
    return deepClone(this.history);
  }

  /**
   * Get the number of messages in history (excluding system)
   */
  get length(): number {
    return this.history.filter((m) => m.role !== 'system').length;
  }

  /**
   * Clear the conversation history (keeps system prompt)
   */
  clear(): void {
    const systemMessages = this.history.filter((m) => m.role === 'system');
    this.history = systemMessages;
  }

  /**
   * Reset the conversation with a new system prompt
   */
  reset(systemPrompt?: string): void {
    this.history = [];
    if (systemPrompt || this.options.systemPrompt) {
      this.history.push({
        role: 'system',
        content: systemPrompt || this.options.systemPrompt || '',
      });
    }
  }

  /**
   * Fork the conversation (create a copy)
   */
  fork(): Conversation {
    const forked = new Conversation(this.provider, this.options);
    forked.history = structuredClone(this.history);
    return forked;
  }

  /**
   * Remove the last exchange (user message + assistant response)
   */
  undo(): void {
    // Remove messages from end until we hit a user message
    while (this.history.length > 0) {
      const last = this.history[this.history.length - 1];
      if (last.role === 'system') break;
      this.history.pop();
      if (last.role === 'user') break;
    }
  }

  /**
   * Edit a message at a specific index and truncate history after it
   */
  editMessage(index: number, newContent: MessageContent | MessageContent[]): void {
    if (index < 0 || index >= this.history.length) {
      throw new Error(`Index ${index} is out of bounds (history length: ${this.history.length})`);
    }

    if (this.history[index].role === 'system') {
      throw new Error('Cannot edit system messages. Use reset() to change the system prompt.');
    }

    this.history[index] = {
      ...this.history[index],
      content: newContent,
    };

    // Truncate everything after the edited message
    this.history = this.history.slice(0, index + 1);
  }

  /**
   * Serialize the conversation to JSON
   */
  toJSON(): ConversationJSON {
    return {
      version: 1,
      options: deepClone(this.options),
      history: deepClone(this.history),
    };
  }

  /**
   * Restore a conversation from JSON
   */
  static fromJSON(provider: AIProvider, json: ConversationJSON): Conversation {
    if (json.version !== 1) {
      throw new Error(`Unsupported conversation version: ${json.version}`);
    }

    const conversation = new Conversation(provider, json.options);
    // Overwrite history directly (serialized history already contains system prompt)
    conversation.history = deepClone(json.history);
    return conversation;
  }

  /**
   * Group non-system messages into exchanges (each starting at a user message)
   */
  private groupExchanges(messages: Message[]): Message[][] {
    const exchanges: Message[][] = [];
    let current: Message[] = [];

    for (const msg of messages) {
      if (msg.role === 'user' && current.length > 0) {
        exchanges.push(current);
        current = [];
      }
      current.push(msg);
    }

    if (current.length > 0) {
      exchanges.push(current);
    }

    return exchanges;
  }

  /**
   * Estimate token count for messages
   */
  private estimateTokens(messages: Message[]): number {
    let chars = 0;

    for (const msg of messages) {
      chars += 4; // role/formatting overhead per message

      if (typeof msg.content === 'string') {
        chars += msg.content.length;
      } else if (Array.isArray(msg.content)) {
        for (const part of msg.content) {
          if (typeof part === 'string') {
            chars += part.length;
          } else if (part.type === 'text') {
            chars += part.text.length;
          } else if (part.type === 'tool_result') {
            chars += part.content.length;
          }
          // Multimodal content (images/audio/video) not counted
        }
      }
    }

    return Math.ceil(chars / 4) + 3; // divide by 4 + chat format overhead
  }

  /**
   * Trim history using exchange-aware logic
   */
  private trimHistory(): void {
    if (!this.options.maxHistory && !this.options.maxContextTokens) return;

    const systemMessages = this.history.filter((m) => m.role === 'system');
    const nonSystemMessages = this.history.filter((m) => m.role !== 'system');

    const exchanges = this.groupExchanges(nonSystemMessages);

    // Phase 1: maxHistory - trim by message count
    if (this.options.maxHistory) {
      while (exchanges.length > 1) {
        const totalMessages = exchanges.reduce((sum, ex) => sum + ex.length, 0);
        if (totalMessages <= this.options.maxHistory) break;
        exchanges.shift();
      }
    }

    // Phase 2: maxContextTokens - trim by token budget
    if (this.options.maxContextTokens) {
      const systemTokens = this.estimateTokens(systemMessages);
      while (exchanges.length > 1) {
        const remainingMessages = exchanges.flat();
        const totalTokens = systemTokens + this.estimateTokens(remainingMessages);
        if (totalTokens <= this.options.maxContextTokens) break;
        exchanges.shift();
      }
    }

    // Rebuild history
    this.history = [...systemMessages, ...exchanges.flat()];
  }

  /**
   * Summarize old messages to compress history (requires AI call)
   */
  async summarize(keepRecent: number = 4): Promise<void> {
    const systemMessages = this.history.filter((m) => m.role === 'system');
    const nonSystemMessages = this.history.filter((m) => m.role !== 'system');

    if (nonSystemMessages.length <= keepRecent) return;

    const toSummarize = nonSystemMessages.slice(0, -keepRecent);
    const toKeep = nonSystemMessages.slice(-keepRecent);

    // Create summary using the provider
    const summaryResponse = await this.provider.complete([
      {
        role: 'system',
        content: 'Summarize the following conversation concisely, preserving key information and context:',
      },
      ...toSummarize,
    ]);

    // Replace history with summary + recent messages
    this.history = [
      ...systemMessages,
      {
        role: 'assistant',
        content: `[Previous conversation summary: ${summaryResponse.content}]`,
      },
      ...toKeep,
    ];
  }
}

/**
 * Create a conversation manager for any AI provider
 */
export const createConversation = (provider: AIProvider, options: ConversationOptions = {}): Conversation => {
  return new Conversation(provider, options);
}
