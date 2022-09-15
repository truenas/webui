import {
  HttpClient, HttpErrorResponse, HttpEvent, HttpEventType,
} from '@angular/common/http';
import {
  OnInit, Component, EventEmitter, Output, Inject, AfterViewChecked,
} from '@angular/core';
import {
  MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { UUID } from 'angular2-uuid';
import * as _ from 'lodash';
import { filter, map } from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import { ApiDirectory, ApiMethod } from 'app/interfaces/api-directory.interface';
import { Job, JobProgress } from 'app/interfaces/job.interface';
import { EntityJobConfig } from 'app/modules/entity/entity-job/entity-job-config.interface';
import { JobsPanelComponent } from 'app/modules/jobs/components/jobs-panel/jobs-panel.component';
import { WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: 'entity-job.component.html',
  styleUrls: ['./entity-job.component.scss'],
})
export class EntityJobComponent implements OnInit, AfterViewChecked {
  job: Job = {} as Job;
  progressTotalPercent = 0;
  description: string;
  method: ApiMethod;
  args: ApiDirectory[keyof ApiDirectory]['params'] = [];

  title = '';
  showHttpProgress = false;
  uploadPercentage: number = null;
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
  @Output() prefailure = new EventEmitter<HttpErrorResponse>();
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
      this.disableProgressValue(progress.percent === null);
    });

    this.failure.pipe(untilDestroyed(this)).subscribe((job) => {
      let error = _.replace(job.error, '<', '< ');
      error = _.replace(error, '>', ' >');

      this.description = '<b>Error:</b> ' + error;
    });

    if (this.openJobsManagerOnClose) {
      this.dialogRef.beforeClosed()
        .pipe(untilDestroyed(this))
        .subscribe(() => {
          this.matDialog.open(JobsPanelComponent, {
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

  ngAfterViewChecked(): void {
    this.scrollBottom();
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

  submit(): void {
    let subscriptionId: string = null;
    this.ws.job(this.method, this.args)
      .pipe(untilDestroyed(this)).subscribe({
        next: (job) => {
          this.job = job;
          this.showAbortButton = this.job.abortable;
          if (this.showRealtimeLogs && this.job.logs_path && !this.realtimeLogsSubscribed) {
            subscriptionId = this.getRealtimeLogs();
          }
          if (job.progress && !this.showRealtimeLogs) {
            this.progress.emit(job.progress);
          }
          if (this.job.state === JobState.Aborted) {
            this.aborted.emit(this.job);
          }
        },
        error: () => {
          this.failure.emit(this.job);
        },
        complete: () => {
          if (this.job.state === JobState.Success) {
            this.success.emit(this.job);
          } else if (this.job.state === JobState.Failed) {
            this.failure.emit(this.job);
          }
          if (this.realtimeLogsSubscribed) {
            this.ws.unsubscribe('filesystem.file_tail_follow:' + this.job.logs_path);
            this.ws.unsub('filesystem.file_tail_follow:' + this.job.logs_path, subscriptionId);
          }
        },
      });
  }

  wspostWithProgressUpdates(path: string, options: unknown): void {
    this.showHttpProgress = true;
    this.http.post(path, options, { reportProgress: true, observe: 'events' })
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (event: HttpEvent<Job>) => {
          if (event.type === HttpEventType.UploadProgress) {
            const eventTotal = event.total ? event.total : 0;
            let progress = 0;
            if (eventTotal !== 0) {
              progress = Math.round(event.loaded / eventTotal * 100);
            }
            this.uploadPercentage = progress;
          } else if (event.type === HttpEventType.Response) {
            this.showHttpProgress = false;
            this.job = event.body;
            if (this.job && (this.job as any).job_id) {
              this.jobId = (this.job as any).job_id;
            }
            this.wsshow();
          }
        },
        error: (err: HttpErrorResponse) => {
          this.showHttpProgress = false;
          this.prefailure.emit(err);
        },
      });
  }

  wspost(path: string, options: unknown): void {
    this.http.post(path, options).pipe(untilDestroyed(this)).subscribe({
      next: (res: Job) => {
        this.job = res;
        if (this.job && (this.job as any).job_id) {
          this.jobId = (this.job as any).job_id;
        }
        this.wsshow();
      },
      error: (err: HttpErrorResponse) => {
        this.prefailure.emit(err);
      },
    });
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
      case JobState.Aborted:
        this.aborted.emit(this.job);
        break;
      default:
        break;
    }
  }

  abortJob(): void {
    this.ws.call('core.job_abort', [this.job.id]).pipe(untilDestroyed(this)).subscribe(() => {
      this.dialogRef.close();
    });
  }

  /**
   * This method returns the subscription id that is used when subscribing to real time
   * websocket updates. The subscription id is used to unsubscribe form those real time
   * websocket updates at a later time. Unsubscription is not possible without this id
   */
  getRealtimeLogs(): string {
    this.realtimeLogsSubscribed = true;
    const subscriptionId = UUID.UUID();
    const subName = 'filesystem.file_tail_follow:' + this.job.logs_path;
    this.ws.sub(subName, subscriptionId).pipe(untilDestroyed(this)).subscribe((res) => {
      if (res && res.data && typeof res.data === 'string') {
        this.realtimeLogs += res.data;
      }
    });
    return subscriptionId;
  }

  scrollBottom(): void {
    const cardContainer = document.getElementsByClassName('entity-job-dialog')[0];
    const logsContainer = cardContainer.getElementsByClassName('logs-container')[0];
    if (!logsContainer) {
      return;
    }
    logsContainer.scrollTop = logsContainer.scrollHeight;
  }
}
