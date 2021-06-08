import { HttpClient } from '@angular/common/http';
import {
  OnInit, Component, EventEmitter, Output, Inject,
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { EntityJobState } from 'app/enums/entity-job-state.enum';
import { WebSocketService } from 'app/services/';

@UntilDestroy()
@Component({
  selector: 'entity-job',
  templateUrl: 'entity-job.component.html',
  styleUrls: ['./entity-job.component.scss'],
})
export class EntityJobComponent implements OnInit {
  job: any = {};
  progressTotalPercent = 0;
  description: string;
  method: string;
  args: any[] = [];

  title = '';
  showCloseButton = true;
  showAbortButton = false; // enable to abort job
  jobId: Number;
  progressNumberType: any;
  hideProgressValue = false;
  altMessage: string;
  showRealtimeLogs = false;
  EntityJobState = EntityJobState;

  private realtimeLogsSubscribed = false;
  realtimeLogs = '';
  @Output() progress = new EventEmitter();
  @Output() success = new EventEmitter();
  @Output() aborted = new EventEmitter();
  @Output() failure = new EventEmitter();
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

    this.failure.pipe(untilDestroyed(this)).subscribe((job: any) => {
      job.error = _.replace(job.error, '<', '< ');
      job.error = _.replace(job.error, '>', ' >');

      this.description = '<b>Error:</b> ' + job.error;
    });
  }

  setCall(method: string, args?: any[]): void {
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
    this.ws.call('core.get_jobs', [
      [
        ['id', '=', this.jobId],
      ],
    ])
      .pipe(untilDestroyed(this)).subscribe((res) => {
        if (res.length > 0) {
          this.jobUpdate(res[0]);
        }
      });
    this.ws.subscribe('core.get_jobs').pipe(untilDestroyed(this)).subscribe((res) => {
      if (res.id === this.jobId) {
        this.jobUpdate(res);
      }
    });
  }

  jobUpdate(job: any): void {
    this.job = job;
    this.showAbortButton = this.job.abortable;
    if (job.progress) {
      this.progress.emit(job.progress);
    }
    if (job.state === EntityJobState.Success) {
      this.success.emit(this.job);
    } else if (job.state === EntityJobState.Failed) {
      this.failure.emit(this.job);
    }
  }

  submit(): void {
    this.ws.job(this.method, this.args)
      .pipe(untilDestroyed(this)).subscribe(
        (res) => {
          this.job = res;
          this.showAbortButton = this.job.abortable;
          if (this.showRealtimeLogs && this.job.logs_path && !this.realtimeLogsSubscribed) {
            this.getRealtimeLogs();
          }
          if (res.progress && !this.showRealtimeLogs) {
            this.progress.emit(res.progress);
          }
          if (this.job.state === EntityJobState.Aborted) {
            this.aborted.emit(this.job);
          }
        },
        () => {},
        () => {
          if (this.job.state === EntityJobState.Success) {
            this.success.emit(this.job);
          } else if (this.job.state === EntityJobState.Failed) {
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
      (res) => {
        this.job = res;
        if (this.job && this.job.job_id) {
          this.jobId = this.job.job_id;
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
    this.ws.call('core.get_jobs', [
      [
        ['id', '=', this.jobId],
      ],
    ])
      .pipe(untilDestroyed(this)).subscribe((res) => {
        if (res.length > 0) {
          this.wsjobUpdate(res[0]);
        }
      });
    this.ws.subscribe('core.get_jobs').pipe(untilDestroyed(this)).subscribe((res) => {
      if (res.id === this.jobId) {
        this.wsjobUpdate(res);
      }
    });
  }

  wsjobUpdate(job: any): void {
    this.job = job;
    this.showAbortButton = this.job.abortable;
    if (job.fields) {
      this.job.state = job.fields.state;
    }
    if (job.progress) {
      this.progress.emit(job.progress);
    }
    if (job.fields) {
      if (job.fields.state === EntityJobState.Running) {
        this.progress.emit(this.job.fields.progress);
      } else if (job.fields.state === EntityJobState.Success) {
        this.success.emit(this.job.fields);
      } else if ((job.fields.state === EntityJobState.Failed) || job.fields.error) {
        this.failure.emit(this.job.fields);
      }
    } else if (job.state === EntityJobState.Success) {
      this.success.emit(this.job);
    } else if (job.state === EntityJobState.Failed) {
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
