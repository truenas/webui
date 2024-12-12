import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatToolbarRow } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  catchError, EMPTY, filter, of, switchMap, tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { tapOnce } from 'app/helpers/operators/tap-once.operator';
import { ReplicationTask } from 'app/interfaces/replication-task.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
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
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { createTable } from 'app/modules/ix-table/utils';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  ReplicationFormComponent,
} from 'app/pages/data-protection/replication/replication-form/replication-form.component';
import {
  ReplicationRestoreDialogComponent,
} from 'app/pages/data-protection/replication/replication-restore-dialog/replication-restore-dialog.component';
import {
  ReplicationWizardComponent,
} from 'app/pages/data-protection/replication/replication-wizard/replication-wizard.component';
import { ChainedSlideInService } from 'app/services/chained-slide-in.service';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ApiService } from 'app/services/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-replication-task-card',
  templateUrl: './replication-task-card.component.html',
  styleUrls: ['./replication-task-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatToolbarRow,
    TestDirective,
    RouterLink,
    IxIconComponent,
    RequiresRolesDirective,
    MatButton,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    TranslateModule,
    AsyncPipe,
  ],
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
    private chainedSlideIn: ChainedSlideInService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private api: ApiService,
    private dialogService: DialogService,
    private snackbar: SnackbarService,
    private matDialog: MatDialog,
    private download: DownloadService,
    protected emptyService: EmptyService,
  ) {}

  ngOnInit(): void {
    const replicationTasks$ = this.api.call('replication.query', [[], {
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
      switchMap(() => this.api.call('replication.delete', [replicationTask.id])),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.getReplicationTasks();
      },
      error: (err: unknown) => {
        this.dialogService.error(this.errorHandler.parseError(err));
      },
    });
  }

  addReplicationTask(): void {
    const closer$ = this.chainedSlideIn.open(ReplicationWizardComponent, true);
    closer$.pipe(
      filter((response) => !!response.response),
      untilDestroyed(this),
    ).subscribe(() => this.getReplicationTasks());
  }

  editReplicationTask(row: ReplicationTask): void {
    const closer$ = this.chainedSlideIn.open(ReplicationFormComponent, true, row);

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
      switchMap(() => this.api.job('replication.run', [row.id])),
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
    this.api.call('core.download', [
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
          error: (err: unknown) => {
            this.dialogService.error(this.errorHandler.parseError(err));
          },
        });
      },
      error: (err: unknown) => {
        this.dialogService.error(this.errorHandler.parseError(err));
      },
    });
  }

  private onChangeEnabledState(replicationTask: ReplicationTask): void {
    this.api
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
