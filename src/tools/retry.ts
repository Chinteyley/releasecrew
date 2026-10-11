import { traceSpan } from "../telemetry/recorder.js";

export interface RetryOptions {
  name: string;
  attempts: number;
  baseDelayMs: number;
  retryOn: (error: unknown) => boolean;
  kind?: string;
}

export class RecoverableError extends Error {
  readonly retryAfterMs?: number;

  constructor(message: string, retryAfterMs?: number) {
    super(message);
    this.name = "RecoverableError";
    this.retryAfterMs = retryAfterMs;
  }
}

export function isRateLimitError(error: unknown): boolean {
  if (error instanceof RecoverableError) return true;
  if (!(error instanceof Error)) return false;
  return /rate limit|429|secondary rate/i.test(error.message);
}

export async function withRetry<T>(options: RetryOptions, fn: (attempt: number) => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
    try {
      return await traceSpan(
        {
          kind: options.kind ?? "TOOL",
          name: `${options.name}.attempt_${attempt}`,
          attributes: { attempt, maxAttempts: options.attempts },
        },
        () => fn(attempt),
      );
    } catch (error) {
      lastError = error;
      const retryable = options.retryOn(error);
      if (!retryable || attempt === options.attempts) {
        throw error;
      }
      const retryAfter =
        error instanceof RecoverableError && error.retryAfterMs
          ? error.retryAfterMs
          : options.baseDelayMs * 2 ** (attempt - 1);
      await sleep(retryAfter);
    }
  }
  throw lastError;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
