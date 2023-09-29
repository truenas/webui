import { AfterViewChecked, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import _ from 'lodash';
import { Observable, Subscription, delay, map } from 'rxjs';
import { JobState } from 'app/enums/job-state.enum';
import { Job, JobProgress } from 'app/interfaces/job.interface';
import { WebSocketService } from 'app/services/ws.service';

export interface JobProgressDialogConfig {
  job$: Observable<Job>;
  callbacks: {
    onSuccess?: (job: Job) => void;
    onFailure?: (job: Job) => void;
    onAbort?: (job: Job) => void;
    onProgress: (progress: JobProgress) => void;
  };
  config: {
    title: string;
    description: string;
  };
  flags: {
    showRealtimeLogs: boolean;
    autoCloseOnSuccess: boolean;
  };
}

@UntilDestroy()
@Component({
  templateUrl: './job-progress-dialog.component.html',
  styleUrls: ['./job-progress-dialog.component.scss'],
})
export class JobProgressDialogComponent implements OnInit, AfterViewChecked {
  protected job: Job = {} as Job;

  readonly JobState = JobState;

  protected title: string;
  protected description: string;
  protected showAbortButton: boolean;
  private realtimeLogsSubscribed = false;
  protected realtimeLogs = '';
  protected showCloseButton = true;
  protected progressTotalPercent = 0;
  protected hideProgressValue = false;
  protected showRealtimeLogs = false;
  protected autoCloseOnSuccess = true;

  get isJobRunning(): boolean {
    return this.job?.state === JobState.Running;
  }

  get isJobStateDeterminate(): boolean {
    return [
      JobState.Aborted,
      JobState.Error,
      JobState.Failed,
      JobState.Finished,
      JobState.Success,
    ].includes(this.job?.state) || this.isJobRunning;
  }

  constructor(
    private dialogRef: MatDialogRef<JobProgressDialogComponent, MatDialogConfig>,
    @Inject(MAT_DIALOG_DATA) public data: JobProgressDialogConfig,
    private ws: WebSocketService,
  ) { }

  ngOnInit(): void {
    this.title = this.data.config.title;
    this.description = this.data.config.description;
    let logsSubscription: Subscription = null;
    this.showRealtimeLogs = this.data.flags.showRealtimeLogs;
    this.autoCloseOnSuccess = this.data.flags.autoCloseOnSuccess;
    if (this.dialogRef.disableClose) {
      this.showCloseButton = false;
    }

    this.data.job$.pipe(
      delay(5000),
      untilDestroyed(this),
    ).subscribe({
      next: (job) => {
        this.job = job;
        this.showAbortButton = job.abortable;
        if (
          this.data.flags.showRealtimeLogs
          && this.job.logs_path
          && !this.realtimeLogsSubscribed) {
          logsSubscription = this.getRealtimeLogs();
        }
        if (job.progress && !this.data.flags.showRealtimeLogs) {
          this.data.callbacks.onProgress(job.progress);
          if (job.progress.description) {
            this.description = job.progress.description;
          }
          if (job.progress.percent) {
            this.progressTotalPercent = job.progress.percent;
          }
          this.hideProgressValue = job.progress.percent === null;
        }
        if (this.job.state === JobState.Aborted) {
          this.data.callbacks.onAbort(this.job);
        }

      },
      error: (job: Job) => {
        this.job = job;
        this.data.callbacks.onFailure(this.job);
      },
      complete: () => {
        if (this.job.state === JobState.Success) {
          this.data.callbacks.onSuccess(this.job);
          if (this.autoCloseOnSuccess) {
            this.dialogRef.close();
          }
        } else if (this.job.state === JobState.Failed) {
          this.data.callbacks.onFailure(this.job);
          let error = _.replace(this.job.error, '<', '< ');
          error = _.replace(error, '>', ' >');
          this.description = '<b>Error:</b> ' + error;
        }
        if (this.realtimeLogsSubscribed) {
          logsSubscription.unsubscribe();
        }
      },
    });

  }

  ngAfterViewChecked(): void {
    this.scrollBottom();
  }

  scrollBottom(): void {
    const cardContainer = document.getElementsByClassName('job-dialog')[0];
    const logsContainer = cardContainer.getElementsByClassName('logs-container')[0];
    if (!logsContainer) {
      return;
    }
    logsContainer.scrollTop = logsContainer.scrollHeight;
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
  getRealtimeLogs(): Subscription {
    this.realtimeLogsSubscribed = true;
    const subName = 'filesystem.file_tail_follow:' + this.job.logs_path;
    return this.ws.subscribeToLogs(subName)
      .pipe(map((apiEvent) => apiEvent.fields), untilDestroyed(this))
      .subscribe((logs) => {
        if (logs?.data && typeof logs.data === 'string') {
          this.realtimeLogs += logs.data;
        }
      });
  }

}