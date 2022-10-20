import { RetryOptions, BackoffStrategyContext } from './types';
import { waitFor } from './utils/waitFor';
import { applyTimeout } from './utils/applyTimeout';
import { isRetryable } from './utils/isRetryable';
import { fixedBackoffStrategy } from './utils/backoff';
import { RetryAbortedError } from './RetryAbortedError';
import { RetryFailedError } from './RetryFailedError';

export const retryPolicy = {
  config: (options: Partial<RetryOptions>) => {
    return new Retry(options);
  },
};

class Retry {
  private options: RetryOptions = {
    maxAttempts: 1,
    backoff: fixedBackoffStrategy({ delay: 100, maxDelay: 32 * 1000 }),
    jitter: 'none',
    timeout: 0,
  };

  constructor(options: Partial<RetryOptions>) {
    this.options = { ...this.options, ...options };
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    const { maxAttempts, jitter, backoff, timeout } = this.options;

    const task = async () => {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await fn();
        } catch (error) {
          if (error instanceof RetryAbortedError) {
            throw error;
          }

          if (isRetryable(attempt, maxAttempts)) {
            await waitFor(
              backoff({
                attempt,
                jitter,
              } as BackoffStrategyContext)
            );
          }
        }
      }

      throw new RetryFailedError('Task retry failed.');
    };

    return applyTimeout(task, timeout);
  }
}
