import { HttpClient } from '@angular/common/http';
import {
  OnInit, Component, EventEmitter, Output, Inject,
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { JobState } from 'app/enums/job-state.enum';
import { ApiMethod } from 'app/interfaces/api-directory.interface';
import { ApiEvent } from 'app/interfaces/api-event.interface';
import { Job, JobProgress } from 'app/interfaces/job.interface';
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
  progressNumberType: any;
  hideProgressValue = false;
  altMessage: string;
  showRealtimeLogs = false;
  EntityJobState = JobState;

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
    public dialogRef: MatDialogRef <EntityJobComponent>,
    private ws: WebSocketService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    protected http: HttpClient,
  ) {}

  ngOnInit(): void {
    if (this.data.title) {
      this.setTitle(this.data.title);
    }

    if (this.dialogRef.disableClose) {
      this.showCloseButton = false;
    }
    if (this.data.CloseOnClickOutside) {
      this.showCloseButton = true;
      this.dialogRef.disableClose = true;
    }
    this.progress.pipe(untilDestroyed(this)).subscribe((progress: any) => {
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
  }

  setCall(method: ApiMethod, args?: any[]): void {
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
    this.ws.subscribe('core.get_jobs').pipe(untilDestroyed(this)).subscribe((event) => {
      if (event.id === this.jobId) {
        // TODO: Likely broken and has to be event.fields.
        this.jobUpdate(event as any);
      }
    });
  }

  jobUpdate(job: Job): void {
    this.job = job;
    this.showAbortButton = this.job.abortable;
    if (job.progress) {
      this.progress.emit(job.progress);
    }
    if (job.state === JobState.Success) {
      this.success.emit(this.job);
    } else if (job.state === JobState.Failed) {
      this.failure.emit(this.job);
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
        () => {},
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
      () => {
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
    this.ws.subscribe('core.get_jobs').pipe(untilDestroyed(this)).subscribe((event) => {
      if (event.id === this.jobId) {
        this.wsjobUpdate(event);
      }
    });
  }

  wsjobUpdate(job: Job | ApiEvent<Job>): void {
    this.job = job as Job;
    this.showAbortButton = this.job.abortable;
    if ('fields' in job) {
      this.job.state = job.fields.state;
    }
    if ('progress' in job) {
      this.progress.emit(job.progress);
    }
    if ('fields' in job) {
      if (job.fields.state === JobState.Running) {
        this.progress.emit(job.fields.progress);
      } else if (job.fields.state === JobState.Success) {
        this.success.emit(job.fields);
      } else if ((job.fields.state === JobState.Failed) || job.fields.error) {
        this.failure.emit(job.fields);
      }
    } else if (job.state === JobState.Success) {
      this.success.emit(this.job);
    } else if (job.state === JobState.Failed) {
      this.failure.emit(this.job);
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
