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
import { ArrayDataProvider } from 'app/modules/tn-table/classes/array-data-provider/array-data-provider';
import { SortDirection } from 'app/modules/tn-table/enums/sort-direction.enum';
import { mapTnSortToTableSort, toUniqueRowTag } from 'app/modules/tn-table/utils';
import {
  JobSlice,
  selectAllNonTransientJobs,
  selectFailedJobs,
  selectJobState,
  selectRunningJobs,
} from 'app/modules/jobs/store/job.selectors';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
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
   * Which job's detail row is open, by id. `tn-table` keys its own `expandedRows` set on the row
   * *object*, and the store hands us a fresh object for a job every time it updates — so the id
   * is what survives a reload, and the effects below keep the two representations in step.
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

        if (tableId !== this.lastSyncedExpandedId) {
          // The table moved on its own — the user toggled a chevron. Adopt it and, on expand, put
          // the job in the URL, as ix-table's `(expanded)` output used to.
          this.lastSyncedExpandedId = tableId;
          this.expandedJobId.set(tableId);
          if (tableId !== null) {
            this.navigateToJob(tableId);
          }
          return;
        }

        // Our id moved — `?jobId=` asked for a row that had not rendered yet.
        this.openExpandedRow(table, rows, wantedId);
      });
    });
  }

  /**
   * TEMP (NAS-141021): `tn-table` empties its expanded set whenever the `dataSource` *reference*
   * changes, and the jobs store hands us a new array on every job update — so a detail row would
   * close itself while the job it belongs to is still running, which is exactly when its logs are
   * worth watching. `selectionChange` is emitted from that same reset and is the only hook the
   * library offers, so re-open the row from the id we keep. Drop once `tn-table` keys expansion
   * through `trackBy` (or exposes a row-expanded output) instead of row identity.
   */
  protected onTableReset(): void {
    const table = this.table();
    if (table) {
      this.openExpandedRow(table, this.rows(), this.expandedJobId());
    }
  }

  /** Points the table's identity-keyed expanded set at the row currently rendering that job. */
  private openExpandedRow(table: TnTableComponent<Job>, rows: Job[], jobId: number | null): void {
    const expandedRow = jobId === null ? undefined : rows.find((job) => job.id === jobId);
    if (!expandedRow) {
      return;
    }
    this.lastSyncedExpandedId = jobId;
    table.expandedRows.set(new Set<unknown>([expandedRow]));
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

  protected uniqueRowTag(job: Job): string {
    return toUniqueRowTag(`job-${job.id}`);
  }

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
        time_started: (job: Job) => +job.time_started,
        time_finished: (job: Job) => Number(job.time_finished),
        /* eslint-enable @typescript-eslint/naming-convention */
      },
    }));
  }

  private navigateToJob(jobId: number): void {
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
