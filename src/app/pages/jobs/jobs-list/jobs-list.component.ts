import {
  AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild,
} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { CoreService } from 'app/core/services/core-service/core.service';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { JobsListControlsComponent } from 'app/pages/jobs/components/jobs-list-controls/jobs-list-controls.component';
import { JobsListStore } from 'app/pages/jobs/jobs-list/jobs-list.store';
import { DialogService } from 'app/services';
import { T } from 'app/translate-marker';

export enum JobFilterState {
  All = 'All',
  Running = 'Running',
  Failed = 'Failed',
}

@UntilDestroy()
@Component({
  templateUrl: './jobs-list.component.html',
  styleUrls: ['./jobs-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobsListComponent implements OnInit, AfterViewInit {
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
  expandedElement: any | null;
  viewingLogsForJob: Job;
  isLoading: boolean;
  actionsConfig: any;
  selectedIndex = 0;
  readonly JobState = JobState;
  readonly JobFilterState = JobFilterState;

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

  ngAfterViewInit(): void {
    this.actionsConfig = { actionType: JobsListControlsComponent, actionConfig: this };
    this.core.emit({ name: 'GlobalActions', data: this.actionsConfig, sender: this });
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
