import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  catchError, EMPTY, filter, of, switchMap, tap,
} from 'rxjs';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { tapOnce } from 'app/helpers/operators/tap-once.operator';
import { ReplicationTask } from 'app/interfaces/replication-task.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import {
  actionsColumn,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import {
  relativeDateColumn,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-relative-date/ix-cell-relative-date.component';
import {
  stateButtonColumn,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-state-button/ix-cell-state-button.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import {
  toggleColumn,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-toggle/ix-cell-toggle.component';
import { createTable } from 'app/modules/ix-table/utils';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  ReplicationFormComponent,
} from 'app/pages/data-protection/replication/replication-form/replication-form.component';
import {
  ReplicationRestoreDialogComponent,
} from 'app/pages/data-protection/replication/replication-restore-dialog/replication-restore-dialog.component';
import {
  ReplicationWizardComponent,
} from 'app/pages/data-protection/replication/replication-wizard/replication-wizard.component';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-replication-task-card',
  templateUrl: './replication-task-card.component.html',
  styleUrls: ['./replication-task-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplicationTaskCardComponent implements OnInit {
  dataProvider: AsyncDataProvider<ReplicationTask>;
  jobStates = new Map<number, string>();
  readonly requiredRoles = [Role.ReplicationTaskWrite, Role.ReplicationTaskWritePull];

  columns = createTable<ReplicationTask>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
    }),
    textColumn({
      title: this.translate.instant('Last Snapshot'),
      getValue: (task) => {
        return task.state.last_snapshot
          ? task.state.last_snapshot
          : this.translate.instant('No snapshots sent yet');
      },
    }),
    toggleColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
      onRowToggle: (row: ReplicationTask) => this.onChangeEnabledState(row),
      requiredRoles: this.requiredRoles,
    }),
    stateButtonColumn({
      title: this.translate.instant('State'),
      getValue: (row) => row.state.state,
      getJob: (row) => row.job,
      cssClass: 'state-button',
    }),
    relativeDateColumn({
      title: this.translate.instant('Last Run'),
      getValue: (row) => row.state?.datetime?.$date,
    }),
    actionsColumn({
      cssClass: 'wide-actions',
      actions: [
        {
          iconName: iconMarker('edit'),
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.editReplicationTask(row),
        },
        {
          iconName: iconMarker('mdi-play-circle'),
          tooltip: this.translate.instant('Run job'),
          hidden: (row) => of(row.job?.state === JobState.Running),
          onClick: (row) => this.runNow(row),
          requiredRoles: this.requiredRoles,
        },
        {
          iconName: iconMarker('restore'),
          tooltip: this.translate.instant('Restore'),
          onClick: (row) => this.restore(row),
          requiredRoles: this.requiredRoles,
        },
        {
          iconName: iconMarker('mdi-download'),
          tooltip: this.translate.instant('Download encryption keys'),
          hidden: (row) => of(!row.has_encrypted_dataset_keys),
          onClick: (row) => this.downloadKeys(row),
          requiredRoles: this.requiredRoles,
        },
        {
          iconName: iconMarker('mdi-delete'),
          tooltip: this.translate.instant('Delete'),
          onClick: (row) => this.doDelete(row),
          requiredRoles: this.requiredRoles,
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => 'replication-task-' + row.name,
    ariaLabels: (row) => [row.name, this.translate.instant('Replication Task')],
  });

  constructor(
    private chainedSlideInService: IxChainedSlideInService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private ws: WebSocketService,
    private dialogService: DialogService,
    private snackbar: SnackbarService,
    private matDialog: MatDialog,
    private download: DownloadService,
    protected emptyService: EmptyService,
  ) {}

  ngOnInit(): void {
    const replicationTasks$ = this.ws.call('replication.query', [[], {
      extra: { check_dataset_encryption_keys: true },
    }]).pipe(untilDestroyed(this));
    this.dataProvider = new AsyncDataProvider<ReplicationTask>(replicationTasks$);
    this.getReplicationTasks();
  }

  getReplicationTasks(): void {
    this.dataProvider.load();
  }

  doDelete(replicationTask: ReplicationTask): void {
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
    const closer$ = this.chainedSlideInService.open(ReplicationWizardComponent, true);
    closer$.pipe(
      filter((response) => !!response.response),
      untilDestroyed(this),
    ).subscribe(() => this.getReplicationTasks());
  }

  editReplicationTask(row: ReplicationTask): void {
    const closer$ = this.chainedSlideInService.open(ReplicationFormComponent, true, row);

    closer$.pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.getReplicationTasks());
  }

  runNow(row: ReplicationTask): void {
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
      catchError((error: unknown) => {
        this.getReplicationTasks();
        this.dialogService.error(this.errorHandler.parseError(error));
        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  restore(row: ReplicationTask): void {
    const dialog = this.matDialog.open(ReplicationRestoreDialogComponent, {
      data: row.id,
    });
    dialog.afterClosed().pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => this.getReplicationTasks());
  }

  downloadKeys(row: ReplicationTask): void {
    this.ws.call('core.download', [
      'pool.dataset.export_keys_for_replication',
      [row.id],
      `${row.name}_encryption_keys.json`,
    ]).pipe(untilDestroyed(this)).subscribe({
      next: ([, url]) => {
        const mimetype = 'application/json';
        this.download.streamDownloadFile(
          url,
          `${row.name}_encryption_keys.json`,
          mimetype,
        ).pipe(untilDestroyed(this)).subscribe({
          next: (file) => {
            this.download.downloadBlob(file, `${row.name}_encryption_keys.json`);
          },
          error: (err: HttpErrorResponse) => {
            this.dialogService.error(this.errorHandler.parseHttpError(err));
          },
        });
      },
      error: (err) => {
        this.dialogService.error(this.errorHandler.parseError(err));
      },
    });
  }

  private onChangeEnabledState(replicationTask: ReplicationTask): void {
    this.ws
      .call('replication.update', [replicationTask.id, { enabled: !replicationTask.enabled }])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.getReplicationTasks();
        },
        error: (err: unknown) => {
          this.getReplicationTasks();
          this.dialogService.error(this.errorHandler.parseError(err));
        },
      });
  }
}
