import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, OnInit, signal, inject,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
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
  filter, of, switchMap, tap,
} from 'rxjs';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { tapOnce } from 'app/helpers/operators/tap-once.operator';
import { WINDOW } from 'app/helpers/window.helper';
import { CloudBackup } from 'app/interfaces/cloud-backup.interface';
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
import { CloudBackupFormComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-form/cloud-backup-form.component';
import {
  TaskStateCellComponent,
} from 'app/pages/data-protection/components/task-state-cell/task-state-cell.component';
import { replicationListElements } from 'app/pages/data-protection/replication/replication-list/replication-list.elements';
import { TaskCardJobRepainter } from 'app/pages/data-protection/utils/task-card-job-repainter';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-cloud-backup-card',
  templateUrl: './cloud-backup-card.component.html',
  styleUrl: './cloud-backup-card.component.scss',
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
export class CloudBackupCardComponent implements OnInit {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private slideIn = inject(SlideIn);
  private dialogService = inject(DialogService);
  private errorHandler = inject(ErrorHandlerService);
  private snackbar = inject(SnackbarService);
  private router = inject(Router);
  protected emptyService = inject(EmptyService);
  private window = inject<Window>(WINDOW);
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);
  private store$ = inject<Store<JobSlice>>(Store);

  private cloudBackups: CloudBackup[] = [];
  private jobs = new TaskCardJobRepainter<CloudBackup>(
    this.store$,
    () => this.cloudBackups,
    (rows) => {
      this.cloudBackups = rows;
      this.dataProvider.setRows(rows);
    },
    (row, job) => ({ ...row, job }),
  );

  dataProvider: AsyncDataProvider<CloudBackup>;
  protected readonly requiredRoles = [Role.CloudBackupWrite];
  protected readonly searchableElements = replicationListElements;
  protected readonly cardMenuPath = ['data-protection', 'cloud-backup'];
  updatedCount = signal(0);

  private hasAddRole = toSignal(this.authService.hasRole(this.requiredRoles), { initialValue: false });

  protected addAction = computed<TnCardAction | undefined>(() => {
    if (!this.hasAddRole()) {
      return undefined;
    }
    return {
      label: this.translate.instant('Add'),
      testId: 'cloud-backup-add',
      handler: () => this.openForm(),
    };
  });

  protected readonly displayedColumns = ['description', 'state', 'enabled', 'actions'];

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

  protected readonly trackByTaskId = (_index: number, row: CloudBackup): number => row.id;

  protected uniqueRowTag(row: CloudBackup): string {
    return convertStringToId('cloud-backup-' + row.description);
  }

  protected ariaLabel(row: CloudBackup): string {
    return [row.description, this.translate.instant('Cloud Backup')].join(' ');
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToTableSort<CloudBackup>(event, this.displayedColumns));
  }

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => this.jobs.destroy());
    const cloudBackups$ = this.api.call('cloud_backup.query').pipe(
      // Publish the rows before watching: the job store emits synchronously on
      // subscribe, so the first repaint can fire before `watch` returns and must
      // see the freshly-loaded rows.
      tap((cloudBackups) => this.cloudBackups = cloudBackups),
      tap((cloudBackups) => this.jobs.watch(cloudBackups)),
      takeUntilDestroyed(this.destroyRef),
    );
    this.dataProvider = new AsyncDataProvider<CloudBackup>(cloudBackups$);
    this.setDefaultSort();
    this.getCloudBackups();
  }

  private setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 0,
      direction: SortDirection.Asc,
      propertyName: 'description',
    });
  }

  private getCloudBackups(): void {
    this.dataProvider.load();
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
        this.getCloudBackups();
      },
    });
  }

  protected openForm(row?: CloudBackup): void {
    this.slideIn.open(CloudBackupFormComponent, { data: row, wide: true })
      .onSuccess(() => this.getCloudBackups(), this.destroyRef);
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
    ).subscribe(() => this.getCloudBackups());
  }

  protected onChangeEnabledState(cloudBackup: CloudBackup): void {
    this.updatedCount.update((count) => count + 1);
    this.api
      .call('cloud_backup.update', [cloudBackup.id, { enabled: !cloudBackup.enabled }])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.updatedCount.update((count) => count - 1);
          if (!this.updatedCount()) {
            this.getCloudBackups();
          }
        },
        error: (error: unknown) => {
          this.updatedCount.update((count) => count - 1);
          if (!this.updatedCount()) {
            this.getCloudBackups();
          }
          this.errorHandler.showErrorModal(error);
        },
      });
  }

  private updateRowJob(row: CloudBackup, job: Job): void {
    this.jobs.repaintRow(row.id, (task) => ({ ...task, job }));
  }
}
