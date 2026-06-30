import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, Type, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  tnIconMarker,
  TnButtonComponent,
  TnCardComponent,
  TnCardFooterActionsDirective,
  TnCardHeaderDirective,
  TnCellDefDirective,
  TnEmptyComponent,
  TnHeaderCellDefDirective,
  TnIconComponent,
  TnTableColumnDirective,
  TnTableComponent,
  TnTestIdDirective,
  TnTooltipDirective,
  TnDialog,
} from '@truenas/ui-components';
import {
  catchError, EMPTY, Observable, filter, of, switchMap, tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { tapOnce } from 'app/helpers/operators/tap-once.operator';
import { Job } from 'app/interfaces/job.interface';
import { ReplicationTask } from 'app/interfaces/replication-task.interface';
import { CardAlertBadgeComponent } from 'app/modules/alerts/components/card-alert-badge/card-alert-badge.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { IxTablePagerShowMoreComponent } from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { convertStringToId } from 'app/modules/ix-table/utils';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  TableActionsCellComponent,
} from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import {
  TableToggleCellComponent,
} from 'app/modules/tn-table-cells/toggle-cell/table-toggle-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  TaskStateCellComponent,
} from 'app/pages/data-protection/components/task-state-cell/task-state-cell.component';
import {
  ReplicationFormComponent,
} from 'app/pages/data-protection/replication/replication-form/replication-form.component';
import {
  ReplicationRestoreDialog,
} from 'app/pages/data-protection/replication/replication-restore-dialog/replication-restore-dialog.component';
import {
  ReplicationWizardComponent,
} from 'app/pages/data-protection/replication/replication-wizard/replication-wizard.component';
import { JobTaskCardBase } from 'app/pages/data-protection/utils/job-task-card-base.directive';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-replication-task-card',
  templateUrl: './replication-task-card.component.html',
  styleUrls: ['./replication-task-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnButtonComponent,
    TnCardComponent,
    TnCardFooterActionsDirective,
    TnCardHeaderDirective,
    RequiresRolesDirective,
    TnTestIdDirective,
    RouterLink,
    TnIconComponent,
    TnTooltipDirective,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    IxTablePagerShowMoreComponent,
    TranslateModule,
    AsyncPipe,
    TnEmptyComponent,
    CardAlertBadgeComponent,
    TableToggleCellComponent,
    TableActionsCellComponent,
    TaskStateCellComponent,
  ],
})
export class ReplicationTaskCardComponent extends JobTaskCardBase<ReplicationTask> {
  private formPanel = inject(FormSidePanelService);
  private errorHandler = inject(ErrorHandlerService);
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private snackbar = inject(SnackbarService);
  private tnDialog = inject(TnDialog);
  private download = inject(DownloadService);
  protected emptyService = inject(EmptyService);

  protected readonly requiredRoles = [Role.ReplicationTaskWrite, Role.ReplicationTaskWritePull];
  protected readonly cardMenuPath = ['data-protection', 'replication'];
  protected readonly displayedColumns = ['name', 'state', 'enabled', 'actions'];
  protected readonly defaultSortProperty = 'name';
  protected readonly addTestId = 'replication-task-add';

  protected readonly actions: IconActionConfig<ReplicationTask>[] = [
    {
      iconName: tnIconMarker('pencil', 'mdi'),
      tooltip: this.translate.instant('Edit'),
      onClick: (row) => this.editReplicationTask(row),
    },
    {
      iconName: tnIconMarker('play-circle', 'mdi'),
      tooltip: this.translate.instant('Run job'),
      hidden: (row) => of(row.job?.state === JobState.Running),
      onClick: (row) => this.runNow(row),
      requiredRoles: this.requiredRoles,
    },
    {
      iconName: tnIconMarker('restore', 'mdi'),
      tooltip: this.translate.instant('Restore'),
      onClick: (row) => this.restore(row),
      requiredRoles: this.requiredRoles,
    },
    {
      iconName: tnIconMarker('download', 'mdi'),
      tooltip: this.translate.instant('Download encryption keys'),
      hidden: (row) => of(!row.has_encrypted_dataset_keys),
      onClick: (row) => this.downloadKeys(row),
      requiredRoles: this.requiredRoles,
    },
    {
      iconName: tnIconMarker('delete', 'mdi'),
      tooltip: this.translate.instant('Delete'),
      onClick: (row) => this.doDelete(row),
      requiredRoles: this.requiredRoles,
    },
  ];

  protected uniqueRowTag(row: ReplicationTask): string {
    return convertStringToId('replication-task-' + row.name);
  }

  protected ariaLabel(row: ReplicationTask): string {
    return [row.name, this.translate.instant('Replication Task')].join(' ');
  }

  protected queryTasks(): Observable<ReplicationTask[]> {
    return this.api.call('replication.query', [[], {
      extra: { check_dataset_encryption_keys: true },
    }]);
  }

  protected mergeJob(row: ReplicationTask, job: Job): ReplicationTask {
    return { ...row, job, state: { state: job.state } };
  }

  protected doDelete(replicationTask: ReplicationTask): void {
    this.dialogService.confirmDelete({
      title: this.translate.instant('Confirmation'),
      message: this.translate.instant('Delete Replication Task <b>"{name}"</b>?', {
        name: replicationTask.name,
      }),
      call: () => this.api.call('replication.delete', [replicationTask.id]),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.reload());
  }

  protected onAdd(): void {
    this.formPanel.open(this.replicationWizard, {
      title: this.translate.instant('Replication Task Wizard'),
      wide: true,
      footerless: true,
    }).onSuccess(() => this.reload(), this.destroyRef);
  }

  // ReplicationFormComponent / ReplicationWizardComponent structurally provide the host surface
  // (closed/canSubmit/submit/hasUnsavedChanges/requiredRoles) the panel reads; cast past the
  // nominal base type.
  private readonly replicationForm = ReplicationFormComponent as unknown as Type<SidePanelForm>;
  private readonly replicationWizard = ReplicationWizardComponent as unknown as Type<SidePanelForm>;

  private editReplicationTask(row: ReplicationTask): void {
    this.formPanel.open(this.replicationForm, {
      title: this.translate.instant('Edit Replication Task'),
      wide: true,
      inputs: { replicationToEdit: row },
    }).onSuccess(() => this.reload(), this.destroyRef);
  }

  protected runNow(row: ReplicationTask): void {
    this.dialogService.confirm({
      title: this.translate.instant('Run Now'),
      message: this.translate.instant('Replicate «{name}» now?', { name: row.name }),
      hideCheckbox: true,
    }).pipe(
      filter(Boolean),
      tap(() => this.updateRowStateAndJob(row, JobState.Running, row.job)),
      switchMap(() => this.api.job('replication.run', [row.id])),
      tapOnce(() => {
        this.snackbar.success(
          this.translate.instant('Replication «{name}» has started.', { name: row.name }),
        );
      }),
      catchError((error: unknown) => {
        this.reload();
        this.errorHandler.showErrorModal(error);
        return EMPTY;
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((job: Job) => {
      this.updateRowStateAndJob(row, job.state, job);
      this.jobs.reconcile(job, () => this.reload());
    });
  }

  protected restore(row: ReplicationTask): void {
    const dialog = this.tnDialog.open(ReplicationRestoreDialog, {
      data: row.id,
    });
    dialog.closed
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.reload());
  }

  protected downloadKeys(row: ReplicationTask): void {
    this.download.coreDownload({
      method: 'pool.dataset.export_keys_for_replication',
      mimeType: 'application/json',
      arguments: [row.id],
      fileName: `${row.name}_encryption_keys.json`,
    })
      .pipe(
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe();
  }

  protected onChangeEnabledState(replicationTask: ReplicationTask, toggle: TableToggleCellComponent): void {
    this.api
      .call('replication.update', [replicationTask.id, { enabled: !replicationTask.enabled }])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.reload();
        },
        error: (error: unknown) => {
          toggle.revert();
          this.errorHandler.showErrorModal(error);
        },
      });
  }

  private updateRowStateAndJob(row: ReplicationTask, state: JobState, job: Job | null): void {
    this.jobs.repaintRow(row.id, (task) => ({ ...task, state: { state }, job }));
  }
}
