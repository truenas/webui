import { CdkScrollable } from '@angular/cdk/scrolling';
import { DecimalPipe } from '@angular/common';
import {
  AfterViewChecked, ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, output,
} from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogConfig, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose,
} from '@angular/material/dialog';
import { MatProgressBar } from '@angular/material/progress-bar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, Subscription, map } from 'rxjs';
import { JobState } from 'app/enums/job-state.enum';
import { Job, JobProgress } from 'app/interfaces/job.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

export interface JobProgressDialogConfig<Result> {
  job$: Observable<Job<Result>>;

  /**
   * Defaults to job.method.
   */
  title?: string;

  /**
   * Defaults to job.description;
   */
  description?: string;

  /**
   * Defaults to false;
   */
  showRealtimeLogs?: boolean;

  /**
   * Whether user can minimize the job dialog
   * Defaults to false.
   * Minimizing the dialog will not stop the job, but will destroy the component and thus all the code in subscription.
   */
  canMinimize?: boolean;
}

@UntilDestroy()
@Component({
  selector: 'ix-job-progress-dialog',
  templateUrl: './job-progress-dialog.component.html',
  styleUrls: ['./job-progress-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    CdkScrollable,
    MatDialogContent,
    MatProgressBar,
    MatDialogActions,
    MatButton,
    MatIconButton,
    MatDialogClose,
    IxIconComponent,
    TranslateModule,
    DecimalPipe,
    TestDirective,
    TestDirective,
  ],
})
export class JobProgressDialogComponent<T> implements OnInit, AfterViewChecked {
  readonly jobSuccess = output<Job<T>>();
  readonly jobFailure = output<unknown>();
  readonly jobAborted = output<Job<T>>();
  readonly jobProgress = output<JobProgress>();

  protected job = {} as Job<T>;

  readonly JobState = JobState;

  protected title: string;
  protected description: string;
  private realtimeLogsSubscribed = false;
  protected realtimeLogs = '';
  protected showMinimizeButton = true;
  protected progressTotalPercent = 0;
  protected hideProgressValue = false;
  protected showRealtimeLogs = false;

  protected isAbortingJob = false;

  get isJobRunning(): boolean {
    return this.job?.state === JobState.Running;
  }

  get hasAbortButton(): boolean {
    return this.job.abortable && [JobState.Running, JobState.Waiting].includes(this.job?.state);
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
    private dialogRef: MatDialogRef<JobProgressDialogComponent<T>, MatDialogConfig>,
    @Inject(MAT_DIALOG_DATA) public data: JobProgressDialogConfig<T>,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService,
  ) { }

  ngOnInit(): void {
    this.title = this.data?.title;
    this.description = this.data?.description;
    this.showRealtimeLogs = this.data?.showRealtimeLogs || false;
    this.showMinimizeButton = this.data?.canMinimize || false;
    this.dialogRef.disableClose = !this.showMinimizeButton;

    let logsSubscription: Subscription = null;
    this.cdr.markForCheck();

    this.data.job$.pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (job) => {
        this.job = job;
        if (!this.title) {
          this.title = this.job.method;
        }
        if (!this.description) {
          this.description = this.job.description;
        }
        if (
          this.data.showRealtimeLogs
          && this.job.logs_path
          && !this.realtimeLogsSubscribed
        ) {
          logsSubscription = this.getRealtimeLogs();
        }
        if (job.progress && !this.data.showRealtimeLogs) {
          this.jobProgress.emit(job.progress);
          if (job.progress.description) {
            this.description = job.progress.description;
          }
          if (job.progress.percent) {
            this.progressTotalPercent = job.progress.percent;
          }
          this.hideProgressValue = job.progress.percent === null;
        }

        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.jobFailure.emit(error);
        this.dialogRef.close();
      },
      complete: () => {
        // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
        switch (this.job.state) {
          case JobState.Failed:
            this.jobFailure.emit(this.job);
            this.dialogRef.close();
            break;
          case JobState.Aborted:
            this.jobAborted.emit(this.job);
            this.dialogRef.close();
            break;
          case JobState.Success:
            this.jobSuccess.emit(this.job);
            this.dialogRef.close();
            break;
        }

        if (this.realtimeLogsSubscribed) {
          logsSubscription.unsubscribe();
        }
        this.cdr.markForCheck();
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
    this.cdr.markForCheck();
  }

  abortJob(): void {
    this.ws.call('core.job_abort', [this.job.id]).pipe(
      this.errorHandler.catchError(),
      untilDestroyed(this),
    )
      .subscribe(() => {
        this.isAbortingJob = true;
        this.cdr.markForCheck();
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
    this.cdr.markForCheck();
    return this.ws.subscribeToLogs(subName)
      .pipe(map((apiEvent) => apiEvent.fields), untilDestroyed(this))
      .subscribe((logs) => {
        if (logs?.data && typeof logs.data === 'string') {
          this.realtimeLogs += logs.data;
        }
        this.cdr.markForCheck();
      });
  }
}
