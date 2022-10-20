import { policy } from './Retry';
import { fixedBackoffStrategy, linearBackoffStrategy, exponentialBackoffStrategy } from './utils/backoff';
import { RetryAbortedError } from './RetryAbortedError';
import { RetryFailedError } from './RetryFailedError';
import { RetryTimeoutError } from './RetryTimeoutError';
import { TaskStub } from '../test/TaskStub';

describe('Retry Task', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should fail after retries are completed', async () => {
    const task = new TaskStub();
    const taskSpy = jest.spyOn(task, 'fails');

    const retry = policy.config({
      maxAttempts: 5,
    });

    await expect(retry.run(() => task.fails())).rejects.toThrow(RetryFailedError);

    expect(taskSpy).toHaveBeenCalledTimes(5);
  });

  it('should stop retries when AbortRetryError is thrown', async () => {
    const task = new TaskStub();
    const taskSpy = jest.spyOn(task, 'abortAfterFailed');

    const retry = policy.config({
      maxAttempts: 5,
    });

    await expect(retry.run(() => task.abortAfterFailed(3))).rejects.toThrow(RetryAbortedError);

    expect(taskSpy).toHaveBeenCalledTimes(3);
    expect(task.abortAfterFailedCount).toEqual(3);
  });

  it('should result in timeout exceed when execution take longer then timeout', async () => {
    const task = new Promise((resolve) => {
      setTimeout(() => resolve('random task..'), 15);
    });

    const retry = policy.config({
      maxAttempts: 1,
      timeout: 1,
    });

    await expect(retry.run(() => task)).rejects.toThrow(RetryTimeoutError);
  });

  it('should result in sucessful execution when task is resolved before timeout', async () => {
    const task = new Promise((resolve) => {
      setTimeout(() => resolve('random task..'), 14);
    });

    const retry = policy.config({
      maxAttempts: 1,
      timeout: 15,
    });

    const result = await retry.run(() => task);

    expect(result).toEqual('random task..');
  });

  it('should have default of 100ms delay between retries', async () => {
    const task = new TaskStub();
    const timeoutSpy = jest.spyOn(global, 'setTimeout');

    const retry = policy.config({
      maxAttempts: 2,
    });

    await expect(retry.run(() => task.fails())).rejects.toThrow(RetryFailedError);

    expect(timeoutSpy).toHaveBeenNthCalledWith(1, expect.any(Function), 100);
  });

  it('should have appropriate delay under fixedBackoff', async () => {
    const task = new TaskStub();
    const timeoutSpy = jest.spyOn(global, 'setTimeout');

    const retry = policy.config({
      maxAttempts: 3,
      backoff: fixedBackoffStrategy({ delay: 300, maxDelay: 1000 }),
    });

    await expect(retry.run(() => task.fails())).rejects.toThrow(RetryFailedError);

    expect(timeoutSpy).toHaveBeenNthCalledWith(1, expect.any(Function), 300);
    expect(timeoutSpy).toHaveBeenNthCalledWith(2, expect.any(Function), 300);
  });

  it('should have appropriate delay under linearBackoff', async () => {
    const task = new TaskStub();
    const timeoutSpy = jest.spyOn(global, 'setTimeout');

    const retry = policy.config({
      maxAttempts: 3,
      backoff: linearBackoffStrategy({ delay: 100, maxDelay: 3000 }),
    });

    await expect(retry.run(() => task.fails())).rejects.toThrow(RetryFailedError);

    expect(timeoutSpy).toHaveBeenNthCalledWith(1, expect.any(Function), 100);
    expect(timeoutSpy).toHaveBeenNthCalledWith(2, expect.any(Function), 200);
  });

  it('should have appropriate delay under exponentialBackoff', async () => {
    const task = new TaskStub();
    const timeoutSpy = jest.spyOn(global, 'setTimeout');

    const retry = policy.config({
      maxAttempts: 3,
      backoff: exponentialBackoffStrategy({ delay: 20, maxDelay: 3000 }),
    });

    await expect(retry.run(() => task.fails())).rejects.toThrow(RetryFailedError);

    expect(timeoutSpy).toHaveBeenNthCalledWith(1, expect.any(Function), 20);
    expect(timeoutSpy).toHaveBeenNthCalledWith(2, expect.any(Function), 80);
  });
});
