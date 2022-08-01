# Retry

Utility to retry async operations.

## Installation

```
npm install @task-runner/retry
```

## Usage

```
import { retry, fixedBackoffStrategy } from '@task-runner/retry'

const task = () => {
  return fetch('https://example.com/data');
}

const main = async () => {
  try {
    const result = await retry(() => task, {
      attempts: 3,
      timeout: 10000,
      backoff: fixedBackoffStrategy({ delay: 200, maxDelay: 5000})
    });

    // handle result
  } catch (error) {
    // handle error
  }
}

main();
```

## Retry Options

- `attempts: number`

  Maximum number of times to retry function.

- `timeout?: number`

  Overall timeout in milliseconds

- `backoff?: Function`

  Backoff strategy to use for increasing delay in-between retries. Available strategity are: fixedBackoffStrategy, linearBackoffStrategy, exponentialBackoffStrategy

- `jitter?: 'full' | 'none'`

  Adds randomness to backoff duration to spread the retries around in time and minimize collisions.
