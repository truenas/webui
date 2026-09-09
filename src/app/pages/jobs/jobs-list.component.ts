import { AsyncPipe } from '@angular/common';
import {
  DestroyRef, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, effect, inject, signal,
  untracked, viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonToggleComponent,
  TnButtonToggleGroupComponent,
  TnCellDefDirective,
  TnDetailRowDefDirective,
  TnHeaderCellDefDirective,
  TnSortEvent,
  TnTableColumnDirective,
  TnTableComponent,
  TnTablePagerComponent,
  TnTestIdDirective,
} from '@truenas/ui-components';
import {
  BehaviorSubject, combineLatest, Observable, of,
} from 'rxjs';
import { take, map, switchMap } from 'rxjs/operators';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { Job } from 'app/interfaces/job.interface';
import { IxDateComponent } from 'app/modules/dates/pipes/ix-date/ix-date.component';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import {
  JobSlice,
  selectAllNonTransientJobs,
  selectFailedJobs,
  selectJobState,
  selectRunningJobs,
} from 'app/modules/jobs/store/job.selectors';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { ArrayDataProvider } from 'app/modules/tn-table/classes/array-data-provider/array-data-provider';
import { SortDirection } from 'app/modules/tn-table/enums/sort-direction.enum';
import { mapTnSortToTableSort, memoizedRowTag } from 'app/modules/tn-table/utils';
import { TaskStateCellComponent } from 'app/modules/tn-table-cells/state-cell/task-state-cell.component';
import { JobLogsRowComponent } from 'app/pages/jobs/job-logs-row/job-logs-row.component';
import { JobNameComponent } from 'app/pages/jobs/job-name/job-name.component';
import { JobTab } from 'app/pages/jobs/job-tab.enum';
import { jobsListElements } from 'app/pages/jobs/jobs-list.elements';

@Component({
  selector: 'ix-jobs-list',
  templateUrl: './jobs-list.component.html',
  styleUrls: ['./jobs-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    TnButtonToggleGroupComponent,
    TnButtonToggleComponent,
    FormsModule,
    BasicSearchComponent,
    UiSearchDirective,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnDetailRowDefDirective,
    TnTestIdDirective,
    IxDateComponent,
    TaskStateCellComponent,
    JobNameComponent,
    JobLogsRowComponent,
    TnTablePagerComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class JobsListComponent implements OnInit {
  protected emptyService = inject(EmptyService);
  private translate = inject(TranslateService);
  private store$ = inject<Store<JobSlice>>(Store);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly searchableElements = jobsListElements;

  protected readonly isLoading$ = this.store$.select(selectJobState).pipe(map((state) => state.isLoading));
  protected readonly error$ = this.store$.select(selectJobState).pipe(map((state) => state.error));
  protected jobs: Job[] = [];
  protected dataProvider = new ArrayDataProvider<Job>();
  protected searchQuery = signal('');
  protected selectedIndex: JobTab = 0;
  private selector$ = new BehaviorSubject<typeof selectAllNonTransientJobs>(selectAllNonTransientJobs);
  protected selectedJobs$ = this.selector$.pipe(switchMap((selector) => this.store$.select(selector)));
  protected readonly JobTab = JobTab;

  protected readonly table = viewChild<TnTableComponent<Job>>(TnTableComponent);
  protected readonly rows = toSignal(this.dataProvider.currentPage$, { initialValue: [] as Job[] });

  protected readonly displayedColumns = ['name', 'state', 'time_started', 'time_finished'];

  protected readonly trackByJobId = (_: number, row: Job): number => row.id;

  /**
   * Keys the table's expansion, so a detail row survives the store handing us a fresh array (and
   * fresh row objects) on every job update — which is exactly when a running job's logs are worth
   * watching. A row that pages away is retained by the table and re-opens once it is listed again.
   */
  protected readonly jobExpansionKey = (row: Job): number => row.id;

  /**
   * Which job's detail row is open, by id, so `?jobId=` and the chevron agree on one source of
   * truth. The table holds row objects; the id is what we can put in the URL.
   */
  private readonly expandedJobId = signal<number | null>(null);

  /**
   * Expansion state the table and `expandedJobId` last agreed on, so the effect below can tell a
   * user click on the chevron (the table moved first) from our own reconciliation (we moved
   * first). Deliberately a plain field: reading it must not make the effect depend on it.
   */
  private lastSyncedExpandedId: number | null = null;

  constructor() {
    effect(() => {
      const table = this.table();
      const rows = this.rows();
      const wantedId = this.expandedJobId();
      if (!table) {
        return;
      }
      const tableId = [...table.expandedRows()].map((row) => (row as Job).id).at(0) ?? null;

      untracked(() => {
        if (tableId === wantedId) {
          this.lastSyncedExpandedId = tableId;
          return;
        }

        if (tableId === null && wantedId !== null && !rows.some((job) => job.id === wantedId)) {
          // The job is not on the current page — another tab, a search. `expandedRows` only ever
          // holds visible rows, so an empty set here is not the user collapsing anything: the
          // table retains the row under `expansionKey` and re-opens it once the job is listed
          // again. Leave both the id and the URL alone.
          return;
        }

        if (tableId !== this.lastSyncedExpandedId) {
          // The table moved on its own — the user toggled a chevron. Adopt it and put the job in
          // the URL, as ix-table's `(expanded)` output used to. A collapse clears the parameter
          // rather than leaving `?jobId=` pointing at a row that is no longer open, which would
          // re-expand it on the next reload.
          this.lastSyncedExpandedId = tableId;
          this.expandedJobId.set(tableId);
          this.navigateToJob(tableId);
          return;
        }

        // Our id moved — `?jobId=` asked for a row that had not rendered yet.
        this.openExpandedRow(table, rows, wantedId);
      });
    });
  }

  /** Opens the row rendering `jobId` through the table's own API, so its retained set stays in step. */
  private openExpandedRow(table: TnTableComponent<Job>, rows: Job[], jobId: number | null): void {
    if (jobId === null) {
      table.clearExpansion();
      this.lastSyncedExpandedId = null;
      return;
    }
    const expandedRow = rows.find((job) => job.id === jobId);
    if (!expandedRow) {
      return;
    }
    this.lastSyncedExpandedId = jobId;
    table.expandRow(expandedRow);
  }

  emptyType$: Observable<EmptyType> = combineLatest([
    this.isLoading$,
    this.error$.pipe(map((error) => !!error)),
    this.selectedJobs$.pipe(map((jobs) => jobs.length === 0)),
  ]).pipe(
    switchMap(([isLoading, isError, isNoData]) => {
      switch (true) {
        case isLoading:
          return of(EmptyType.Loading);
        case !!isError:
          return of(EmptyType.Errors);
        case isNoData:
          return of(EmptyType.NoPageData);
        default:
          return of(EmptyType.NoSearchResults);
      }
    }),
  );

  ngOnInit(): void {
    const jobsTrigger$ = this.selectedJobs$.pipe(
      takeUntilDestroyed(this.destroyRef),
    );

    const queryTrigger$ = this.route.queryParams.pipe(
      takeUntilDestroyed(this.destroyRef),
    );

    // handle jobs changing and update our internal representation inside `this.jobs`
    jobsTrigger$.subscribe((jobs) => {
      this.jobs = jobs;
      this.onListFiltered(this.searchQuery());
      this.setDefaultSort();
      this.cdr.markForCheck();
    });

    // handle query updates and expand rows according to URL params.
    // we combine `queryTrigger$` with `jobsTrigger$` since, if we
    // were to try and run `autoExpandRow` before `this.jobs` was populated, then
    // nothing would happen. `combineLatest` is a neat way to ensure that BOTH observables have
    // values before doing anything.
    //
    // the `take(1)` operator is there to ensure that `jobsTrigger$` only ever emits once,
    // which will prevent job updates re-triggering row expansion.
    combineLatest([jobsTrigger$.pipe(take(1)), queryTrigger$])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([_, query]) => {
        if (query.jobId) {
          const jobId = Number(query.jobId);
          if (!Number.isNaN(jobId)) {
            this.autoExpandRow(jobId);
          }
        }

        this.cdr.markForCheck();
      });
  }

  /**
   * Memoized: every cell of every row calls this on each change-detection pass, and the jobs
   * subscription runs a pass on every progress tick of every running job.
   *
   * Not applied to {@link ariaLabel}, which is translated — a cache keyed on the row object alone
   * would freeze it in whichever locale rendered first.
   */
  protected readonly uniqueRowTag = memoizedRowTag<Job>((job) => `job-${job.id}`);

  protected ariaLabel(job: Job): string {
    return [String(job.description), this.translate.instant('Job')].join(' ');
  }

  /** `ix-date` wants a timestamp; a job's time fields arrive as `{ $date }`, a number or nothing. */
  protected toDate(value: ApiTimestamp | number | null | undefined): number | null {
    if (!value) {
      return null;
    }
    return typeof value === 'number' ? value : value.$date;
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToTableSort<Job>(event, this.displayedColumns, {
      sortAccessors: {
        /* eslint-disable @typescript-eslint/naming-convention -- API field names */
        time_started: (job: Job) => this.toDate(job.time_started) ?? 0,
        time_finished: (job: Job) => this.toDate(job.time_finished) ?? 0,
        /* eslint-enable @typescript-eslint/naming-convention */
      },
    }));
  }

  /** Writes the open job into `?jobId=`; `null` drops the parameter. */
  private navigateToJob(jobId: number | null): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { jobId },
      queryParamsHandling: 'merge',
    });
  }

  protected onTabChange(tab: JobTab): void {
    this.selectedIndex = tab;
    switch (this.selectedIndex) {
      case JobTab.Failed:
        this.selector$.next(selectFailedJobs);
        break;
      case JobTab.Running:
        this.selector$.next(selectRunningJobs);
        break;
      case JobTab.All:
      default:
        this.selector$.next(selectAllNonTransientJobs);
        break;
    }
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.dataProvider.setFilter({ list: this.jobs, query, columnKeys: ['method', 'description'] });
  }

  private autoExpandRow(jobId: number): void {
    if (this.jobs.some((job) => job.id === jobId)) {
      this.expandedJobId.set(jobId);
    }
  }

  private setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 1,
      direction: SortDirection.Desc,
      propertyName: 'id',
    });
  }
}
