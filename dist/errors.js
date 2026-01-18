"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerError = exports.NetworkError = exports.TimeoutError = exports.ContextLengthError = exports.ModelNotFoundError = exports.ContentFilterError = exports.InvalidRequestError = exports.RateLimitError = exports.AuthenticationError = exports.AIError = void 0;
exports.parseError = parseError;
exports.isRetryableError = isRetryableError;
class AIError extends Error {
    provider;
    code;
    statusCode;
    cause;
    constructor(message, provider, code, statusCode, cause) {
        super(message);
        this.provider = provider;
        this.code = code;
        this.statusCode = statusCode;
        this.cause = cause;
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
exports.AIError = AIError;
class AuthenticationError extends AIError {
    constructor(provider, message, cause) {
        super(message || `Authentication failed for ${provider}. Please check your API key.`, provider, 'AUTHENTICATION_ERROR', 401, cause);
        this.name = 'AuthenticationError';
    }
}
exports.AuthenticationError = AuthenticationError;
class RateLimitError extends AIError {
    retryAfter;
    constructor(provider, retryAfter, message, cause) {
        super(message || `Rate limit exceeded for ${provider}. ${retryAfter ? `Retry after ${retryAfter} seconds.` : ''}`, provider, 'RATE_LIMIT_ERROR', 429, cause);
        this.name = 'RateLimitError';
        this.retryAfter = retryAfter;
    }
}
exports.RateLimitError = RateLimitError;
class InvalidRequestError extends AIError {
    constructor(provider, message, cause) {
        super(message, provider, 'INVALID_REQUEST', 400, cause);
        this.name = 'InvalidRequestError';
    }
}
exports.InvalidRequestError = InvalidRequestError;
class ContentFilterError extends AIError {
    constructor(provider, message, cause) {
        super(message || `Content was filtered by ${provider}'s safety system.`, provider, 'CONTENT_FILTER', 400, cause);
        this.name = 'ContentFilterError';
    }
}
exports.ContentFilterError = ContentFilterError;
class ModelNotFoundError extends AIError {
    constructor(provider, model, cause) {
        super(`Model "${model}" not found or not accessible for ${provider}.`, provider, 'MODEL_NOT_FOUND', 404, cause);
        this.name = 'ModelNotFoundError';
    }
}
exports.ModelNotFoundError = ModelNotFoundError;
class ContextLengthError extends AIError {
    constructor(provider, message, cause) {
        super(message || `Context length exceeded for ${provider}. Please reduce the input size.`, provider, 'CONTEXT_LENGTH_EXCEEDED', 400, cause);
        this.name = 'ContextLengthError';
    }
}
exports.ContextLengthError = ContextLengthError;
class TimeoutError extends AIError {
    constructor(provider, timeout, cause) {
        super(`Request to ${provider} timed out after ${timeout}ms.`, provider, 'TIMEOUT', 408, cause);
        this.name = 'TimeoutError';
    }
}
exports.TimeoutError = TimeoutError;
class NetworkError extends AIError {
    constructor(provider, message, cause) {
        super(message || `Network error while connecting to ${provider}.`, provider, 'NETWORK_ERROR', undefined, cause);
        this.name = 'NetworkError';
    }
}
exports.NetworkError = NetworkError;
class ServerError extends AIError {
    constructor(provider, statusCode = 500, message, cause) {
        super(message || `Server error from ${provider}. Status: ${statusCode}`, provider, 'SERVER_ERROR', statusCode, cause);
        this.name = 'ServerError';
    }
}
exports.ServerError = ServerError;
function parseError(error, provider) {
    if (error instanceof AIError) {
        return error;
    }
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        const anyError = error;
        const statusCode = anyError.status || anyError.statusCode;
        // Check for authentication errors
        if (statusCode === 401 ||
            message.includes('unauthorized') ||
            message.includes('invalid api key') ||
            message.includes('authentication')) {
            return new AuthenticationError(provider, error.message, error);
        }
        // Check for rate limit errors
        if (statusCode === 429 || message.includes('rate limit') || message.includes('too many requests')) {
            return new RateLimitError(provider, undefined, error.message, error);
        }
        // Check for context length errors
        if (message.includes('context length') ||
            message.includes('too many tokens') ||
            message.includes('maximum context')) {
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
        if (anyError.code === 'ECONNREFUSED' ||
            anyError.code === 'ENOTFOUND' ||
            anyError.code === 'ECONNRESET' ||
            message.includes('network')) {
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
function isRetryableError(error) {
    return (error instanceof RateLimitError ||
        error instanceof TimeoutError ||
        error instanceof NetworkError ||
        error instanceof ServerError);
}
