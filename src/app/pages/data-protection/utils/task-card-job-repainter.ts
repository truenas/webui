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
  /** Last seen state per job id; cards read it to decide whether a reload is needed. */
  readonly jobStates = new Map<number, JobState>();
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
    tasks.forEach((task) => {
      if (!task.job) {
        return;
      }
      this.subscriptions.add(
        this.store$.select(selectJob(task.job.id)).pipe(filter(Boolean)).subscribe((job) => {
          this.jobStates.set(job.id, job.state);
          this.setRows(this.getRows().map((row) => (row.job?.id === job.id ? this.mergeJob(row, job) : row)));
        }),
      );
    });
  }

  destroy(): void {
    this.subscriptions.unsubscribe();
  }
}
