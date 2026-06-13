import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { TnTestIdDirective, TnTooltipDirective } from '@truenas/ui-components';
import {
  catchError, EMPTY, filter, Observable,
} from 'rxjs';
import { DisplayableState, JobState } from 'app/enums/job-state.enum';
import { TaskState } from 'app/enums/task-state.enum';
import { observeJob } from 'app/helpers/operators/observe-job.operator';
import { helptextGlobal } from 'app/helptext/global-helptext';
import { ApiJobMethod, ApiJobResponse } from 'app/interfaces/api/api-job-directory.interface';
import { Job } from 'app/interfaces/job.interface';
import { ShowLogsDialog } from 'app/modules/dialog/components/show-logs-dialog/show-logs-dialog.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { JobSlice, selectJob } from 'app/modules/jobs/store/job.selectors';
import { JobStateDisplayPipe } from 'app/modules/pipes/job-state-display/job-state-display.pipe';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { FailedJobError } from 'app/services/errors/error.classes';

/**
 * tn-table replacement for the ix-table `stateButtonColumn` cell renderer. The
 * library has no multi-colour status pill (`tn-button` only does filled/outline,
 * `tn-chip` only primary/secondary/accent), so the pill markup is a plain
 * `<button>` styled locally rather than a `tn-*` element. The running-job log
 * viewer is still opened through `MatDialog` (as in the original
 * `ix-cell-state-button` cell), pending the dialog migration (NAS-141022).
 * Presentational inputs only; the live job state arrives via the bound
 * `[state]`/`[job]` inputs (the host card updates the row), and the running-job
 * dialog stream is built on demand.
 */
@Component({
  selector: 'ix-task-state-cell',
  templateUrl: './task-state-cell.component.html',
  styleUrls: ['./task-state-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnTooltipDirective,
    TranslateModule,
    TnTestIdDirective,
    JobStateDisplayPipe,
  ],
})
export class TaskStateCellComponent {
  private matDialog = inject(MatDialog);
  private translate = inject(TranslateService);
  private dialogService = inject(DialogService);
  private errorHandler = inject(ErrorHandlerService);
  private store$ = inject<Store<JobSlice>>(Store);
  private destroyRef = inject(DestroyRef);

  /** Displayable state shown in the pill (e.g. the task's job state). */
  readonly state = input.required<DisplayableState | null | undefined>();
  /** Backing job, used for logs / the running-job dialog. */
  readonly job = input<Job | null>(null);
  readonly testId = input.required<string[]>();
  readonly ariaLabel = input.required<string>();

  protected readonly tooltip = computed(() => {
    // Mirror `onButtonClick`: the logs dialog opens whenever an excerpt exists,
    // so the tooltip must promise "Show Logs" under the same condition.
    if (this.job()?.logs_excerpt) {
      return this.translate.instant('Show Logs');
    }
    return this.translate.instant('No logs available');
  });

  protected readonly stateClass = computed(() => {
    switch (this.state()) {
      case TaskState.Pending:
      case JobState.Aborted:
        return 'state-orange';
      case JobState.Running:
      case TaskState.Running:
        return 'state-blue';
      case TaskState.Finished:
      case JobState.Success:
        return 'state-green';
      case TaskState.Error:
      case JobState.Failed:
        return 'state-red';
      case TaskState.Locked:
      case TaskState.Hold:
        return 'state-yellow';
      default:
        return 'state-primary';
    }
  });

  protected onButtonClick(): void {
    const state = this.state();
    const job = this.job();

    if (!state) {
      this.dialogService.warn(helptextGlobal.noLogDialog.title, helptextGlobal.noLogDialog.message);
      return;
    }

    if (state === JobState.Running) {
      this.showJobDialog();
      return;
    }

    if (state === TaskState.Hold) {
      this.dialogService.info(this.translate.instant('Task is on hold'), '');
      return;
    }

    if (job?.error) {
      this.errorHandler.showErrorModal(new FailedJobError(job));
      return;
    }

    if (job?.logs_excerpt) {
      this.matDialog.open(ShowLogsDialog, { data: job });
      return;
    }

    this.dialogService.warn(helptextGlobal.noLogDialog.title, helptextGlobal.noLogDialog.message);
  }

  private showJobDialog(): void {
    const jobId = this.job()?.id;
    if (!jobId) {
      return;
    }

    const jobUpdates$ = this.store$.select(selectJob(jobId)).pipe(
      filter((job) => !!job),
      observeJob(),
    ) as Observable<Job<ApiJobResponse<ApiJobMethod>>>;

    this.dialogService.jobDialog(
      jobUpdates$,
      {
        title: this.translate.instant('Task is running'),
        canMinimize: true,
      },
    ).afterClosed().pipe(
      catchError((error: unknown) => {
        this.errorHandler.showErrorModal(error);
        return EMPTY;
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }
}
