import {
  Component, OnInit, ViewChild,
} from '@angular/core';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { JobsManagerStore } from 'app/components/common/dialog/jobs-manager/jobs-manager.store';
import { JobState } from 'app/enums/job-state.enum';
import { ApiEvent } from 'app/interfaces/api-event.interface';
import { Job } from 'app/interfaces/job.interface';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { JobRow } from 'app/pages/jobs/jobs-list/job-row.interface';
import { DialogService } from 'app/services';
import { LocaleService } from 'app/services/locale.service';
import { WebSocketService } from 'app/services/ws.service';
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
})
export class JobsListComponent implements OnInit {
  title = this.translate.instant(T('Job Log'));
  paginationPageIndex = 0;
  paginationPageSize = 10;
  paginationPageSizeOptions: number[] = [10, 50, 100];
  paginationShowFirstLastButtons = true;
  queryCall: 'core.get_jobs' = 'core.get_jobs';
  queryCallOption: QueryParams<Job> = [[], { order_by: ['-id'] }];
  @ViewChild('taskTable', { static: false }) taskTable: MatTable<JobRow[]>;
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  dataSource: MatTableDataSource<JobRow> = new MatTableDataSource<JobRow>([]);
  displayedColumns = ['name', 'state', 'id', 'date_started', 'date_finished', 'logs_excerpt'];
  expandedElement: any | null;
  viewingLogsForJob: Job;
  filterValue = '';
  isLoading = true;
  readonly JobState = JobState;
  readonly JobFilterState = JobFilterState;

  constructor(
    private ws: WebSocketService,
    private translate: TranslateService,
    private localeService: LocaleService,
    private store: JobsManagerStore,
    private dialogService: DialogService,
  ) {}

  transformJob(job: Job): JobRow {
    return {
      ...job,
      date_started: job.time_started ? this.localeService.formatDateTime(new Date(job.time_started.$date)) : '–',
      date_finished: job.time_finished ? this.localeService.formatDateTime(new Date(job.time_finished.$date)) : '–',
    };
  }

  onAborted(job: JobRow): void {
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
    this.getData()
      .pipe(untilDestroyed(this))
      .subscribe(
        (jobs) => {
          this.dataSource.data = jobs;
          this.isLoading = false;

          setTimeout(() => {
            this.dataSource.sort = this.sort;
            this.dataSource.paginator = this.paginator;
          }, 0);
        },
        (error) => {
          this.isLoading = false;
          new EntityUtils().handleWSError(this, error);
        },
      );

    this.getUpdates()
      .pipe(untilDestroyed(this))
      .subscribe((job) => {
        // only update exist jobs or add latest jobs
        const lastJob = this.dataSource.data[0];
        if (job.id >= lastJob?.id) {
          const targetRow = _.findIndex(this.dataSource.data, { id: job.id });
          const data = this.dataSource.data;
          if (targetRow === -1) {
            data.push(job);
          } else {
            data[targetRow] = job;
          }
          this.dataSource.data = data;
        }
      });
  }

  getData(): Observable<JobRow[]> {
    return this.ws
      .call(this.queryCall, this.queryCallOption)
      .pipe(map((jobs: Job[]) => jobs.map((job) => this.transformJob(job))));
  }

  getUpdates(): Observable<JobRow> {
    return this.ws.subscribe(this.queryCall).pipe(map((event: ApiEvent<Job>) => this.transformJob(event.fields)));
  }

  viewLogs(job: JobRow): void {
    this.viewingLogsForJob = job;
  }

  onLogsSidebarClosed(): void {
    this.viewingLogsForJob = null;
  }

  searchQuery(query: string): void {
    if (query?.trim().length > 0) {
      this.dataSource.filter = query;
    } else {
      this.dataSource.filter = '';
    }
  }

  onFilterChange(state: MatButtonToggleChange): void {
    switch (state.value) {
      case JobFilterState.All:
        this.dataSource.filter = '';
        break;
      case JobFilterState.Running:
      case JobFilterState.Failed:
        this.dataSource.filter = state.value;
        break;
      default:
        break;
    }
  }
}
