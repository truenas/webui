import { HttpClient } from '@angular/common/http';
import {
  OnInit, Component, EventEmitter, Output, Inject,
} from '@angular/core';
import {
  MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { filter, map } from 'rxjs/operators';
import { JobsManagerComponent } from 'app/components/common/dialog/jobs-manager/jobs-manager.component';
import { JobState } from 'app/enums/job-state.enum';
import { ApiDirectory, ApiMethod } from 'app/interfaces/api-directory.interface';
import { Job, JobProgress } from 'app/interfaces/job.interface';
import { EntityJobConfig } from 'app/pages/common/entity/entity-job/entity-job-config.interface';
import { WebSocketService } from 'app/services/';

@UntilDestroy()
@Component({
  selector: 'entity-job',
  templateUrl: 'entity-job.component.html',
  styleUrls: ['./entity-job.component.scss'],
})
export class EntityJobComponent implements OnInit {
  job: Job = {} as Job;
  progressTotalPercent = 0;
  description: string;
  method: ApiMethod;
  args: any[] = [];

  title = '';
  showCloseButton = true;
  showAbortButton = false; // enable to abort job
  jobId: number;
  progressNumberType: string;
  hideProgressValue = false;
  altMessage: string;
  showRealtimeLogs = false;
  autoCloseOnSuccess = false;
  openJobsManagerOnClose = false;
  readonly JobState = JobState;

  private realtimeLogsSubscribed = false;
  realtimeLogs = '';
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() progress = new EventEmitter<JobProgress>();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() success = new EventEmitter<Job>();
  @Output() aborted = new EventEmitter<Job>();
  @Output() failure = new EventEmitter<Job>();
  @Output() prefailure = new EventEmitter();
  constructor(
    public dialogRef: MatDialogRef<EntityJobComponent, MatDialogConfig>,
    private ws: WebSocketService,
    @Inject(MAT_DIALOG_DATA) public data: EntityJobConfig,
    protected http: HttpClient,
    private matDialog: MatDialog,
  ) {}

  ngOnInit(): void {
    if (this.data.title) {
      this.setTitle(this.data.title);
    }

    if (this.dialogRef.disableClose) {
      this.showCloseButton = false;
    }
    if (this.data.closeOnClickOutside) {
      this.showCloseButton = true;
      this.dialogRef.disableClose = true;
    }
    this.progress.pipe(untilDestroyed(this)).subscribe((progress: JobProgress) => {
      if (progress.description) {
        this.description = progress.description;
      }
      if (progress.percent) {
        if (this.progressNumberType === 'nopercent') {
          this.progressTotalPercent = progress.percent * 100;
        } else {
          this.progressTotalPercent = progress.percent;
        }
      }
      this.disableProgressValue(progress.percent == null);
    });

    this.failure.pipe(untilDestroyed(this)).subscribe((job) => {
      job.error = _.replace(job.error, '<', '< ');
      job.error = _.replace(job.error, '>', ' >');

      this.description = '<b>Error:</b> ' + job.error;
    });

    if (this.openJobsManagerOnClose) {
      this.dialogRef.beforeClosed()
        .pipe(untilDestroyed(this))
        .subscribe(() => {
          this.matDialog.open(JobsManagerComponent, {
            width: '400px',
            hasBackdrop: true,
            panelClass: 'topbar-panel',
            position: {
              top: '48px',
              right: '16px',
            },
          });
        });
    }
  }

  setCall<K extends ApiMethod>(method: K, args?: ApiDirectory[K]['params']): void {
    this.method = method;
    if (args) {
      this.args = args;
    }
  }

  setDescription(desc: string): void {
    this.description = desc;
  }

  setTitle(title: string): void {
    this.title = title;
  }

  enableRealtimeLogs(showRealtimeLogs: boolean): void {
    this.showRealtimeLogs = showRealtimeLogs;
  }

  changeAltMessage(msg: string): void {
    this.altMessage = msg;
  }

  disableProgressValue(hide: boolean): void {
    this.hideProgressValue = hide;
  }

  show(): void {
    this.ws.call('core.get_jobs', [[['id', '=', this.jobId]]])
      .pipe(untilDestroyed(this))
      .subscribe((jobs) => {
        if (jobs.length > 0) {
          this.jobUpdate(jobs[0]);
        }
      });
    this.ws.subscribe('core.get_jobs').pipe(
      filter((event) => event.id === this.jobId),
      map((event) => event.fields),
      untilDestroyed(this),
    ).subscribe((job) => {
      this.jobUpdate(job);
    });
  }

  jobUpdate(job: Job): void {
    this.job = job;
    this.showAbortButton = this.job.abortable;
    if (job.progress) {
      this.progress.emit(job.progress);
    }
    switch (job.state) {
      case JobState.Success:
        this.success.emit(this.job);
        break;
      case JobState.Failed:
        this.failure.emit(this.job);
        break;
      default:
        break;
    }
  }

  submit(): void {
    this.ws.job(this.method, this.args)
      .pipe(untilDestroyed(this)).subscribe(
        (job) => {
          this.job = job;
          this.showAbortButton = this.job.abortable;
          if (this.showRealtimeLogs && this.job.logs_path && !this.realtimeLogsSubscribed) {
            this.getRealtimeLogs();
          }
          if (job.progress && !this.showRealtimeLogs) {
            this.progress.emit(job.progress);
          }
          if (this.job.state === JobState.Aborted) {
            this.aborted.emit(this.job);
          }
        },
        () => {
          this.failure.emit(this.job);
        },
        () => {
          if (this.job.state === JobState.Success) {
            this.success.emit(this.job);
          } else if (this.job.state === JobState.Failed) {
            this.failure.emit(this.job);
          }
          if (this.realtimeLogsSubscribed) {
            this.ws.unsubscribe('filesystem.file_tail_follow:' + this.job.logs_path);
          }
        },
      );
  }

  wspost(path: string, options: any): void {
    this.http.post(path, options).pipe(untilDestroyed(this)).subscribe(
      (res: any) => {
        this.job = res;
        if (this.job && (this.job as any).job_id) {
          this.jobId = (this.job as any).job_id;
        }
        this.wsshow();
      },
      (err) => {
        this.prefailure.emit(err);
      },
    );
  }

  wsshow(): void {
    this.ws.call('core.get_jobs', [[['id', '=', this.jobId]]])
      .pipe(untilDestroyed(this)).subscribe((jobs) => {
        if (jobs.length > 0) {
          this.wsjobUpdate(jobs[0]);
        }
      });
    this.ws.subscribe('core.get_jobs')
      .pipe(
        filter((event) => event.id === this.jobId),
        map((event) => event.fields),
        untilDestroyed(this),
      )
      .subscribe((job) => {
        this.wsjobUpdate(job);
      });
  }

  wsjobUpdate(job: Job): void {
    this.job = job;
    this.showAbortButton = this.job.abortable;
    if ('progress' in job) {
      this.progress.emit(job.progress);
    }
    switch (job.state) {
      case JobState.Success:
        this.success.emit(this.job);
        if (this.autoCloseOnSuccess) {
          this.dialogRef.close();
        }
        break;
      case JobState.Failed:
        this.failure.emit(this.job);
        break;
      default:
        break;
    }
  }

  abortJob(): void {
    this.ws.call('core.job_abort', [this.job.id]).pipe(untilDestroyed(this)).subscribe();
  }

  getRealtimeLogs(): void {
    this.realtimeLogsSubscribed = true;
    const subName = 'filesystem.file_tail_follow:' + this.job.logs_path;
    this.ws.sub(subName).pipe(untilDestroyed(this)).subscribe((res) => {
      this.scrollBottom();
      if (res && res.data && typeof res.data === 'string') {
        this.realtimeLogs += res.data;
      }
    });
  }

  scrollBottom(): void {
    const cardContainer = document.getElementsByClassName('entity-job-dialog')[0];
    cardContainer.scrollTop = cardContainer.scrollHeight;
  }
}
