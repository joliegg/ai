export declare class AIError extends Error {
    readonly provider: string;
    readonly code?: string | undefined;
    readonly statusCode?: number | undefined;
    readonly cause?: Error | undefined;
    constructor(message: string, provider: string, code?: string | undefined, statusCode?: number | undefined, cause?: Error | undefined);
    toJSON(): {
        name: string;
        message: string;
        provider: string;
        code: string | undefined;
        statusCode: number | undefined;
    };
}
export declare class AuthenticationError extends AIError {
    constructor(provider: string, message?: string, cause?: Error);
}
export declare class RateLimitError extends AIError {
    readonly retryAfter?: number;
    constructor(provider: string, retryAfter?: number, message?: string, cause?: Error);
}
export declare class InvalidRequestError extends AIError {
    constructor(provider: string, message: string, cause?: Error);
}
export declare class ContentFilterError extends AIError {
    constructor(provider: string, message?: string, cause?: Error);
}
export declare class ModelNotFoundError extends AIError {
    constructor(provider: string, model: string, cause?: Error);
}
export declare class ContextLengthError extends AIError {
    constructor(provider: string, message?: string, cause?: Error);
}
export declare class TimeoutError extends AIError {
    constructor(provider: string, timeout: number, cause?: Error);
}
export declare class NetworkError extends AIError {
    constructor(provider: string, message?: string, cause?: Error);
}
export declare class ServerError extends AIError {
    constructor(provider: string, statusCode?: number, message?: string, cause?: Error);
}
export declare function parseError(error: unknown, provider: string): AIError;
export declare function isRetryableError(error: AIError): boolean;
