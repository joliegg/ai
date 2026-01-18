import { AIError } from './errors';
export interface RetryOptions {
    maxRetries?: number;
    retryDelay?: number;
    maxDelay?: number;
    onRetry?: (error: AIError, attempt: number) => void;
}
export declare const sleep: (ms: number) => Promise<void>;
export declare const calculateBackoff: (attempt: number, baseDelay: number, maxDelay?: number) => number;
export declare function withRetry<T>(fn: () => Promise<T>, provider: string, options?: RetryOptions): Promise<T>;
export declare function createTimeout(ms: number, provider: string): Promise<never>;
/**
 * Execute a function with a timeout
 */
export declare function withTimeout<T>(fn: () => Promise<T>, timeout: number, provider: string): Promise<T>;
/**
 * Normalize message content to string
 */
export declare function normalizeContent(content: unknown): string;
/**
 * Generate a unique ID
 */
export declare function generateId(prefix?: string): string;
/**
 * Deep clone an object
 */
export declare function deepClone<T>(obj: T): T;
/**
 * Check if a value is defined (not null or undefined)
 */
export declare function isDefined<T>(value: T | null | undefined): value is T;
/**
 * Pick specified keys from an object
 */
export declare function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>;
/**
 * Omit specified keys from an object
 */
export declare function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K>;
