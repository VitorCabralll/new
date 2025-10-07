/**
 * Utility for retry logic with exponential backoff
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  timeout?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  timeout: 60000, // 60 seconds
  onRetry: () => {},
};

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const delay = options.initialDelay * Math.pow(options.backoffMultiplier, attempt);
  return Math.min(delay, options.maxDelay);
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: any): boolean {
  // Network errors
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
    return true;
  }

  // API rate limit errors (429)
  if (error.status === 429 || error.statusCode === 429) {
    return true;
  }

  // Service unavailable (503)
  if (error.status === 503 || error.statusCode === 503) {
    return true;
  }

  // Timeout errors
  if (error.name === 'AbortError' || error.name === 'TimeoutError') {
    return true;
  }

  return false;
}

/**
 * Retry an async function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), opts.timeout);

      try {
        const result = await fn();
        clearTimeout(timeoutId);
        return result;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error: any) {
      lastError = error;

      // If it's the last attempt or error is not retryable, throw
      if (attempt === opts.maxRetries || !isRetryableError(error)) {
        throw error;
      }

      // Call retry callback
      opts.onRetry(attempt + 1, error);

      // Wait before retrying
      const delay = calculateDelay(attempt, opts);
      console.log(`Retry attempt ${attempt + 1}/${opts.maxRetries} after ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Retry wrapper for Gemini API calls
 */
export async function withGeminiRetry<T>(
  fn: () => Promise<T>,
  context: string = 'Gemini API call'
): Promise<T> {
  return withRetry(fn, {
    maxRetries: 3,
    initialDelay: 2000,
    maxDelay: 15000,
    timeout: 120000, // 2 minutes
    onRetry: (attempt, error) => {
      console.warn(`${context} failed (attempt ${attempt}):`, error.message);
    },
  });
}
