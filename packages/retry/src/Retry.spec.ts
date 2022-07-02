import { Retry } from './Retry';
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

    await expect(new Retry({ attempts: 5 }).retry(() => task.fails())).rejects.toThrow(RetryFailedError);

    expect(taskSpy).toHaveBeenCalledTimes(5);
  });

  it('should stop retries when AbortRetryError is thrown', async () => {
    const task = new TaskStub();
    const taskSpy = jest.spyOn(task, 'abortAfterFailed');

    await expect(new Retry({ attempts: 5 }).retry(() => task.abortAfterFailed(3))).rejects.toThrow(RetryAbortedError);

    expect(taskSpy).toHaveBeenCalledTimes(3);
    expect(task.abortAfterFailedCount).toEqual(3);
  });

  it('should result in timeout exceed when execution take longer then timeout', async () => {
    const task = new Promise((resolve) => {
      setTimeout(() => resolve('random task..'), 15);
    });

    await expect(new Retry({ attempts: 1, timeout: 1 }).retry(() => task)).rejects.toThrow(RetryTimeoutError);
  });

  it('should result in sucessful execution when task is resolved before timeout', async () => {
    const task = new Promise((resolve) => {
      setTimeout(() => resolve('random task..'), 14);
    });

    const result = await new Retry({ attempts: 1, timeout: 15 }).retry(() => task);

    expect(result).toEqual('random task..');
  });

  it('should have default of 100ms delay between retries', async () => {
    const task = new TaskStub();
    const timeoutSpy = jest.spyOn(global, 'setTimeout');

    await expect(new Retry({ attempts: 2 }).retry(() => task.fails())).rejects.toThrow(RetryFailedError);

    expect(timeoutSpy).toHaveBeenNthCalledWith(1, expect.any(Function), 100);
  });

  it('should have appropriate delay between retries based on retry config', async () => {
    const task = new TaskStub();
    const timeoutSpy = jest.spyOn(global, 'setTimeout');

    await expect(new Retry({ attempts: 3, delay: 300 }).retry(() => task.fails())).rejects.toThrow(RetryFailedError);

    expect(timeoutSpy).toHaveBeenNthCalledWith(1, expect.any(Function), 300);
    expect(timeoutSpy).toHaveBeenNthCalledWith(2, expect.any(Function), 300);
  });
});