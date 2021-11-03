import {
  AfterViewInit, Component, OnInit, ViewChild,
} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CoreService } from 'app/core/services/core-service/core.service';
import { JobState } from 'app/enums/job-state.enum';
import { JobViewLogState } from 'app/enums/job-view-log-state.enum';
import { CoreEvent } from 'app/interfaces/events';
import { Job } from 'app/interfaces/job.interface';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { EmptyConfig, EmptyType } from 'app/pages/common/entity/entity-empty/entity-empty.component';
import { EntityToolbarComponent } from 'app/pages/common/entity/entity-toolbar/entity-toolbar.component';
import { ToolbarConfig } from 'app/pages/common/entity/entity-toolbar/models/control-config.interface';
import { JobsListStore } from 'app/pages/jobs/jobs-list/jobs-list.store';
import { DialogService } from 'app/services';
import { JobTab } from './jobs-list.store';

@UntilDestroy()
@Component({
  templateUrl: './jobs-list.component.html',
  styleUrls: ['./jobs-list.component.scss'],
  providers: [JobsListStore],
})
export class JobsListComponent implements OnInit, AfterViewInit {
  paginationPageIndex = 0;
  paginationPageSize = 10;
  paginationPageSizeOptions: number[] = [10, 50, 100];
  paginationShowFirstLastButtons = true;
  queryCall = 'core.get_jobs' as const;
  queryCallOption: QueryParams<Job> = [[], { limit: this.paginationPageSize, order_by: ['-id'] }];
  @ViewChild('taskTable', { static: false }) taskTable: MatTable<Job[]>;
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChild(MatPaginator) set matPaginator(mp: MatPaginator) {
    this.paginator = mp;
    this.dataSource.paginator = this.paginator;
  }
  dataSource: MatTableDataSource<Job> = new MatTableDataSource<Job>([]);
  displayedColumns = ['name', 'state', 'id', 'time_started', 'time_finished', 'arguments', 'logs_excerpt'];
  viewingLogsForJob: Job;
  viewType: JobViewLogState;
  isLoading: boolean;
  toolbarConfig: ToolbarConfig;
  settingsEvent$: Subject<CoreEvent> = new Subject();
  filterString = '';
  jobTableIndexes = [JobTab.All, JobTab.Active, JobTab.Failed];
  selectedIndex: JobTab = 0;
  emptyConfig: EmptyConfig = {
    type: EmptyType.NoPageData,
    large: true,
    title: this.translate.instant('No jobs are available.'),
    message: this.translate.instant('Please be patient...'),
  };
  loadingConfig: EmptyConfig = {
    type: EmptyType.Loading,
    large: false,
    title: this.translate.instant('Loading...'),
  };
  readonly JobState = JobState;
  readonly JobViewLogState = JobViewLogState;
  private paginator: MatPaginator;

  constructor(
    private core: CoreService,
    private translate: TranslateService,
    private store: JobsListStore,
    private dialogService: DialogService,
  ) {}

  onAborted(job: Job): void {
    this.dialogService
      .confirm({
        title: this.translate.instant('Abort'),
        message: this.translate.instant('Are you sure you want to abort the <b>{task}</b> task?', { task: job.method }),
        hideCheckBox: true,
        buttonMsg: this.translate.instant('Abort'),
        cancelMsg: this.translate.instant('Cancel'),
        disableClose: true,
      })
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.store.remove(job);
      });
  }

  ngOnInit(): void {
    this.setupToolbar();

    this.store.state$.pipe(untilDestroyed(this)).subscribe((state) => {
      this.dataSource.data = state.jobs;
      this.isLoading = state.isLoading;
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  setupToolbar(): void {
    this.settingsEvent$ = new Subject();
    this.settingsEvent$.pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      if (evt.data.event_control == 'filter') {
        this.filterString = evt.data.filter;
        this.dataSource.filter = evt.data.filter;
      }
    });

    const controls = [
      {
        name: 'filter',
        type: 'input',
        value: this.filterString,
      },
    ];

    const toolbarConfig = {
      target: this.settingsEvent$,
      controls,
    };
    const settingsConfig = {
      actionType: EntityToolbarComponent,
      actionConfig: toolbarConfig,
    };

    this.toolbarConfig = toolbarConfig;

    this.core.emit({ name: 'GlobalActions', data: settingsConfig, sender: this });
  }

  viewLogs(job: Job, viewType: JobViewLogState): void {
    this.viewingLogsForJob = job;
    this.viewType = viewType;
  }

  onLogsSidebarClosed(): void {
    this.viewingLogsForJob = null;
  }

  onTabChange(tab: MatTabChangeEvent): void {
    this.paginationPageIndex = 0;
    this.paginationPageSize = 10;
    this.selectedIndex = tab.index;
    switch (this.selectedIndex) {
      case JobTab.Failed:
        this.store.selectFailedJobs();
        this.onLogsSidebarClosed();
        break;
      case JobTab.Active:
        this.store.selectRunningJobs();
        this.onLogsSidebarClosed();
        break;
      case JobTab.All:
      default:
        this.store.selectAllJobs();
        this.onLogsSidebarClosed();
        break;
    }
  }

  onPageChange(e: { pageIndex: number; pageSize: number }): void {
    this.paginationPageIndex = e.pageIndex;
    this.paginationPageSize = e.pageSize;
  }
}
