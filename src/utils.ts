import { AIError, RateLimitError, isRetryableError, parseError } from './errors';
import { getGlobalConfig } from './types';

export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  maxDelay?: number;
  onRetry?: (error: AIError, attempt: number) => void;
}

export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const calculateBackoff = (attempt: number, baseDelay: number, maxDelay: number = 60000): number => {
  const delay = baseDelay * Math.pow(2, attempt - 1);
  const jitter = delay * Math.random() * 0.25;

  return Math.min(delay + jitter, maxDelay);
};

export async function withRetry<T>(fn: () => Promise<T>, provider: string, options: RetryOptions = {}): Promise<T> {
  const globalConfig = getGlobalConfig();
  const maxRetries = options.maxRetries ?? globalConfig.maxRetries ?? 3;
  const retryDelay = options.retryDelay ?? globalConfig.retryDelay ?? 1000;
  const maxDelay = options.maxDelay ?? 60000;

  let lastError: AIError | undefined;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = parseError(error, provider);

      // Don't retry if this is the last attempt or error is not retryable
      if (attempt > maxRetries || !isRetryableError(lastError)) {
        throw lastError;
      }

      // Calculate delay - use retry-after header if available
      let delay: number;
      if (lastError instanceof RateLimitError && lastError.retryAfter) {
        delay = lastError.retryAfter * 1000;
      } else {
        delay = calculateBackoff(attempt, retryDelay, maxDelay);
      }

      // Call onRetry callback if provided
      options.onRetry?.(lastError, attempt);

      // Log if debug mode is enabled
      if (globalConfig.debug) {
        console.warn(
          `[${provider}] Retry attempt ${attempt}/${maxRetries} after ${delay}ms. Error: ${lastError.message}`
        );
      }

      await sleep(delay);
    }
  }

  // This should never be reached
  throw lastError || new AIError('Unknown error', provider);
}

/**
 * Execute a function with a timeout
 */
export async function withTimeout<T>(fn: () => Promise<T>, timeout: number, provider: string): Promise<T> {
  if (timeout <= 0) {
    return fn();
  }

  let timer: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new AIError(`Request timed out after ${timeout}ms`, provider, 'TIMEOUT', 408));
    }, timeout);
  });

  try {
    return await Promise.race([fn(), timeoutPromise]);
  } finally {
    clearTimeout(timer!);
  }
}

/**
 * Normalize message content to string
 */
export function normalizeContent(content: unknown): string {
  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object' && 'text' in part) {
          return (part as { text: string }).text;
        }
        return '';
      })
      .join('');
  }

  if (content && typeof content === 'object' && 'text' in content) {
    return (content as { text: string }).text;
  }

  return String(content);
}

/**
 * Generate a unique ID
 */
export function generateId(prefix: string = 'msg'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}${random}`;
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return structuredClone(obj);
}

/**
 * Check if a value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Pick specified keys from an object
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Omit specified keys from an object
 */
export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result as Omit<T, K>;
}
