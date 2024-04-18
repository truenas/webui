import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import {
  BehaviorSubject, combineLatest, Observable, of,
} from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Job } from 'app/interfaces/job.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { ArrayDataProvider } from 'app/modules/ix-table/classes/array-data-provider/array-data-provider';
import { dateColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-date/ix-cell-date.component';
import { stateButtonColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-state-button/ix-cell-state-button.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import {
  JobSlice,
  selectAllNonTransientJobs,
  selectFailedJobs,
  selectJobState,
  selectRunningJobs,
} from 'app/modules/jobs/store/job.selectors';
import { JobTab } from 'app/pages/jobs/job-tab.enum';
import { jobsListElements } from 'app/pages/jobs/jobs-list/jobs-list.elements';

@UntilDestroy()
@Component({
  templateUrl: './jobs-list.component.html',
  styleUrls: ['./jobs-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobsListComponent implements OnInit {
  protected readonly searchableElements = jobsListElements;

  protected readonly isLoading$ = this.store$.select(selectJobState).pipe(map((state) => state.isLoading));
  protected readonly error$ = this.store$.select(selectJobState).pipe(map((state) => state.error));
  protected jobs: Job[] = [];
  protected dataProvider = new ArrayDataProvider<Job>();
  protected filterString = '';
  protected selectedIndex: JobTab = 0;
  private selector$ = new BehaviorSubject<typeof selectAllNonTransientJobs>(selectAllNonTransientJobs);
  protected selectedJobs$ = this.selector$.pipe(switchMap((selector) => this.store$.select(selector)));
  protected readonly JobTab = JobTab;

  columns = createTable<Job>([
    textColumn({
      title: this.translate.instant('Name'),
      sortable: true,
    }),
    stateButtonColumn({
      title: this.translate.instant('State'),
      propertyName: 'state',
      sortable: true,
      cssClass: 'state-button',
      sortBy: (row) => row.state,
      getJob: (row) => row,
    }),
    textColumn({
      title: this.translate.instant('ID'),
      propertyName: 'id',
      sortable: true,
    }),
    dateColumn({
      title: this.translate.instant('Started'),
      propertyName: 'time_started',
      sortable: true,
    }),
    dateColumn({
      title: this.translate.instant('Finished'),
      propertyName: 'time_finished',
      sortable: true,
    }),
  ], {
    rowTestId: (row) => 'job-' + row.id,
  });

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

  constructor(
    protected emptyService: EmptyService,
    private translate: TranslateService,
    private store$: Store<JobSlice>,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.selectedJobs$.pipe(untilDestroyed(this)).subscribe((jobs) => {
      this.jobs = jobs;
      this.onListFiltered(this.filterString);
      this.setDefaultSort();
      this.cdr.markForCheck();
    });
  }

  onTabChange(tab: JobTab): void {
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
    this.filterString = query;
    this.dataProvider.setRows(this.jobs.filter(this.filterSnapshot));
  }

  private filterSnapshot = (job: Job): boolean => {
    return job.method?.toLowerCase().includes(this.filterString)
      || job.description?.toLowerCase().includes(this.filterString);
  };

  private setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 1,
      direction: SortDirection.Desc,
      propertyName: 'id',
    });
  }
}
