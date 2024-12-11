import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, effect, inject, OnInit, signal,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  catchError, EMPTY, Observable, tap,
} from 'rxjs';
import { JobState } from 'app/enums/job-state.enum';
import { observeJob } from 'app/helpers/operators/observe-job.operator';
import { helptextGlobal } from 'app/helptext/global-helptext';
import { ApiJobMethod, ApiJobResponse } from 'app/interfaces/api/api-job-directory.interface';
import { Job } from 'app/interfaces/job.interface';
import { ShowLogsDialogComponent } from 'app/modules/dialog/components/show-logs-dialog/show-logs-dialog.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { ColumnComponent, Column } from 'app/modules/ix-table/interfaces/column-component.class';
import { JobSlice, selectJob } from 'app/modules/jobs/store/job.selectors';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ErrorHandlerService } from 'app/services/error-handler.service';

interface RowState {
  state: {
    state: JobState;
    error: string;
    warnings: string[];
    reason: string;
  };
}

@UntilDestroy()
@Component({
  selector: 'ix-cell-state-button',
  templateUrl: './ix-cell-state-button.component.html',
  styleUrls: ['./ix-cell-state-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatButton,
    NgClass,
    MatTooltip,
    IxIconComponent,
    TranslateModule,
    TestDirective,
  ],
})
export class IxCellStateButtonComponent<T> extends ColumnComponent<T> implements OnInit {
  matDialog: MatDialog = inject(MatDialog);
  translate: TranslateService = inject(TranslateService);
  dialogService: DialogService = inject(DialogService);
  errorHandler: ErrorHandlerService = inject(ErrorHandlerService);

  private readonly rowUpdateEffect = effect(() => {
    const row = this.row();
    const job = !row || !this.getJob ? undefined : this.getJob(row);

    if (!job) {
      return;
    }

    this.state.set(job.state);
  });

  getJob: (row: T) => Job;
  private store$: Store<JobSlice> = inject<Store<JobSlice>>(Store<JobSlice>);
  job = signal<Job>(null);
  jobUpdates$: Observable<Job<ApiJobResponse<ApiJobMethod>>>;
  state = signal<JobState>(null);

  ngOnInit(): void {
    if (this.getJob) {
      const job = this.getJob(this.row());
      this.job.set(job);
      if (job?.state) {
        this.state.set(job.state);
      }
    }
    if (!this.job()) {
      this.state.set(this.value as JobState);
      return;
    }
    const jobId = this.getJob(this.row()).id;
    this.jobUpdates$ = this.store$.select(selectJob(jobId)).pipe(
      tap((job) => {
        this.job.set(job);
        this.state.set(job.state);
      }),
    ) as Observable<Job<ApiJobResponse<ApiJobMethod>>>;
  }

  getWarnings?: (row: T) => unknown[];

  protected get warnings(): unknown[] {
    return this.getWarnings ? this.getWarnings(this.row()) : [];
  }

  protected get tooltip(): string {
    if (this.job()?.logs_path && this.job()?.logs_excerpt) {
      return this.translate.instant('Show Logs');
    }

    return this.translate.instant('No logs available');
  }

  protected onButtonClick(): void {
    const state: RowState['state'] = {
      state: this.state(),
      error: this.job()?.error,
    } as RowState['state'];

    if (!state.state) {
      this.dialogService.warn(helptextGlobal.noLogDialog.title, helptextGlobal.noLogDialog.message);
      return;
    }

    if (state.state === JobState.Running) {
      this.showJobDialog();
      return;
    }

    if (state.state === JobState.Hold) {
      this.dialogService.info(this.translate.instant('Task is on hold'), state.reason);
      return;
    }

    if (state.warnings?.length > 0) {
      let list = '';
      state.warnings.forEach((warning: string) => {
        list += warning + '\n';
      });
      this.dialogService.error({ title: state.state, message: `<pre>${list}</pre>` });
      return;
    }

    if (state.error) {
      this.dialogService.error({ title: state.state, message: `<pre>${state.error}</pre>` });
      return;
    }

    if (this.job()?.logs_excerpt) {
      this.matDialog.open(ShowLogsDialogComponent, { data: this.job() });
      return;
    }

    this.dialogService.warn(helptextGlobal.noLogDialog.title, helptextGlobal.noLogDialog.message);
  }

  showJobDialog(): void {
    this.dialogService.jobDialog(
      this.jobUpdates$.pipe(observeJob()),
      {
        title: this.translate.instant('Task is running'),
        canMinimize: true,
      },
    ).afterClosed().pipe(
      catchError((error: unknown) => {
        this.errorHandler.showErrorModal(error);
        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  protected getButtonClass(): string {
    // Bring warnings to user's attention even if state is finished or successful.
    if (this.warnings?.length > 0) {
      return 'fn-theme-orange';
    }

    switch (this.state()) {
      case JobState.Pending:
      case JobState.Aborted:
      case JobState.Running:
        return 'fn-theme-orange';
      case JobState.Finished:
      case JobState.Success:
        return 'fn-theme-green';
      case JobState.Error:
      case JobState.Failed:
        return 'fn-theme-red';
      case JobState.Locked:
      case JobState.Hold:
        return 'fn-theme-yellow';
      default:
        return 'fn-theme-primary';
    }
  }
}

export function stateButtonColumn<T>(
  options: Partial<IxCellStateButtonComponent<T>>,
): Column<T, IxCellStateButtonComponent<T>> {
  return { type: IxCellStateButtonComponent, ...options };
}
