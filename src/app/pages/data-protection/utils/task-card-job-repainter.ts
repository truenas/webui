import { Store } from '@ngrx/store';
import { Subscription, filter } from 'rxjs';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { selectJob } from 'app/modules/jobs/store/job.selectors';

export interface TaskWithJob {
  id: number;
  job?: Job | null;
}

/**
 * Repaints the job-backed task cards' status pills as jobs progress. The pill doesn't update itself,
 * so a fresh row array goes back through the card's `setRows`; OnPush would miss an in-place mutation.
 * `watch()` re-runs on every reload, so it drops the previous subscriptions first.
 * Callers must publish their rows before `watch()`: `selectJob` emits synchronously on subscribe,
 * so the first repaint can fire before `watch()` returns.
 */
export class TaskCardJobRepainter<T extends TaskWithJob> {
  /** Last seen state per job id, used by `reconcile` to dedupe full reloads. */
  private readonly jobStates = new Map<number, JobState>();
  private subscriptions = new Subscription();

  constructor(
    private readonly store$: Store,
    private readonly getRows: () => T[],
    private readonly setRows: (rows: T[]) => void,
    private readonly mergeJob: (row: T, job: Job) => T,
  ) {}

  watch(tasks: T[]): void {
    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();
    const watchedJobIds = new Set<number>();

    // `selectJob` emits synchronously on subscribe, so subscribing each task in
    // turn would fire one full-list `setRows` per task — O(N²) row rebuilds
    // (plus N data-provider emissions) before the first paint on every reload.
    // Collect those synchronous values and apply them in a single `setRows`
    // below; later (asynchronous) progress emits repaint individually.
    const initialJobs = new Map<number, Job>();
    let initializing = true;

    tasks.forEach((task) => {
      if (!task.job) {
        return;
      }
      watchedJobIds.add(task.job.id);
      this.subscriptions.add(
        this.store$.select(selectJob(task.job.id)).pipe(filter(Boolean)).subscribe((job) => {
          if (initializing) {
            this.jobStates.set(job.id, job.state);
            initialJobs.set(job.id, job);
            return;
          }
          // A burst of progress emits keeps the same state; only repaint when
          // the state actually moves, since that is all the pill renders — except
          // when the emit brings logs the row does not have yet (see `bringsLogs`).
          if (this.jobStates.get(job.id) === job.state && !this.bringsLogs(job)) {
            return;
          }
          this.jobStates.set(job.id, job.state);
          this.setRows(this.getRows().map((row) => (row.job?.id === job.id ? this.mergeJob(row, job) : row)));
        }),
      );
    });

    initializing = false;
    if (initialJobs.size) {
      this.setRows(this.getRows().map((row) => {
        const job = row.job ? initialJobs.get(row.job.id) : null;
        return job ? this.mergeJob(row, job) : row;
      }));
    }

    // Drop last-seen state for jobs no longer backing any row. Each manual run
    // mints a fresh job id, so without this the map would grow one entry per run
    // over the dashboard's lifetime.
    for (const jobId of this.jobStates.keys()) {
      if (!watchedJobIds.has(jobId)) {
        this.jobStates.delete(jobId);
      }
    }
  }

  /**
   * Whether `job` carries a log excerpt (or error) the row's copy is missing. Middleware publishes
   * the final state before reading `logs_excerpt` off disk, so the logs arrive in a second `CHANGED`
   * event with the same state. Deduping on state alone would leave the pill saying "No logs are
   * available" for a run that has them.
   */
  private bringsLogs(job: Job): boolean {
    const current = this.getRows().find((row) => row.job?.id === job.id)?.job;
    if (!current) {
      return false;
    }

    return (!!job.logs_excerpt && !current.logs_excerpt) || (!!job.error && !current.error);
  }

  /**
   * Applies `transform` to one row and republishes the list through `setRows`. Run/stop handlers
   * repaint with this and call `reconcile` only when they hold a fresh job. It leaves `jobStates`
   * alone on purpose: after a repaint-only call (e.g. stopping to `Aborted`), the `watch()`
   * subscription corrects the dedupe map on the next store emit.
   */
  repaintRow(rowId: number, transform: (row: T) => T): void {
    this.setRows(this.getRows().map((row) => (row.id === rowId ? transform(row) : row)));
  }

  /**
   * Called from the imperative run/stop handlers that already hold a fresh job.
   * Triggers `reload` only when the job's state actually changed since the last
   * value seen for that id — so a burst of same-state progress emits doesn't
   * reload the whole list — then records the new state. The caller is expected
   * to have already repainted the affected row in place.
   */
  reconcile(job: Job, reload: () => void): void {
    if (this.jobStates.get(job.id) !== job.state) {
      reload();
    }
    this.jobStates.set(job.id, job.state);
  }

  destroy(): void {
    this.subscriptions.unsubscribe();
  }
}
