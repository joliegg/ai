"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateBackoff = exports.sleep = void 0;
exports.withRetry = withRetry;
exports.withTimeout = withTimeout;
exports.normalizeContent = normalizeContent;
exports.generateId = generateId;
exports.deepClone = deepClone;
exports.isDefined = isDefined;
exports.pick = pick;
exports.omit = omit;
const errors_1 = require("./errors");
const types_1 = require("./types");
const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};
exports.sleep = sleep;
const calculateBackoff = (attempt, baseDelay, maxDelay = 60000) => {
    const delay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = delay * Math.random() * 0.25;
    return Math.min(delay + jitter, maxDelay);
};
exports.calculateBackoff = calculateBackoff;
async function withRetry(fn, provider, options = {}) {
    const globalConfig = (0, types_1.getGlobalConfig)();
    const maxRetries = options.maxRetries ?? globalConfig.maxRetries ?? 3;
    const retryDelay = options.retryDelay ?? globalConfig.retryDelay ?? 1000;
    const maxDelay = options.maxDelay ?? 60000;
    let lastError;
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = (0, errors_1.parseError)(error, provider);
            // Don't retry if this is the last attempt or error is not retryable
            if (attempt > maxRetries || !(0, errors_1.isRetryableError)(lastError)) {
                throw lastError;
            }
            // Calculate delay - use retry-after header if available
            let delay;
            if (lastError instanceof errors_1.RateLimitError && lastError.retryAfter) {
                delay = lastError.retryAfter * 1000;
            }
            else {
                delay = (0, exports.calculateBackoff)(attempt, retryDelay, maxDelay);
            }
            // Call onRetry callback if provided
            options.onRetry?.(lastError, attempt);
            // Log if debug mode is enabled
            if (globalConfig.debug) {
                console.warn(`[${provider}] Retry attempt ${attempt}/${maxRetries} after ${delay}ms. Error: ${lastError.message}`);
            }
            await (0, exports.sleep)(delay);
        }
    }
    // This should never be reached
    throw lastError || new errors_1.AIError('Unknown error', provider);
}
/**
 * Execute a function with a timeout
 */
async function withTimeout(fn, timeout, provider) {
    if (timeout <= 0) {
        return fn();
    }
    let timer;
    const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => {
            reject(new errors_1.AIError(`Request timed out after ${timeout}ms`, provider, 'TIMEOUT', 408));
        }, timeout);
    });
    try {
        return await Promise.race([fn(), timeoutPromise]);
    }
    finally {
        clearTimeout(timer);
    }
}
/**
 * Normalize message content to string
 */
function normalizeContent(content) {
    if (typeof content === 'string') {
        return content;
    }
    if (Array.isArray(content)) {
        return content
            .map((part) => {
            if (typeof part === 'string')
                return part;
            if (part && typeof part === 'object' && 'text' in part) {
                return part.text;
            }
            return '';
        })
            .join('');
    }
    if (content && typeof content === 'object' && 'text' in content) {
        return content.text;
    }
    return String(content);
}
/**
 * Generate a unique ID
 */
function generateId(prefix = 'msg') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}${random}`;
}
/**
 * Deep clone an object
 */
function deepClone(obj) {
    return structuredClone(obj);
}
/**
 * Check if a value is defined (not null or undefined)
 */
function isDefined(value) {
    return value !== null && value !== undefined;
}
/**
 * Pick specified keys from an object
 */
function pick(obj, keys) {
    const result = {};
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
function omit(obj, keys) {
    const result = { ...obj };
    for (const key of keys) {
        delete result[key];
    }
    return result;
}
