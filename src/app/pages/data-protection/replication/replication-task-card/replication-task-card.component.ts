import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, OnInit, inject,
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
  catchError, EMPTY, filter, of, switchMap, tap,
} from 'rxjs';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { tapOnce } from 'app/helpers/operators/tap-once.operator';
import { Job } from 'app/interfaces/job.interface';
import { ReplicationTask } from 'app/interfaces/replication-task.interface';
import { CardAlertBadgeComponent } from 'app/modules/alerts/components/card-alert-badge/card-alert-badge.component';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { IxTablePagerShowMoreComponent } from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { convertStringToId, mapTnSortToTableSort } from 'app/modules/ix-table/utils';
import { JobSlice } from 'app/modules/jobs/store/job.selectors';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
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
import { TaskCardJobRepainter } from 'app/pages/data-protection/utils/task-card-job-repainter';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-replication-task-card',
  templateUrl: './replication-task-card.component.html',
  styleUrls: ['./replication-task-card.component.scss'],
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
    TranslateModule,
    AsyncPipe,
    TnEmptyComponent,
    CardAlertBadgeComponent,
    TableToggleCellComponent,
    TableActionsCellComponent,
    TaskStateCellComponent,
  ],
})
export class ReplicationTaskCardComponent implements OnInit {
  private slideIn = inject(SlideIn);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private snackbar = inject(SnackbarService);
  private matDialog = inject(MatDialog);
  private download = inject(DownloadService);
  protected emptyService = inject(EmptyService);
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);
  private store$ = inject<Store<JobSlice>>(Store);

  dataProvider: AsyncDataProvider<ReplicationTask>;
  private replicationTasks: ReplicationTask[] = [];
  private jobs = new TaskCardJobRepainter<ReplicationTask>(
    this.store$,
    () => this.replicationTasks,
    (rows) => {
      this.replicationTasks = rows;
      this.dataProvider.setRows(rows);
    },
    (row, job) => ({ ...row, job, state: { state: job.state } }),
  );

  protected readonly requiredRoles = [Role.ReplicationTaskWrite, Role.ReplicationTaskWritePull];
  protected readonly cardMenuPath = ['data-protection', 'replication'];

  private hasAddRole = toSignal(this.authService.hasRole(this.requiredRoles), { initialValue: false });

  protected addAction = computed<TnCardAction | undefined>(() => {
    if (!this.hasAddRole()) {
      return undefined;
    }
    return {
      label: this.translate.instant('Add'),
      testId: 'replication-task-add',
      handler: () => this.addReplicationTask(),
    };
  });

  protected readonly displayedColumns = ['name', 'state', 'enabled', 'actions'];

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

  protected readonly trackByTaskId = (_index: number, row: ReplicationTask): number => row.id;

  protected uniqueRowTag(row: ReplicationTask): string {
    return convertStringToId('replication-task-' + row.name);
  }

  protected ariaLabel(row: ReplicationTask): string {
    return [row.name, this.translate.instant('Replication Task')].join(' ');
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToTableSort<ReplicationTask>(event, this.displayedColumns));
  }

  private setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 0,
      direction: SortDirection.Asc,
      propertyName: 'name',
    });
  }

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => this.jobs.destroy());
    const replicationTasks$ = this.api.call('replication.query', [[], {
      extra: { check_dataset_encryption_keys: true },
    }]).pipe(
      // Publish the rows before watching: the job store emits synchronously on
      // subscribe, so the first repaint can fire before `watch` returns and must
      // see the freshly-loaded rows.
      tap((replicationTasks) => this.replicationTasks = replicationTasks),
      tap((replicationTasks) => this.jobs.watch(replicationTasks)),
      takeUntilDestroyed(this.destroyRef),
    );
    this.dataProvider = new AsyncDataProvider<ReplicationTask>(replicationTasks$);
    this.setDefaultSort();
    this.getReplicationTasks();
  }

  private getReplicationTasks(): void {
    this.dataProvider.load();
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
    ).subscribe(() => this.getReplicationTasks());
  }

  protected addReplicationTask(): void {
    this.slideIn.open(ReplicationWizardComponent, { wide: true })
      .onSuccess(() => this.getReplicationTasks(), this.destroyRef);
  }

  private editReplicationTask(row: ReplicationTask): void {
    this.slideIn.open(ReplicationFormComponent, { wide: true, data: row })
      .onSuccess(() => this.getReplicationTasks(), this.destroyRef);
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
        this.getReplicationTasks();
        this.errorHandler.showErrorModal(error);
        return EMPTY;
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((job: Job) => {
      this.updateRowStateAndJob(row, job.state, job);
      this.jobs.reconcile(job, () => this.getReplicationTasks());
    });
  }

  protected restore(row: ReplicationTask): void {
    const dialog = this.matDialog.open(ReplicationRestoreDialog, {
      data: row.id,
    });
    dialog.afterClosed()
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.getReplicationTasks());
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

  protected onChangeEnabledState(replicationTask: ReplicationTask): void {
    this.api
      .call('replication.update', [replicationTask.id, { enabled: !replicationTask.enabled }])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.getReplicationTasks();
        },
        error: (error: unknown) => {
          this.getReplicationTasks();
          this.errorHandler.showErrorModal(error);
        },
      });
  }

  private updateRowStateAndJob(row: ReplicationTask, state: JobState, job: Job | null): void {
    this.replicationTasks = this.replicationTasks.map((task) => {
      if (task.id === row.id) {
        return {
          ...task,
          state: { state },
          job,
        };
      }
      return task;
    });
    this.dataProvider.setRows(this.replicationTasks);
  }
}
