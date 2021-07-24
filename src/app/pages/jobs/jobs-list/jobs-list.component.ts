import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { JobsManagerStore } from 'app/components/common/dialog/jobs-manager/jobs-manager.store';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { JobRow } from 'app/pages/jobs/jobs-list/job-row.interface';
import { DialogService } from 'app/services';
import { LocaleService } from 'app/services/locale.service';
import { T } from 'app/translate-marker';
import { WebSocketService } from '../../../services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './jobs-list.component.html',
  styleUrls: ['./jobs-list.component.scss'],
})
export class JobsListComponent implements OnInit {
  title = this.translate.instant(T('Job Log'));
  queryCall: 'core.get_jobs' = 'core.get_jobs';
  queryCallOption: QueryParams<Job> = [[], { order_by: ['-id'] }];
  @ViewChild('taskTable', { static: true }) taskTable: MatTable<any>;
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  dataSource: MatTableDataSource<Job>;
  displayedColumns = ['name', 'state', 'id', 'date_started', 'date_finished', 'logs_excerpt'];
  expandedElement: any | null;
  readonly JobState = JobState;

  constructor(
    private ws: WebSocketService,
    private translate: TranslateService,
    private localeService: LocaleService,
    private store: JobsManagerStore,
    private dialogService: DialogService,
  ) {
    this.dataSource = new MatTableDataSource<JobRow>([]);
  }

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
    this.ws.call(this.queryCall, this.queryCallOption)
      .pipe(untilDestroyed(this))
      .subscribe(
        (jobs) => {
          for (let i = 0; i < jobs.length; i++) {
            this.dataSource.data.unshift(this.transformJob(jobs[i]));
          }

          this.dataSource.sort = this.sort;
        },
        () => {

        },
      );

    this.getData().pipe(untilDestroyed(this)).subscribe((job) => {
      // only update exist jobs or add latest jobs
      const lastJob = this.dataSource.data[0];
      if (job.id >= lastJob?.id) {
        const targetRow = _.findIndex(this.dataSource.data, { id: job.id });
        if (targetRow === -1) {
          this.dataSource.data.unshift(this.transformJob(job));
        } else {
          for (const key in this.dataSource.data[targetRow]) {
            (this.dataSource.data[targetRow][key as keyof Job] as any) = job[key];
          }
        }
        this.taskTable.renderRows();
      }
    });
  }

  getData(): Observable<any> {
    const source = Observable.create((observer: any) => {
      this.ws.subscribe(this.queryCall).pipe(untilDestroyed(this)).subscribe((event) => {
        observer.next(event.fields);
      });
    });
    return source;
  }

  viewLogs(job: JobRow): void {
    // TODO: Implement slide-out sidebar with details
    console.info('show logs', job);
  }
}
