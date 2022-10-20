import { BackoffStrategyContext, Jitter } from '../types';

export const fixedBackoffStrategy = (options: { delay: number; maxDelay: number }) => {
  return (context: BackoffStrategyContext) => {
    const { attempt, jitter } = context;
    const { delay, maxDelay } = options;

    return applyJitter(Math.min(delay + attempt * 0, maxDelay), jitter);
  };
};

export const linearBackoffStrategy = (options: { delay: number; maxDelay: number }) => {
  return (context: BackoffStrategyContext) => {
    const { attempt, jitter } = context;
    const { delay, maxDelay } = options;

    return applyJitter(Math.min(attempt * delay, maxDelay), jitter);
  };
};

export const exponentialBackoffStrategy = (options: { delay: number; maxDelay: number }) => {
  return (context: BackoffStrategyContext) => {
    const { attempt, jitter } = context;
    const { delay, maxDelay } = options;

    return applyJitter(Math.min(attempt === 1 ? delay : Math.pow(2, attempt) * delay, maxDelay), jitter);
  };
};

const applyJitter = (backoffDuration: number, jitter: Jitter) => {
  switch (jitter) {
    case 'full':
      return Math.round(Math.random() * backoffDuration);
    case 'none':
      return backoffDuration;
    default:
      throw new Error(`Invalid jitter: ${jitter}`);
  }
};
