import { of, throwError, type Observable } from 'rxjs';
import type { E2eApiClient } from '../../../../../e2e/support/api/client';
import { runJob } from '../../../../../e2e/support/jobs';

/**
 * Behavioural guard for the E2E suite's job runner.
 *
 * `runJob` decides whether appliance teardown succeeded, and every distinction
 * it draws is one that reads as reasonable and fails silently when inverted: an
 * unanswered query is not an empty answer, a job's terminal state is not a side
 * effect, and a lost job id is not a failed job. Nothing else in the repository
 * can execute it — `e2e/**` is outside Jest's roots and Playwright matches only
 * `*.e2e.ts` — so these cases are what stop the next edit reversing one.
 *
 * Lives under `src/` for the same reason as the `kebabTestSegment` parity spec:
 * it is the only tree Jest compiles.
 */
describe('e2e runJob', () => {
  const budget = { timeoutMs: 400, whatItCosts: 'The work did not happen.' };

  /** Scripted middleware: one `core.get_jobs` answer per poll. */
  function client(polls: (unknown[] | 'reject')[], startsWith: 'id' | 'reject' = 'id'): E2eApiClient {
    let poll = 0;
    return {
      api: {
        callAndGetJobId: () => (startsWith === 'reject'
          ? throwError(() => new Error('job event lost'))
          : of(42)),
        query: (): Observable<unknown> => {
          const step = polls[Math.min(poll++, polls.length - 1)];
          return step === 'reject' ? throwError(() => new Error('socket dropped')) : of(step);
        },
      },
    } as unknown as E2eApiClient;
  }

  const finished = (state: string, error: string | null = null): unknown[][] => (
    [[{ id: 42, state, error }]]
  );

  it('returns once the job reports SUCCESS', async () => {
    await expect(runJob(client(finished('SUCCESS')), () => of(42), budget)).resolves.toBeUndefined();
  });

  it.each(['FAILED', 'ABORTED', 'ERROR'])('throws when the job reports %s', async (state) => {
    await expect(runJob(client(finished(state)), () => of(42), budget))
      .rejects.toThrow(budget.whatItCosts);
  });

  it('surfaces the job error text', async () => {
    await expect(runJob(client(finished('FAILED', 'destroy failed')), () => of(42), budget))
      .rejects.toThrow('destroy failed');
  });

  it('keeps polling while the job is still running', async () => {
    const polls = [[{ id: 42, state: 'RUNNING', error: null }], ...finished('SUCCESS')];
    await expect(runJob(client(polls), () => of(42), budget)).resolves.toBeUndefined();
  });

  it('treats a rejected poll as transient, not as failure', async () => {
    await expect(runJob(client(['reject', ...finished('SUCCESS')]), () => of(42), budget))
      .resolves.toBeUndefined();
  });

  describe('when middleware has no record of the job', () => {
    it('consults confirm, and returns when it is satisfied', async () => {
      await expect(runJob(client([[]]), () => of(42), {
        ...budget,
        confirm: () => Promise.resolve(true),
      })).resolves.toBeUndefined();
    });

    it('throws when confirm is not satisfied', async () => {
      await expect(runJob(client([[]]), () => of(42), {
        ...budget,
        confirm: () => Promise.resolve(false),
      })).rejects.toThrow(budget.whatItCosts);
    });

    it('throws when no confirm was supplied', async () => {
      await expect(runJob(client([[]]), () => of(42), budget))
        .rejects.toThrow(budget.whatItCosts);
    });

    it('reports that middleware had no record, not that the job was slow', async () => {
      await expect(runJob(client([[]]), () => of(42), budget))
        .rejects.toThrow(/no record/);
    });
  });

  // The distinction the tie-break turns on: a query that failed is not a query
  // that answered "nothing". Confusing them lets a side effect that is true
  // early stand in for a job that has not finished.
  describe('the tie-break needs an answer, not merely an attempt', () => {
    it('never consults confirm when no poll has been answered', async () => {
      const confirm = jest.fn().mockResolvedValue(true);

      await expect(runJob(client(['reject']), () => of(42), { ...budget, confirm }))
        .rejects.toThrow(budget.whatItCosts);

      expect(confirm).not.toHaveBeenCalled();
    });

    it('stops consulting confirm once polls start failing again', async () => {
      const confirm = jest.fn().mockResolvedValue(false);

      await expect(runJob(client([[], 'reject']), () => of(42), { ...budget, confirm }))
        .rejects.toThrow(budget.whatItCosts);

      // Once for the answered-empty poll; never again once they only failed.
      expect(confirm).toHaveBeenCalledTimes(1);
    });
  });

  describe('when the job id never arrives', () => {
    it('asks confirm before reporting an unknown outcome', async () => {
      await expect(runJob(client([]), () => throwError(() => new Error('lost')), {
        ...budget,
        confirm: () => Promise.resolve(true),
      })).resolves.toBeUndefined();
    });

    it('reports the outcome as unknown when confirm cannot vouch for it', async () => {
      await expect(runJob(client([]), () => throwError(() => new Error('lost')), budget))
        .rejects.toThrow(/could not be started/);
    });
  });

  it('does not let a throwing confirm fail the run on its own', async () => {
    await expect(runJob(client([[]]), () => of(42), {
      ...budget,
      confirm: () => Promise.reject(new Error('confirm blew up')),
    })).rejects.toThrow(budget.whatItCosts);
  });
});
