import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, Type, signal, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
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
} from '@truenas/ui-components';
import {
  Observable, filter, of, switchMap, tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { tapOnce } from 'app/helpers/operators/tap-once.operator';
import { WINDOW } from 'app/helpers/window.helper';
import { CloudBackup } from 'app/interfaces/cloud-backup.interface';
import { Job } from 'app/interfaces/job.interface';
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
import { CloudBackupFormComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-form/cloud-backup-form.component';
import {
  TaskStateCellComponent,
} from 'app/pages/data-protection/components/task-state-cell/task-state-cell.component';
import { replicationListElements } from 'app/pages/data-protection/replication/replication-list/replication-list.elements';
import { JobTaskCardBase } from 'app/pages/data-protection/utils/job-task-card-base.directive';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-cloud-backup-card',
  templateUrl: './cloud-backup-card.component.html',
  styleUrl: './cloud-backup-card.component.scss',
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
export class CloudBackupCardComponent extends JobTaskCardBase<CloudBackup> {
  private api = inject(ApiService);
  private formPanel = inject(FormSidePanelService);
  private dialogService = inject(DialogService);
  private errorHandler = inject(ErrorHandlerService);
  private snackbar = inject(SnackbarService);
  private router = inject(Router);
  protected emptyService = inject(EmptyService);
  private window = inject<Window>(WINDOW);

  protected readonly requiredRoles = [Role.CloudBackupWrite];
  protected readonly searchableElements = replicationListElements;
  protected readonly cardMenuPath = ['data-protection', 'cloud-backup'];
  protected readonly displayedColumns = ['description', 'state', 'enabled', 'actions'];
  protected readonly defaultSortProperty = 'description';
  protected readonly addTestId = 'cloud-backup-add';
  updatedCount = signal(0);

  protected readonly actions: IconActionConfig<CloudBackup>[] = [
    {
      iconName: tnIconMarker('pencil', 'mdi'),
      tooltip: this.translate.instant('Edit'),
      onClick: (row) => this.openForm(row),
    },
    {
      iconName: tnIconMarker('play-circle', 'mdi'),
      tooltip: this.translate.instant('Run job'),
      hidden: (row) => of(row.job?.state === JobState.Running),
      onClick: (row) => this.runNow(row),
      requiredRoles: this.requiredRoles,
    },
    {
      iconName: tnIconMarker('eye', 'mdi'),
      tooltip: this.translate.instant('View Details'),
      onClick: (row) => this.router.navigate(['/data-protection', 'cloud-backup'], { fragment: row.id.toString() }),
      requiredRoles: this.requiredRoles,
    },
    {
      iconName: tnIconMarker('delete', 'mdi'),
      tooltip: this.translate.instant('Delete'),
      onClick: (row) => this.doDelete(row),
      requiredRoles: this.requiredRoles,
    },
  ];

  protected uniqueRowTag(row: CloudBackup): string {
    return convertStringToId('cloud-backup-' + row.description);
  }

  protected ariaLabel(row: CloudBackup): string {
    return [row.description, this.translate.instant('Cloud Backup')].join(' ');
  }

  protected queryTasks(): Observable<CloudBackup[]> {
    return this.api.call('cloud_backup.query');
  }

  protected mergeJob(row: CloudBackup, job: Job): CloudBackup {
    return { ...row, job };
  }

  protected runNow(row: CloudBackup): void {
    this.dialogService.confirm({
      title: this.translate.instant('Run Now'),
      message: this.translate.instant('Run «{name}» Cloud Backup Task now?', { name: row.description }),
      hideCheckbox: true,
    }).pipe(
      filter(Boolean),
      tap(() => this.updateRowJob(row, { ...row.job, state: JobState.Running })),
      tapOnce(() => {
        this.snackbar.success(this.translate.instant('Cloud Backup Task «{name}» has started.', { name: row.description }));
      }),
      switchMap(() => this.api.job('cloud_backup.sync', [row.id])),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (job: Job) => {
        if (job.state === JobState.Success) {
          this.snackbar.success(this.translate.instant('Cloud Backup Task «{name}» completed successfully.', { name: row.description }));
        }
        // Unlike the sibling cards, cloud backup intentionally does not
        // `jobs.reconcile(...)` to reload on completion — it mirrors
        // cloud-backup-list and relies on live `jobs.watch` → `selectJob`
        // updates flowing into the row instead of refetching the whole list.
        this.updateRowJob(row, job);
      },
      error: (error: unknown) => {
        this.errorHandler.showErrorModal(error);
        this.reload();
      },
    });
  }

  // CloudBackupFormComponent structurally provides the host surface (closed/canSubmit/submit/
  // hasUnsavedChanges/requiredRoles) the panel reads; cast past the nominal base type.
  private readonly cloudBackupForm = CloudBackupFormComponent as unknown as Type<SidePanelForm>;

  protected openForm(row?: CloudBackup): void {
    this.formPanel.open(this.cloudBackupForm, {
      title: row
        ? this.translate.instant('Edit TrueCloud Backup Task')
        : this.translate.instant('Add TrueCloud Backup Task'),
      wide: true,
      inputs: { backupToEdit: row },
    }).onSuccess(() => this.reload(), this.destroyRef);
  }

  protected onAdd(): void {
    this.openForm();
  }

  protected doDelete(row: CloudBackup): void {
    this.dialogService.confirmDelete({
      title: this.translate.instant('Confirmation'),
      message: this.translate.instant('Delete Cloud Backup Task <b>"{name}"</b>?', {
        name: row.description,
      }),
      call: () => this.api.call('cloud_backup.delete', [row.id]),
      successMessage: this.translate.instant('Cloud Backup Task «{name}» deleted.', { name: row.description }),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.reload());
  }

  protected onChangeEnabledState(cloudBackup: CloudBackup, toggle: TableToggleCellComponent): void {
    this.updatedCount.update((count) => count + 1);
    this.api
      .call('cloud_backup.update', [cloudBackup.id, { enabled: !cloudBackup.enabled }])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.updatedCount.update((count) => count - 1);
          if (!this.updatedCount()) {
            this.reload();
          }
        },
        error: (error: unknown) => {
          toggle.revert();
          this.updatedCount.update((count) => count - 1);
          if (!this.updatedCount()) {
            this.reload();
          }
          this.errorHandler.showErrorModal(error);
        },
      });
  }

  private updateRowJob(row: CloudBackup, job: Job): void {
    this.jobs.repaintRow(row.id, (task) => ({ ...task, job }));
  }
}
