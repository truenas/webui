import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, inject,
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
  EMPTY, Observable, catchError, filter, map, of, switchMap, tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { tapOnce } from 'app/helpers/operators/tap-once.operator';
import { helptextCloudSync } from 'app/helptext/data-protection/cloudsync/cloudsync';
import { CloudSyncTaskUi } from 'app/interfaces/cloud-sync-task.interface';
import { Job } from 'app/interfaces/job.interface';
import { CardAlertBadgeComponent } from 'app/modules/alerts/components/card-alert-badge/card-alert-badge.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { IxTablePagerShowMoreComponent } from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { convertStringToId } from 'app/modules/ix-table/utils';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  TableActionsCellComponent,
} from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import {
  TableToggleCellComponent,
} from 'app/modules/tn-table-cells/toggle-cell/table-toggle-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { CloudSyncFormComponent } from 'app/pages/data-protection/cloudsync/cloudsync-form/cloudsync-form.component';
import { CloudSyncRestoreDialog } from 'app/pages/data-protection/cloudsync/cloudsync-restore-dialog/cloudsync-restore-dialog.component';
import { CloudSyncWizardComponent } from 'app/pages/data-protection/cloudsync/cloudsync-wizard/cloudsync-wizard.component';
import { CloudSyncDataTransformer } from 'app/pages/data-protection/cloudsync/utils/cloudsync-data-transformer';
import {
  TaskStateCellComponent,
} from 'app/pages/data-protection/components/task-state-cell/task-state-cell.component';
import { JobTaskCardBase } from 'app/pages/data-protection/utils/job-task-card-base.directive';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { TaskService } from 'app/services/task.service';

@Component({
  selector: 'ix-cloudsync-task-card',
  templateUrl: './cloudsync-task-card.component.html',
  styleUrls: ['./cloudsync-task-card.component.scss'],
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
    TableToggleCellComponent,
    TableActionsCellComponent,
    TaskStateCellComponent,
    TranslateModule,
    AsyncPipe,
    TnEmptyComponent,
    CardAlertBadgeComponent,
  ],
})
export class CloudSyncTaskCardComponent extends JobTaskCardBase<CloudSyncTaskUi> {
  private errorHandler = inject(ErrorHandlerService);
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private slideIn = inject(SlideIn);
  private taskService = inject(TaskService);
  private snackbar = inject(SnackbarService);
  private tnDialog = inject(TnDialog);
  protected emptyService = inject(EmptyService);

  protected readonly requiredRoles = [Role.CloudSyncWrite];
  protected readonly cardMenuPath = ['data-protection', 'cloudsync'];
  protected readonly displayedColumns = ['description', 'state', 'enabled', 'actions'];
  protected readonly defaultSortProperty = 'description';
  protected readonly addTestId = 'cloudsync-task-add';

  protected readonly actions: IconActionConfig<CloudSyncTaskUi>[] = [
    {
      iconName: tnIconMarker('pencil', 'mdi'),
      tooltip: this.translate.instant('Edit'),
      onClick: (row) => this.onEdit(row),
    },
    {
      iconName: tnIconMarker('play-circle', 'mdi'),
      tooltip: this.translate.instant('Run job'),
      hidden: (row) => of(row.job?.state === JobState.Running),
      onClick: (row) => this.runNow(row),
      requiredRoles: this.requiredRoles,
    },
    {
      iconName: tnIconMarker('stop-circle', 'mdi'),
      tooltip: this.translate.instant('Stop'),
      hidden: (row) => of(row.job?.state !== JobState.Running),
      onClick: (row) => this.stopCloudSyncTask(row),
      requiredRoles: this.requiredRoles,
    },
    {
      iconName: tnIconMarker('sync', 'mdi'),
      tooltip: this.translate.instant('Dry Run'),
      onClick: (row) => this.dryRun(row),
      requiredRoles: this.requiredRoles,
    },
    {
      iconName: tnIconMarker('restore', 'mdi'),
      tooltip: this.translate.instant('Restore'),
      onClick: (row) => this.restore(row),
      requiredRoles: this.requiredRoles,
    },
    {
      iconName: tnIconMarker('delete', 'mdi'),
      tooltip: this.translate.instant('Delete'),
      onClick: (row) => this.doDelete(row),
      requiredRoles: this.requiredRoles,
    },
  ];

  protected uniqueRowTag(row: CloudSyncTaskUi): string {
    return convertStringToId('card-cloudsync-task-' + row.description);
  }

  protected ariaLabel(row: CloudSyncTaskUi): string {
    return [row.description, this.translate.instant('Cloud Sync Task')].join(' ');
  }

  protected queryTasks(): Observable<CloudSyncTaskUi[]> {
    return this.api.call('cloudsync.query').pipe(
      map((cloudSyncTasks) => CloudSyncDataTransformer.transformTasks(
        cloudSyncTasks,
        this.taskService,
        this.translate,
      )),
    );
  }

  protected mergeJob(row: CloudSyncTaskUi, job: Job): CloudSyncTaskUi {
    return { ...row, job, state: { state: job.state } };
  }

  protected doDelete(cloudsyncTask: CloudSyncTaskUi): void {
    this.dialogService.confirmDelete({
      title: this.translate.instant('Confirmation'),
      message: this.translate.instant('Delete Cloud Sync Task <b>"{name}"</b>?', {
        name: cloudsyncTask.description,
      }),
      call: () => this.api.call('cloudsync.delete', [cloudsyncTask.id]),
      successMessage: this.translate.instant('Cloud Sync Task «{name}» deleted.', { name: cloudsyncTask.description }),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.reload());
  }

  protected onAdd(): void {
    this.slideIn.open(CloudSyncWizardComponent, { wide: true })
      .onSuccess(() => this.reload(), this.destroyRef);
  }

  protected onEdit(row?: CloudSyncTaskUi): void {
    this.slideIn.open(CloudSyncFormComponent, { wide: true, data: row })
      .onSuccess(() => this.reload(), this.destroyRef);
  }

  protected runNow(row: CloudSyncTaskUi): void {
    this.dialogService.confirm({
      title: this.translate.instant('Run Now'),
      message: this.translate.instant('Run «{name}» Cloud Sync Task now?', { name: row.description }),
      hideCheckbox: true,
    }).pipe(
      filter(Boolean),
      tap(() => this.updateRowStateAndJob(row, JobState.Running, row.job)),
      switchMap(() => this.api.job('cloudsync.sync', [row.id])),
      tapOnce(() => this.snackbar.success(
        this.translate.instant('Cloud Sync Task «{name}» has started.', { name: row.description }),
      )),
      catchError((error: unknown) => {
        this.reload();
        this.errorHandler.showErrorModal(error);
        return EMPTY;
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((job: Job) => {
      if (job.state === JobState.Success) {
        this.snackbar.success(this.translate.instant('Cloud Sync Task «{name}» completed successfully.', { name: row.description }));
      }
      this.updateRowStateAndJob(row, job.state, job);
      this.jobs.reconcile(job, () => this.reload());
    });
  }

  protected stopCloudSyncTask(row: CloudSyncTaskUi): void {
    this.dialogService
      .confirm({
        title: this.translate.instant('Stop'),
        message: this.translate.instant('Stop this Cloud Sync?'),
        hideCheckbox: true,
      })
      .pipe(
        filter(Boolean),
        switchMap(() => {
          return this.api.call('cloudsync.abort', [row.id]).pipe(
            this.errorHandler.withErrorHandler(),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Cloud Sync «{name}» stopped.', { name: row.description }));
        this.updateRowStateAndJob(row, JobState.Aborted, null);
      });
  }

  protected dryRun(row: CloudSyncTaskUi): void {
    this.dialogService.confirm({
      title: this.translate.instant(helptextCloudSync.dryRunTitle),
      message: this.translate.instant(helptextCloudSync.dryRunDialog),
      hideCheckbox: true,
    }).pipe(
      filter(Boolean),
      switchMap(() => this.api.job('cloudsync.sync', [row.id, { dry_run: true }])),
      tapOnce(() => this.snackbar.success(
        this.translate.instant('Cloud Sync Task «{name}» has started.', { name: row.description }),
      )),
      catchError((error: unknown) => {
        this.errorHandler.showErrorModal(error);
        return EMPTY;
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((job: Job) => {
      if (job.state === JobState.Success) {
        this.snackbar.success(this.translate.instant('Cloud Sync Task «{name}» dry run completed successfully.', { name: row.description }));
      }
      this.updateRowStateAndJob(row, job.state, job);
      this.jobs.reconcile(job, () => this.reload());
    });
  }

  protected restore(row: CloudSyncTaskUi): void {
    this.tnDialog
      .open(CloudSyncRestoreDialog, { data: row.id })
      .closed
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.snackbar.success(
          this.translate.instant('Cloud Sync «{name}» has been restored.', { name: row.description }),
        );
        this.reload();
      });
  }

  protected onChangeEnabledState(cloudsyncTask: CloudSyncTaskUi): void {
    this.api
      .call('cloudsync.update', [cloudsyncTask.id, { enabled: !cloudsyncTask.enabled }])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.reload();
        },
        error: (error: unknown) => {
          this.reload();
          this.errorHandler.showErrorModal(error);
        },
      });
  }

  private updateRowStateAndJob(row: CloudSyncTaskUi, state: JobState, job: Job | null): void {
    this.jobs.repaintRow(row.id, (task) => ({ ...task, state: { state }, job }));
  }
}
