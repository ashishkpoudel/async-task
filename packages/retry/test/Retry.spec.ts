import { Retry } from '../src/Retry';
import { RetryAbortedError } from '../src/RetryAbortedError';
import { RetryFailedError } from '../src/RetryFailedError';
import { RetryTimeoutError } from '../src/RetryTimeoutError';
import { TaskStub } from './TaskStub';

describe('Retry Task', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fail after retries are completed', async () => {
    const task = new TaskStub();
    const taskSpy = jest.spyOn(task, 'fails');

    await expect(new Retry({ attempts: 5 }).execute(() => task.fails())).rejects.toThrow(
      RetryFailedError
    );

    expect(taskSpy).toHaveBeenCalledTimes(5);
  });

  it('should stop retries when AbortRetryError is thrown', async () => {
    const task = new TaskStub();
    const taskSpy = jest.spyOn(task, 'abortAfterFailed');

    await expect(
      new Retry({ attempts: 5 }).execute(() => task.abortAfterFailed(3))
    ).rejects.toThrow(RetryAbortedError);

    expect(taskSpy).toHaveBeenCalledTimes(3);
    expect(task.abortAfterFailedCount).toEqual(3);
  });

  it('should result in timeout exceed when execution take longer then timeout', async () => {
    const task = new Promise((resolve) => {
      setTimeout(() => resolve('random task..'), 15);
    });

    await expect(new Retry({ attempts: 1, timeout: 1 }).execute(() => task)).rejects.toThrow(
      RetryTimeoutError
    );
  });

  it('should result in sucessful execution when task is resolved before timeout', async () => {
    const task = new Promise((resolve) => {
      setTimeout(() => resolve('random task..'), 14);
    });

    const result = await new Retry({ attempts: 1, timeout: 15 }).execute(() => task);

    expect(result).toEqual('random task..');
  });
});