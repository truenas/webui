import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, signal,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { select, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import {
  catchError, EMPTY, Observable, of, switchMap, tap,
} from 'rxjs';
import { JobState } from 'app/enums/job-state.enum';
import { observeJob } from 'app/helpers/operators/observe-job.operator';
import { helptextGlobal } from 'app/helptext/global-helptext';
import { ApiJobMethod, ApiJobResponse } from 'app/interfaces/api/api-job-directory.interface';
import { Job } from 'app/interfaces/job.interface';
import { ShowLogsDialogComponent } from 'app/modules/dialog/components/show-logs-dialog/show-logs-dialog.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/table-column.interface';
import { JobSlice, selectJob } from 'app/modules/jobs/store/job.selectors';
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
})
export class IxCellStateButtonComponent<T> extends ColumnComponent<T> implements OnInit {
  matDialog: MatDialog = inject(MatDialog);
  translate: TranslateService = inject(TranslateService);
  dialogService: DialogService = inject(DialogService);
  errorHandler: ErrorHandlerService = inject(ErrorHandlerService);

  private cdr = inject(ChangeDetectorRef);
  private store$: Store<JobSlice> = inject<Store<JobSlice>>(Store<JobSlice>);
  job = signal<Job>(null);
  jobUpdates$: Observable<Job<ApiJobResponse<ApiJobMethod>>>;

  ngOnInit(): void {
    this.jobUpdates$ = this.store$.pipe(
      select(selectJob((this.row as Job).id)),
      tap((job) => {
        this.job.set(job);
      }),
    ) as Observable<Job<ApiJobResponse<ApiJobMethod>>>;
    this.jobUpdates$.pipe(
      switchMap((job) => {
        return [JobState.Aborted, JobState.Error, JobState.Failed,
          JobState.Finished, JobState.Success].includes(job.state)
          ? EMPTY
          : of(job);
      }),
      observeJob(),
      tap((job) => {
        this.job.set(job);
        this.cdr.markForCheck();
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  getWarnings?: (row: T) => unknown[];

  protected get warnings(): unknown[] {
    return this.getWarnings ? this.getWarnings(this.row) : [];
  }

  protected get tooltip(): string {
    if (this.job()?.logs_path && this.job()?.logs_excerpt) {
      return this.translate.instant('Show Logs');
    }

    return this.translate.instant('No logs available');
  }

  // ngOnDestroy(): void {
  // console.log('[ix-cell-state-button][ngOnDestroy] destroyed');
  // }

  protected onButtonClick(): void {
    let state = (this.row as RowState).state;
    // console.log('[ix-cell-state-button][onButtonClick] job', this.job);

    if (this.job()?.state && !state) {
      state = {
        state: this.job().state,
        error: this.job().error,
      } as RowState['state'];
    }

    if (this.job && state) {
      if (this.job().state === JobState.Running) {
        this.dialogService.jobDialog(
          this.jobUpdates$.pipe(observeJob()),
          {
            title: this.translate.instant('Task is running'),
            canMinimize: true,
          },
        ).afterClosed().pipe(
          catchError((error) => {
            this.errorHandler.showErrorModal(error);
            return EMPTY;
          }),
        // TODO: Remove this ignore eslint lint line and add takeUntil (untilDestroyed)
        // eslint-disable-next-line rxjs-angular/prefer-takeuntil
        ).subscribe();
      } else if (state.state === JobState.Hold) {
        this.dialogService.info(this.translate.instant('Task is on hold'), state.reason);
      } else if (state.warnings?.length > 0) {
        let list = '';
        state.warnings.forEach((warning: string) => {
          list += warning + '\n';
        });
        this.dialogService.error({ title: state.state, message: `<pre>${list}</pre>` });
      } else if (state.error) {
        this.dialogService.error({ title: state.state, message: `<pre>${state.error}</pre>` });
      } else if (!this.job().logs_excerpt) {
        this.dialogService.warn(helptextGlobal.noLogDialog.title, helptextGlobal.noLogDialog.message);
      } else {
        this.matDialog.open(ShowLogsDialogComponent, { data: this.job });
      }
    } else {
      this.dialogService.warn(helptextGlobal.noLogDialog.title, helptextGlobal.noLogDialog.message);
    }
  }

  protected getButtonClass(): string {
    // Bring warnings to user's attention even if state is finished or successful.
    if (this.warnings?.length > 0) {
      return 'fn-theme-orange';
    }

    switch (this.job().state) {
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
