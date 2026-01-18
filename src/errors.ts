export class AIError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly code?: string,
    public readonly statusCode?: number,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'AIError';
    Error.captureStackTrace?.(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      provider: this.provider,
      code: this.code,
      statusCode: this.statusCode,
    };
  }
}

export class AuthenticationError extends AIError {
  constructor(provider: string, message?: string, cause?: Error) {
    super(
      message || `Authentication failed for ${provider}. Please check your API key.`,
      provider,
      'AUTHENTICATION_ERROR',
      401,
      cause
    );
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends AIError {
  public readonly retryAfter?: number;

  constructor(provider: string, retryAfter?: number, message?: string, cause?: Error) {
    super(
      message || `Rate limit exceeded for ${provider}. ${retryAfter ? `Retry after ${retryAfter} seconds.` : ''}`,
      provider,
      'RATE_LIMIT_ERROR',
      429,
      cause
    );
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class InvalidRequestError extends AIError {
  constructor(provider: string, message: string, cause?: Error) {
    super(message, provider, 'INVALID_REQUEST', 400, cause);
    this.name = 'InvalidRequestError';
  }
}

export class ContentFilterError extends AIError {
  constructor(provider: string, message?: string, cause?: Error) {
    super(message || `Content was filtered by ${provider}'s safety system.`, provider, 'CONTENT_FILTER', 400, cause);
    this.name = 'ContentFilterError';
  }
}

export class ModelNotFoundError extends AIError {
  constructor(provider: string, model: string, cause?: Error) {
    super(`Model "${model}" not found or not accessible for ${provider}.`, provider, 'MODEL_NOT_FOUND', 404, cause);
    this.name = 'ModelNotFoundError';
  }
}

export class ContextLengthError extends AIError {
  constructor(provider: string, message?: string, cause?: Error) {
    super(
      message || `Context length exceeded for ${provider}. Please reduce the input size.`,
      provider,
      'CONTEXT_LENGTH_EXCEEDED',
      400,
      cause
    );
    this.name = 'ContextLengthError';
  }
}

export class TimeoutError extends AIError {
  constructor(provider: string, timeout: number, cause?: Error) {
    super(`Request to ${provider} timed out after ${timeout}ms.`, provider, 'TIMEOUT', 408, cause);
    this.name = 'TimeoutError';
  }
}

export class NetworkError extends AIError {
  constructor(provider: string, message?: string, cause?: Error) {
    super(message || `Network error while connecting to ${provider}.`, provider, 'NETWORK_ERROR', undefined, cause);
    this.name = 'NetworkError';
  }
}

export class ServerError extends AIError {
  constructor(provider: string, statusCode: number = 500, message?: string, cause?: Error) {
    super(
      message || `Server error from ${provider}. Status: ${statusCode}`,
      provider,
      'SERVER_ERROR',
      statusCode,
      cause
    );
    this.name = 'ServerError';
  }
}

export function parseError(error: unknown, provider: string): AIError {
  if (error instanceof AIError) {
    return error;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    const anyError = error as { status?: number; statusCode?: number; code?: string };
    const statusCode = anyError.status || anyError.statusCode;

    // Check for authentication errors
    if (
      statusCode === 401 ||
      message.includes('unauthorized') ||
      message.includes('invalid api key') ||
      message.includes('authentication')
    ) {
      return new AuthenticationError(provider, error.message, error);
    }

    // Check for rate limit errors
    if (statusCode === 429 || message.includes('rate limit') || message.includes('too many requests')) {
      return new RateLimitError(provider, undefined, error.message, error);
    }

    // Check for context length errors
    if (
      message.includes('context length') ||
      message.includes('too many tokens') ||
      message.includes('maximum context')
    ) {
      return new ContextLengthError(provider, error.message, error);
    }

    // Check for content filter errors
    if (message.includes('content filter') || message.includes('safety') || message.includes('blocked')) {
      return new ContentFilterError(provider, error.message, error);
    }

    // Check for model not found errors
    if (statusCode === 404 || message.includes('model not found') || message.includes('does not exist')) {
      return new ModelNotFoundError(provider, 'unknown', error);
    }

    // Check for timeout errors
    if (anyError.code === 'ETIMEDOUT' || anyError.code === 'ESOCKETTIMEDOUT' || message.includes('timeout')) {
      return new TimeoutError(provider, 0, error);
    }

    // Check for network errors
    if (
      anyError.code === 'ECONNREFUSED' ||
      anyError.code === 'ENOTFOUND' ||
      anyError.code === 'ECONNRESET' ||
      message.includes('network')
    ) {
      return new NetworkError(provider, error.message, error);
    }

    // Check for server errors
    if (statusCode && statusCode >= 500) {
      return new ServerError(provider, statusCode, error.message, error);
    }

    // Check for invalid request errors
    if (statusCode === 400) {
      return new InvalidRequestError(provider, error.message, error);
    }

    // Generic AI error
    return new AIError(error.message, provider, undefined, statusCode, error);
  }

  // Unknown error type
  return new AIError(String(error), provider);
}

export function isRetryableError(error: AIError): boolean {
  return (
    error instanceof RateLimitError ||
    error instanceof TimeoutError ||
    error instanceof NetworkError ||
    error instanceof ServerError
  );
}
