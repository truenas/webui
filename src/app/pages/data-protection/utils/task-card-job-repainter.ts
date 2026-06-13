import { Store } from '@ngrx/store';
import { Subscription, filter } from 'rxjs';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { selectJob } from 'app/modules/jobs/store/job.selectors';

interface TaskWithJob {
  id: number;
  job?: Job | null;
}

/**
 * Shared subscribe-dedupe-and-repaint helper for the data-protection task cards
 * (cloud sync, replication, rsync, cloud backup).
 *
 * Every card renders a presentational status pill that must repaint as its
 * backing job progresses in the background. The pill no longer updates itself,
 * so an in-place mutation would be missed by OnPush — a fresh row array is
 * pushed back through the card's `setRows`, which also feeds the data provider.
 *
 * `watch()` is re-run on every reload (the data-provider source re-emits), so it
 * unsubscribes the previous batch first to avoid leaking one subscription per
 * task on each reload.
 *
 * Ordering: callers MUST publish their backing rows (via `setRows`/assignment)
 * before calling `watch()`. `selectJob` emits synchronously on subscribe, so the
 * first repaint can fire before `watch()` returns and `getRows()` has to already
 * see the freshly-loaded rows.
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
    tasks.forEach((task) => {
      if (!task.job) {
        return;
      }
      watchedJobIds.add(task.job.id);
      this.subscriptions.add(
        this.store$.select(selectJob(task.job.id)).pipe(filter(Boolean)).subscribe((job) => {
          this.jobStates.set(job.id, job.state);
          this.setRows(this.getRows().map((row) => (row.job?.id === job.id ? this.mergeJob(row, job) : row)));
        }),
      );
    });

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
