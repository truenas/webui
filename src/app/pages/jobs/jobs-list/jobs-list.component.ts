import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild,
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
import { CoreEvent } from 'app/interfaces/events';
import { Job } from 'app/interfaces/job.interface';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { EntityToolbarComponent } from 'app/pages/common/entity/entity-toolbar/entity-toolbar.component';
import { ToolbarConfig } from 'app/pages/common/entity/entity-toolbar/models/control-config.interface';
import { JobsListStore } from 'app/pages/jobs/jobs-list/jobs-list.store';
import { DialogService } from 'app/services';
import { T } from 'app/translate-marker';

@UntilDestroy()
@Component({
  templateUrl: './jobs-list.component.html',
  styleUrls: ['./jobs-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobsListComponent implements OnInit {
  paginationPageIndex = 0;
  paginationPageSize = 10;
  paginationPageSizeOptions: number[] = [10, 50, 100];
  paginationShowFirstLastButtons = true;
  queryCall: 'core.get_jobs' = 'core.get_jobs';
  queryCallOption: QueryParams<Job> = [[], { order_by: ['-id'] }];
  @ViewChild('taskTable', { static: false }) taskTable: MatTable<Job[]>;
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  dataSource: MatTableDataSource<Job> = new MatTableDataSource<Job>([]);
  displayedColumns = ['name', 'state', 'id', 'time_started', 'time_finished', 'logs_excerpt'];
  viewingLogsForJob: Job;
  isLoading: boolean;
  toolbarConfig: ToolbarConfig;
  settingsEvent$: Subject<CoreEvent> = new Subject();
  filterString = '';
  selectedIndex = 0;
  readonly JobState = JobState;

  constructor(
    private core: CoreService,
    private translate: TranslateService,
    private store: JobsListStore,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef,
  ) {}

  onAborted(job: Job): void {
    this.dialogService
      .confirm({
        title: this.translate.instant(T('Abort the task')),
        message: `<pre>${job.method}</pre>`,
        hideCheckBox: true,
        buttonMsg: this.translate.instant(T('Abort')),
        cancelMsg: this.translate.instant(T('Close')),
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
      this.cdr.markForCheck();
    });

    this.store
      .getUpdates()
      .pipe(untilDestroyed(this))
      .subscribe((job) => {
        this.handleUpdate(job);
      });
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

  handleUpdate(job: Job): void {
    if (this.selectedIndex === 2 && job.state === JobState.Failed) {
      this.store.patchState((state) => {
        return {
          ...state,
          jobs: [job, ...state.jobs],
        };
      });
    }

    if (this.selectedIndex === 1) {
      this.store.patchState((state) => {
        let modifiedJobs = [...state.jobs];
        const jobIndex = modifiedJobs.findIndex((item) => item.id === job.id);
        if (jobIndex === -1) {
          modifiedJobs = [job, ...state.jobs];
        } else {
          modifiedJobs[jobIndex] = job;
        }

        return {
          ...state,
          jobs: modifiedJobs.filter((item) => item.state === JobState.Running),
        };
      });
    }

    if (this.selectedIndex === 0) {
      this.store.patchState((state) => {
        let modifiedJobs = [...state.jobs];
        const jobIndex = state.jobs.findIndex((item) => item.id === job.id);
        if (jobIndex === -1) {
          modifiedJobs = [job, ...state.jobs];
        } else {
          modifiedJobs[jobIndex] = job;
        }

        return {
          ...state,
          jobs: modifiedJobs,
        };
      });
    }
  }

  viewLogs(job: Job): void {
    this.viewingLogsForJob = job;
  }

  onLogsSidebarClosed(): void {
    this.viewingLogsForJob = null;
  }

  onTabChange(tab: MatTabChangeEvent): void {
    this.selectedIndex = tab.index;
    switch (tab.index) {
      case 2:
        this.store.selectFailedJobs();
        break;
      case 1:
        this.store.selectRunningJobs();
        break;
      case 0:
      default:
        this.store.selectAllJobs();
        break;
    }
  }
}
