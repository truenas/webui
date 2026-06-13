import { TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { selectJobs } from 'app/modules/jobs/store/job.selectors';
import { TaskCardJobRepainter } from 'app/pages/data-protection/utils/task-card-job-repainter';

interface TestRow {
  id: number;
  job?: Job | null;
  state?: { state: JobState };
}

describe('TaskCardJobRepainter', () => {
  let store$: MockStore;
  let rows: TestRow[];
  let repainter: TaskCardJobRepainter<TestRow>;

  function setJobs(jobs: Job[]): void {
    store$.overrideSelector(selectJobs, jobs);
    store$.refreshState();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideMockStore({ selectors: [{ selector: selectJobs, value: [] }] })],
    });
    store$ = TestBed.inject(MockStore);
    rows = [];
    repainter = new TaskCardJobRepainter<TestRow>(
      store$,
      () => rows,
      (next) => {
        rows = next;
      },
      (row, job) => ({ ...row, job, state: { state: job.state } }),
    );
  });

  afterEach(() => repainter.destroy());

  it('repaints the backing row in place when its job emits a new state', () => {
    rows = [{ id: 1, job: { id: 10, state: JobState.Running } as Job }];
    setJobs([{ id: 10, state: JobState.Running } as Job]);

    repainter.watch(rows);
    setJobs([{ id: 10, state: JobState.Success } as Job]);

    expect(rows[0].state?.state).toBe(JobState.Success);
    expect(rows[0].job?.state).toBe(JobState.Success);
  });

  it('passes rows whose job did not emit through by reference', () => {
    // Stable reference for job 20 so its selector stays distinct and does not
    // re-emit when only job 10 changes — isolating the merge to the matching row.
    const job20 = { id: 20, state: JobState.Running } as Job;
    rows = [{ id: 1, job: { id: 10, state: JobState.Running } as Job }, { id: 2, job: job20 }];
    setJobs([{ id: 10, state: JobState.Running } as Job, job20]);
    repainter.watch(rows);

    const row2Before = rows.find((row) => row.id === 2);
    setJobs([{ id: 10, state: JobState.Success } as Job, job20]);

    expect(rows.find((row) => row.id === 1)?.state?.state).toBe(JobState.Success);
    expect(rows.find((row) => row.id === 2)).toBe(row2Before);
  });

  it('drops the previous batch of subscriptions on re-watch so it does not leak one per reload', () => {
    const mergeSpy = jest.fn((row: TestRow, job: Job) => ({ ...row, job, state: { state: job.state } }));
    repainter.destroy();
    repainter = new TaskCardJobRepainter<TestRow>(
      store$,
      () => rows,
      (next) => {
        rows = next;
      },
      mergeSpy,
    );

    rows = [{ id: 1, job: { id: 10, state: JobState.Running } as Job }];
    setJobs([{ id: 10, state: JobState.Running } as Job]);
    repainter.watch(rows);

    // Second load: the row is now backed by a different job id; the job-10
    // subscription from the first watch must have been torn down.
    rows = [{ id: 1, job: { id: 11, state: JobState.Running } as Job }];
    setJobs([{ id: 11, state: JobState.Running } as Job]);
    repainter.watch(rows);
    mergeSpy.mockClear();

    // An update to the now-orphaned first job must not repaint any row.
    setJobs([{ id: 10, state: JobState.Failed } as Job]);

    expect(mergeSpy).not.toHaveBeenCalled();
  });

  it('repaintRow applies the transform to the matching row and republishes the list', () => {
    const row1 = { id: 1, job: { id: 10, state: JobState.Running } as Job };
    const row2 = { id: 2, job: { id: 20, state: JobState.Running } as Job };
    rows = [row1, row2];

    repainter.repaintRow(2, (row) => ({ ...row, state: { state: JobState.Success } }));

    expect(rows.find((row) => row.id === 2)?.state?.state).toBe(JobState.Success);
    // The non-matching row is passed through untouched by reference.
    expect(rows.find((row) => row.id === 1)).toBe(row1);
  });

  it('reconcile reloads only when the job state changed since the last value seen', () => {
    const reload = jest.fn();
    rows = [{ id: 1, job: { id: 10, state: JobState.Running } as Job }];
    setJobs([{ id: 10, state: JobState.Running } as Job]);
    repainter.watch(rows);

    // watch() recorded Running for job 10, so a same-state reconcile is a no-op.
    repainter.reconcile({ id: 10, state: JobState.Running } as Job, reload);
    expect(reload).not.toHaveBeenCalled();

    // A genuine state change triggers exactly one reload.
    repainter.reconcile({ id: 10, state: JobState.Success } as Job, reload);
    expect(reload).toHaveBeenCalledTimes(1);

    // The new state is now remembered, so repeating it does not reload again.
    repainter.reconcile({ id: 10, state: JobState.Success } as Job, reload);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('reconcile reloads for a freshly-minted job id never seen before', () => {
    const reload = jest.fn();
    repainter.watch([]);

    repainter.reconcile({ id: 99, state: JobState.Running } as Job, reload);

    expect(reload).toHaveBeenCalledTimes(1);
  });
});
