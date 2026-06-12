import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, DestroyRef, OnInit, inject,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  tnIconMarker,
  TnCardComponent,
  TnCardHeaderDirective,
  TnCellDefDirective,
  TnEmptyComponent,
  TnHeaderCellDefDirective,
  TnIconComponent,
  TnTableColumnDirective,
  TnTableComponent,
  TnTestIdDirective,
  TnTooltipDirective,
  type TnCardAction,
  type TnSortEvent,
} from '@truenas/ui-components';
import {
  EMPTY, catchError, filter, map, of, switchMap, tap,
} from 'rxjs';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { tapOnce } from 'app/helpers/operators/tap-once.operator';
import { helptextCloudSync } from 'app/helptext/data-protection/cloudsync/cloudsync';
import { CloudSyncTaskUi } from 'app/interfaces/cloud-sync-task.interface';
import { Job } from 'app/interfaces/job.interface';
import { CardAlertBadgeComponent } from 'app/modules/alerts/components/card-alert-badge/card-alert-badge.component';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { IxTablePagerShowMoreComponent } from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { convertStringToId, mapTnSortToTableSort } from 'app/modules/ix-table/utils';
import { selectJob } from 'app/modules/jobs/store/job.selectors';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { CloudSyncFormComponent } from 'app/pages/data-protection/cloudsync/cloudsync-form/cloudsync-form.component';
import { CloudSyncRestoreDialog } from 'app/pages/data-protection/cloudsync/cloudsync-restore-dialog/cloudsync-restore-dialog.component';
import { CloudSyncWizardComponent } from 'app/pages/data-protection/cloudsync/cloudsync-wizard/cloudsync-wizard.component';
import { CloudSyncDataTransformer } from 'app/pages/data-protection/cloudsync/utils/cloudsync-data-transformer';
import {
  TaskStateCellComponent,
} from 'app/pages/data-protection/components/task-state-cell/task-state-cell.component';
import {
  ShareActionsCellComponent,
} from 'app/pages/sharing/components/shares-dashboard/cells/share-actions-cell/share-actions-cell.component';
import {
  ShareToggleCellComponent,
} from 'app/pages/sharing/components/shares-dashboard/cells/share-toggle-cell/share-toggle-cell.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { TaskService } from 'app/services/task.service';
import { AppState } from 'app/store';

@Component({
  selector: 'ix-cloudsync-task-card',
  templateUrl: './cloudsync-task-card.component.html',
  styleUrls: ['./cloudsync-task-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardHeaderDirective,
    TnTestIdDirective,
    RouterLink,
    TnIconComponent,
    TnTooltipDirective,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    IxTablePagerShowMoreComponent,
    ShareToggleCellComponent,
    ShareActionsCellComponent,
    TaskStateCellComponent,
    TranslateModule,
    AsyncPipe,
    TnEmptyComponent,
    CardAlertBadgeComponent,
  ],
})
export class CloudSyncTaskCardComponent implements OnInit {
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private slideIn = inject(SlideIn);
  private cdr = inject(ChangeDetectorRef);
  private taskService = inject(TaskService);
  private store$ = inject<Store<AppState>>(Store);
  private snackbar = inject(SnackbarService);
  private matDialog = inject(MatDialog);
  protected emptyService = inject(EmptyService);
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);

  protected readonly requiredRoles = [Role.CloudSyncWrite];
  protected readonly cardMenuPath = ['data-protection', 'cloudsync'];

  private cloudSyncTasks: CloudSyncTaskUi[] = [];
  dataProvider: AsyncDataProvider<CloudSyncTaskUi>;
  jobStates = new Map<number, JobState>();

  private hasAddRole = toSignal(this.authService.hasRole(this.requiredRoles), { initialValue: false });

  protected addAction = computed<TnCardAction | undefined>(() => {
    if (!this.hasAddRole()) {
      return undefined;
    }
    return {
      label: this.translate.instant('Add'),
      testId: 'cloudsync-task-add',
      handler: () => this.onAdd(),
    };
  });

  protected readonly displayedColumns = ['description', 'state', 'enabled', 'actions'];

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

  protected readonly trackByTaskId = (_index: number, row: CloudSyncTaskUi): number => row.id;

  protected uniqueRowTag(row: CloudSyncTaskUi): string {
    return convertStringToId('card-cloudsync-task-' + row.description);
  }

  protected ariaLabel(row: CloudSyncTaskUi): string {
    return [row.description, this.translate.instant('Cloud Sync Task')].join(' ');
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToTableSort<CloudSyncTaskUi>(event, this.displayedColumns));
  }

  private setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 0,
      direction: SortDirection.Asc,
      propertyName: 'description',
    });
  }

  ngOnInit(): void {
    const cloudSyncTasks$ = this.api.call('cloudsync.query').pipe(
      map((cloudSyncTasks) => CloudSyncDataTransformer.transformTasks(
        cloudSyncTasks,
        this.taskService,
        this.translate,
      )),
      tap((cloudSyncTasks) => this.setupJobSubscriptions(cloudSyncTasks)),
      tap((cloudSyncTasks) => this.cloudSyncTasks = cloudSyncTasks),
      takeUntilDestroyed(this.destroyRef),
    );
    this.dataProvider = new AsyncDataProvider<CloudSyncTaskUi>(cloudSyncTasks$);
    this.setDefaultSort();
    this.getCloudSyncTasks();
  }

  private setupJobSubscriptions(cloudSyncTasks: CloudSyncTaskUi[]): void {
    cloudSyncTasks.forEach((transformed) => {
      if (transformed.job) {
        this.store$.select(selectJob(transformed.job.id)).pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
          .subscribe((job: Job) => {
            transformed.job = { ...job };
            transformed.state = { state: job.state };
            this.jobStates.set(job.id, job.state);
          });
      }
    });
  }

  private getCloudSyncTasks(): void {
    this.dataProvider.load();
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
    ).subscribe(() => this.getCloudSyncTasks());
  }

  protected onAdd(): void {
    this.slideIn.open(CloudSyncWizardComponent, { wide: true })
      .onSuccess(() => this.getCloudSyncTasks(), this.destroyRef);
  }

  protected onEdit(row?: CloudSyncTaskUi): void {
    this.slideIn.open(CloudSyncFormComponent, { wide: true, data: row })
      .onSuccess(() => this.getCloudSyncTasks(), this.destroyRef);
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
        this.getCloudSyncTasks();
        this.errorHandler.showErrorModal(error);
        return EMPTY;
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((job: Job) => {
      if (job.state === JobState.Success) {
        this.snackbar.success(this.translate.instant('Cloud Sync Task «{name}» completed successfully.', { name: row.description }));
      }
      this.updateRowStateAndJob(row, job.state, job);
      if (this.jobStates.get(job.id) !== job.state) {
        this.getCloudSyncTasks();
      }
      this.jobStates.set(job.id, job.state);
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
        this.cdr.markForCheck();
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
      if (this.jobStates.get(job.id) !== job.state) {
        this.getCloudSyncTasks();
      }
      this.jobStates.set(job.id, job.state);
    });
  }

  protected restore(row: CloudSyncTaskUi): void {
    this.matDialog
      .open(CloudSyncRestoreDialog, { data: row.id })
      .afterClosed()
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.snackbar.success(
          this.translate.instant('Cloud Sync «{name}» has been restored.', { name: row.description }),
        );
        this.getCloudSyncTasks();
      });
  }

  protected onChangeEnabledState(cloudsyncTask: CloudSyncTaskUi): void {
    this.api
      .call('cloudsync.update', [cloudsyncTask.id, { enabled: !cloudsyncTask.enabled }])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.getCloudSyncTasks();
        },
        error: (error: unknown) => {
          this.getCloudSyncTasks();
          this.errorHandler.showErrorModal(error);
        },
      });
  }

  private updateRowStateAndJob(row: CloudSyncTaskUi, state: JobState, job: Job | null): void {
    this.dataProvider.setRows(this.cloudSyncTasks.map((task) => {
      if (task.id === row.id) {
        return {
          ...task,
          state: { state },
          job,
        };
      }
      return task;
    }));
  }
}
