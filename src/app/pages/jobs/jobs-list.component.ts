import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { MatButtonToggleGroup, MatButtonToggle } from '@angular/material/button-toggle';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  BehaviorSubject, combineLatest, Observable, of,
} from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Job } from 'app/interfaces/job.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { ArrayDataProvider } from 'app/modules/ix-table/classes/array-data-provider/array-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { dateColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-date/ix-cell-date.component';
import { stateButtonColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-state-button/ix-cell-state-button.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableCellDirective } from 'app/modules/ix-table/directives/ix-table-cell.directive';
import { IxTableDetailsRowDirective } from 'app/modules/ix-table/directives/ix-table-details-row.directive';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import {
  JobSlice,
  selectAllNonTransientJobs,
  selectFailedJobs,
  selectJobState,
  selectRunningJobs,
} from 'app/modules/jobs/store/job.selectors';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { JobLogsRowComponent } from 'app/pages/jobs/job-logs-row/job-logs-row.component';
import { JobNameComponent } from 'app/pages/jobs/job-name/job-name.component';
import { JobTab } from 'app/pages/jobs/job-tab.enum';
import { jobsListElements } from 'app/pages/jobs/jobs-list.elements';

@UntilDestroy()
@Component({
  selector: 'ix-jobs-list',
  templateUrl: './jobs-list.component.html',
  styleUrls: ['./jobs-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    PageHeaderComponent,
    MatButtonToggleGroup,
    MatButtonToggle,
    SearchInput1Component,
    IxTableComponent,
    UiSearchDirective,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTableCellDirective,
    JobNameComponent,
    IxTableDetailsRowDirective,
    JobLogsRowComponent,
    IxTablePagerComponent,
    TranslateModule,
    AsyncPipe,
  ],
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
    }),
    stateButtonColumn({
      title: this.translate.instant('State'),
      propertyName: 'state',
      cssClass: 'state-button',
      getJob: (row) => row,
    }),
    textColumn({
      title: this.translate.instant('ID'),
      propertyName: 'id',
    }),
    dateColumn({
      title: this.translate.instant('Started'),
      propertyName: 'time_started',
      sortBy: (job) => +job.time_started,
    }),
    dateColumn({
      title: this.translate.instant('Finished'),
      propertyName: 'time_finished',
      sortBy: (job) => +job.time_finished,
    }),
  ], {
    uniqueRowTag: (row) => `job-${row.id}`,
    ariaLabels: (row) => [row.description, this.translate.instant('Job')],
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
    this.dataProvider.setFilter({ list: this.jobs, query, columnKeys: ['method', 'description'] });
  }

  private setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 1,
      direction: SortDirection.Desc,
      propertyName: 'id',
    });
  }
}
