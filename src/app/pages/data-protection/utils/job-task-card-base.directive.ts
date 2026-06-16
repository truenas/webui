import {
  computed, DestroyRef, Directive, inject, Injector, type OnInit, type Signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { type TnCardAction, type TnSortEvent } from '@truenas/ui-components';
import { Observable, tap } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { Job } from 'app/interfaces/job.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { mapTnSortToTableSort } from 'app/modules/ix-table/utils';
import { JobSlice } from 'app/modules/jobs/store/job.selectors';
import { TaskCardJobRepainter, type TaskWithJob } from 'app/pages/data-protection/utils/task-card-job-repainter';

/**
 * Shared wiring for the data-protection task cards whose rows are backed by a
 * job (cloud sync, replication, rsync, cloud backup). It owns the boilerplate
 * that was otherwise copy-pasted across every card: the Add-button action, sort
 * plumbing, row tracking, the {@link TaskCardJobRepainter}, and — critically —
 * the load-bearing "publish rows before watching" ordering (see
 * {@link loadAndWatch}). Subclasses supply only what genuinely differs: the
 * query, the row→job merge, the default sort column, and the Add handler.
 *
 * The periodic-snapshot card is intentionally NOT a subclass: it has no backing
 * job (no repainter) and refreshes via `api.subscribe` rather than this
 * query-and-repaint flow, so forcing it through here would add hooks no other
 * card needs.
 */
@Directive()
export abstract class JobTaskCardBase<T extends TaskWithJob> implements OnInit {
  protected readonly translate = inject(TranslateService);
  protected readonly destroyRef = inject(DestroyRef);
  protected readonly store$ = inject<Store<JobSlice>>(Store);
  private readonly authService = inject(AuthService);
  private readonly injector = inject(Injector);

  /** Assigned by {@link loadAndWatch}; bound by each card's template. */
  dataProvider: AsyncDataProvider<T>;

  /**
   * Backing rows behind the data provider. The repainter reads and rewrites this
   * array so a background job-progress emit produces a fresh row reference that
   * OnPush will actually render (an in-place mutation would be missed). Kept in
   * lockstep with `dataProvider.setRows`.
   */
  private rows: T[] = [];

  /**
   * Subscribe-dedupe-and-repaint helper. `mergeJob` is deferred to the subclass
   * because the row→job merge shape differs (most cards fold `job.state` into a
   * derived `state` pill; cloud backup carries only the raw job).
   *
   * The `setRows` arrow captures `this.dataProvider` before it exists — this is
   * safe because `watch()` only runs inside the {@link loadAndWatch} source tap,
   * by which point the provider has been assigned.
   */
  protected readonly jobs = new TaskCardJobRepainter<T>(
    this.store$,
    () => this.rows,
    (rows) => {
      this.rows = rows;
      this.dataProvider.setRows(rows);
    },
    (row, job) => this.mergeJob(row, job),
  );

  /** Roles allowed to add/run/stop; gates the Add button and row actions. */
  protected abstract readonly requiredRoles: Role[];
  /** Columns rendered by the card's `tn-table`, in order. */
  protected abstract readonly displayedColumns: string[];

  /** Column the table sorts by (ascending) on first load. */
  protected abstract readonly defaultSortProperty: keyof T;
  /** data-test id for the Add button, e.g. `cloudsync-task-add`. */
  protected abstract readonly addTestId: string;

  /** Query the backing tasks. Re-subscribed on every {@link reload}. */
  protected abstract queryTasks(): Observable<T[]>;
  /** Fold a freshly-seen job into its backing row. Drives every repaint. */
  protected abstract mergeJob(row: T, job: Job): T;
  /** Open the add/create flow for this task type. */
  protected abstract onAdd(): void;

  private hasAddRole?: Signal<boolean>;

  /**
   * Add-button descriptor for `[primaryAction]`, or `undefined` when the user
   * lacks the role. The computed body is lazy, so it reads `hasAddRole` only
   * after {@link ngOnInit} has created it.
   */
  protected readonly addAction = computed<TnCardAction | undefined>(() => {
    if (!this.hasAddRole?.()) {
      return undefined;
    }
    return {
      label: this.translate.instant('Add'),
      testId: this.addTestId,
      handler: () => this.onAdd(),
    };
  });

  protected readonly trackByTaskId = (_index: number, row: T): number => row.id;

  ngOnInit(): void {
    // Built here, not in a field initializer: `requiredRoles` is a subclass field
    // that is only assigned after this base class has finished constructing.
    this.hasAddRole = toSignal(this.authService.hasRole(this.requiredRoles), {
      initialValue: false,
      injector: this.injector,
    });
    this.loadAndWatch();
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToTableSort<T>(event, this.displayedColumns));
  }

  /** Re-run the query and repopulate the data provider. */
  protected reload(): void {
    this.dataProvider.load();
  }

  /**
   * Wire the data provider to the task query and kick off the first load.
   *
   * Centralizes the ordering that every card otherwise hand-rolled: rows are
   * published (and the repainter re-armed) *inside the source tap*, before the
   * provider emits, because `selectJob` fires synchronously on subscribe and the
   * first repaint must already see the freshly-loaded rows.
   */
  private loadAndWatch(): void {
    this.destroyRef.onDestroy(() => this.jobs.destroy());
    const rows$ = this.queryTasks().pipe(
      tap((rows) => {
        this.rows = rows;
        this.jobs.watch(rows);
      }),
      takeUntilDestroyed(this.destroyRef),
    );
    this.dataProvider = new AsyncDataProvider<T>(rows$);
    this.dataProvider.setSorting({
      active: 0,
      direction: SortDirection.Asc,
      propertyName: this.defaultSortProperty,
    });
    this.reload();
  }
}
