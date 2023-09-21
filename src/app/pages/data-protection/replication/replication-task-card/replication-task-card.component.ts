import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { formatDistanceToNow } from 'date-fns';
import { catchError, EMPTY, filter, switchMap, tap } from 'rxjs';
import { JobState } from 'app/enums/job-state.enum';
import { tapOnce } from 'app/helpers/operators/tap-once.operator';
import helptext from 'app/helptext/data-protection/data-protection-dashboard/data-protection-dashboard';
import { Job } from 'app/interfaces/job.interface';
import { ReplicationTaskUi } from 'app/interfaces/replication-task.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';
import { stateButtonColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-state-button/ix-cell-state-button.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { toggleColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-toggle/ix-cell-toggle.component';
import { createTable } from 'app/modules/ix-table2/utils';
import { selectJob } from 'app/modules/jobs/store/job.selectors';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ReplicationFormComponent } from 'app/pages/data-protection/replication/replication-form/replication-form.component';
import { ReplicationRestoreDialogComponent } from 'app/pages/data-protection/replication/replication-restore-dialog/replication-restore-dialog.component';
import { ReplicationWizardComponent } from 'app/pages/data-protection/replication/replication-wizard/replication-wizard.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { StorageService } from 'app/services/storage.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';

@UntilDestroy()
@Component({
  selector: 'ix-replication-task-card',
  templateUrl: './replication-task-card.component.html',
  styleUrls: ['./replication-task-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplicationTaskCardComponent implements OnInit {
  dataProvider = new ArrayDataProvider<ReplicationTaskUi>();
  isLoading = false;
  jobStates = new Map<number, string>();
  readonly jobState = JobState;

  columns = createTable<ReplicationTaskUi>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
    }),
    textColumn({
      title: this.translate.instant('Last Snapshot'),
      propertyName: 'task_last_snapshot',
    }),
    toggleColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
      cssClass: 'justify-end',
      onRowToggle: (row: ReplicationTaskUi) => this.onChangeEnabledState(row),
    }),
    stateButtonColumn({
      title: this.translate.instant('State'),
      getValue: (row) => row.state.state,
      getJob: (row) => row.job,
      cssClass: 'state-button',
    }),
    textColumn({
      title: this.translate.instant('Last Run'),
      propertyName: 'last_run',
    }),
    textColumn({
      propertyName: 'id',
      cssClass: 'wide-actions',
    }),
  ]);

  constructor(
    private slideInService: IxSlideInService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private ws: WebSocketService,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef,
    private store$: Store<AppState>,
    private snackbar: SnackbarService,
    private matDialog: MatDialog,
    private storage: StorageService,
  ) {}

  ngOnInit(): void {
    this.getReplicationTasks();
  }

  getReplicationTasks(): void {
    this.isLoading = true;
    this.ws.call('replication.query', [[], { extra: { check_dataset_encryption_keys: true } }]).pipe(
      untilDestroyed(this),
    ).subscribe((replicationTasks: ReplicationTaskUi[]) => {
      const transformedReplicationTasks = this.transformReplicationTasks(replicationTasks);
      this.dataProvider.setRows(transformedReplicationTasks);
      this.isLoading = false;
      this.cdr.markForCheck();
    });
  }

  doDelete(replicationTask: ReplicationTaskUi): void {
    this.dialogService.confirm({
      title: this.translate.instant('Confirmation'),
      message: this.translate.instant('Delete Replication Task <b>"{name}"</b>?', {
        name: replicationTask.name,
      }),
    }).pipe(
      filter(Boolean),
      switchMap(() => this.ws.call('replication.delete', [replicationTask.id])),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.getReplicationTasks();
      },
      error: (err) => {
        this.dialogService.error(this.errorHandler.parseError(err));
      },
    });
  }

  addReplicationTask(): void {
    const slideInRef = this.slideInService.open(ReplicationWizardComponent, { wide: true });
    slideInRef.slideInClosed$
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.getReplicationTasks());
  }

  editReplicationTask(row: ReplicationTaskUi): void {
    const slideInRef = this.slideInService.open(ReplicationFormComponent, { data: row, wide: true });
    slideInRef.slideInClosed$
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.getReplicationTasks());
  }

  runNow(row: ReplicationTaskUi): void {
    this.dialogService.confirm({
      title: this.translate.instant('Run Now'),
      message: this.translate.instant('Replicate «{name}» now?', { name: row.name }),
      hideCheckbox: true,
    }).pipe(
      filter(Boolean),
      tap(() => row.state.state = JobState.Running),
      switchMap(() => this.ws.job('replication.run', [row.id])),
      tapOnce(() => {
        this.snackbar.success(
          this.translate.instant('Replication «{name}» has started.', { name: row.name }),
        );
      }),
      tap((job) => {
        if (!([JobState.Running, JobState.Pending].includes(job.state))) {
          this.getReplicationTasks();
          return;
        }
        row.state.state = job.state;
        row.job = { ...job };
        this.jobStates.set(job.id, job.state);
      }),
      catchError((error: Job) => {
        this.getReplicationTasks();
        this.dialogService.error(this.errorHandler.parseJobError(error));
        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  restore(row: ReplicationTaskUi): void {
    const dialog = this.matDialog.open(ReplicationRestoreDialogComponent, {
      data: row.id,
    });
    dialog.afterClosed().pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => this.getReplicationTasks());
  }

  downloadKeys(row: ReplicationTaskUi): void {
    this.ws.call('core.download', [
      'pool.dataset.export_keys_for_replication',
      [row.id],
      `${row.name}_encryption_keys.json`,
    ]).pipe(untilDestroyed(this)).subscribe({
      next: ([, url]) => {
        const mimetype = 'application/json';
        this.storage.streamDownloadFile(
          url,
          `${row.name}_encryption_keys.json`,
          mimetype,
        ).pipe(untilDestroyed(this)).subscribe({
          next: (file) => {
            this.storage.downloadBlob(file, `${row.name}_encryption_keys.json`);
          },
          error: (err: HttpErrorResponse) => {
            this.dialogService.error(this.errorHandler.parseHttpError(err));
          },
        });
      },
      error: (err) => {
        this.dialogService.error(this.errorHandler.parseWsError(err));
      },
    });
  }

  private transformReplicationTasks(replicationTasks: ReplicationTaskUi[]): ReplicationTaskUi[] {
    const tasks: ReplicationTaskUi[] = [];

    replicationTasks.forEach((task) => {
      if (task.state?.datetime?.$date) {
        task.last_run = formatDistanceToNow(task.state.datetime.$date, { addSuffix: true });
      } else {
        task.last_run = this.translate.instant('N/A');
      }
      task.task_last_snapshot = task.state.last_snapshot
        ? task.state.last_snapshot
        : this.translate.instant(helptext.no_snapshot_sent_yet);

      if (task.job !== null) {
        this.store$.select(selectJob(task.job.id)).pipe(
          filter(Boolean),
          untilDestroyed(this),
        ).subscribe((job: Job) => {
          task.job = job;
          this.jobStates.set(job.id, job.state);
        });
      }
      tasks.push(task);
    });
    return tasks;
  }

  private onChangeEnabledState(replicationTask: ReplicationTaskUi): void {
    this.ws
      .call('replication.update', [replicationTask.id, { enabled: !replicationTask.enabled }])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.getReplicationTasks();
        },
        error: (err: WebsocketError) => {
          this.getReplicationTasks();
          this.dialogService.error(this.errorHandler.parseWsError(err));
        },
      });
  }
}
