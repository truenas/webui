import { lastValueFrom, Observable, Subject } from 'rxjs';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { attachJobErrorReply } from 'app/modules/websocket/typed-api/attach-job-error-reply';
import { ApiCallError, FailedJobError } from 'app/services/errors/error.classes';

type Messages = Parameters<typeof attachJobErrorReply>[0];

describe('attachJobErrorReply', () => {
  let messages$: Subject<unknown>;
  let job$: Subject<Job>;

  const failedJob = { id: 7, state: JobState.Failed, message_ids: ['request-1'] } as Job;
  const errorReply = (id: string, data: unknown): unknown => ({ jsonrpc: '2.0', id, error: { code: -32001, data } });

  beforeEach(() => {
    messages$ = new Subject();
    job$ = new Subject();
  });

  function follow(graceMs?: number): Promise<Job> {
    return lastValueFrom(job$.pipe(attachJobErrorReply(messages$ as unknown as Messages, graceMs)));
  }

  function fail(): void {
    job$.error(new FailedJobError(failedJob));
  }

  it('attaches the error reply that arrived before the job was seen to fail', async () => {
    const result = follow();

    messages$.next(errorReply('request-1', { errname: 'EINVAL', reason: 'Bad path' }));
    fail();

    await expect(result).rejects.toBeInstanceOf(FailedJobError);
    await expect(result).rejects.toMatchObject({ apiErrorDetails: { errname: 'EINVAL', reason: 'Bad path' } });
  });

  it('waits for an error reply that arrives after the job was seen to fail', async () => {
    const result = follow();

    fail();
    messages$.next(errorReply('request-1', { errname: 'EFAULT' }));

    await expect(result).rejects.toMatchObject({ apiErrorDetails: { errname: 'EFAULT' } });
  });

  it('ignores error replies to other requests', async () => {
    jest.useFakeTimers();
    const error = follow(100).catch((caught: unknown) => caught);

    messages$.next(errorReply('another-request', { errname: 'EPERM' }));
    fail();
    jest.advanceTimersByTime(100);

    expect(await error).toBeInstanceOf(FailedJobError);
    expect(await error).not.toHaveProperty('apiErrorDetails');
    jest.useRealTimers();
  });

  it('gives up on the reply after the grace period and still throws the failure', async () => {
    jest.useFakeTimers();
    const error = follow(100).catch((caught: unknown) => caught);

    fail();
    jest.advanceTimersByTime(100);

    expect(await error).toBeInstanceOf(FailedJobError);
    expect(await error).not.toHaveProperty('apiErrorDetails');
    jest.useRealTimers();
  });

  it('passes other errors and successful jobs through untouched', async () => {
    const refused = new ApiCallError({ code: -32001, message: 'Method call error' });
    const failed = follow();
    job$.error(refused);
    await expect(failed).rejects.toBe(refused);

    job$ = new Subject();
    const succeeded = follow();
    job$.next({ id: 8, state: JobState.Success } as Job);
    job$.complete();
    expect(await succeeded).toMatchObject({ id: 8 });
  });

  it('stops listening to the connection when the job settles', async () => {
    const succeeded = follow();
    job$.complete();
    await succeeded.catch((): void => undefined);

    expect(messages$.observed).toBe(false);
  });

  it('listens from the moment the job is subscribed, before the request goes out', () => {
    const sent: string[] = [];
    const source$ = new Observable<Job>((): void => {
      sent.push(messages$.observed ? 'listening' : 'deaf');
    });

    source$.pipe(attachJobErrorReply(messages$ as unknown as Messages)).subscribe();

    expect(sent).toEqual(['listening']);
  });
});
