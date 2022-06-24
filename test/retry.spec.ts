import { retry } from '../src/retry';
import { FakeTask } from './fake-task';

describe('Retry', () => {
  it('should fail after retries are completed', async () => {
    const task = new FakeTask();
    const taskSpy = jest.spyOn(task, 'fails');

    await retry(() => task.fails(), { retries: 5 });

    expect(taskSpy).toHaveBeenCalledTimes(5);
    taskSpy.mockRestore();
  });

  it('should stop retries when AbortRetryError is thrown', async () => {
    const task = new FakeTask();
    const taskSpy = jest.spyOn(task, 'abortAfterFailed');

    await retry(() => task.abortAfterFailed(3), { retries: 5 });

    expect(taskSpy).toHaveBeenCalledTimes(3);
    expect(task.abortAfterFailedCount).toEqual(3);

    taskSpy.mockRestore();
  });
});
