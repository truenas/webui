import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, OnInit, inject,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
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
  catchError, EMPTY, Subscription, filter, map, of, switchMap, tap,
} from 'rxjs';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { TaskState } from 'app/enums/task-state.enum';
import { tapOnce } from 'app/helpers/operators/tap-once.operator';
import { Job } from 'app/interfaces/job.interface';
import { RsyncTask, RsyncTaskUi } from 'app/interfaces/rsync-task.interface';
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
import {
  TaskStateCellComponent,
} from 'app/pages/data-protection/components/task-state-cell/task-state-cell.component';
import { RsyncTaskFormComponent } from 'app/pages/data-protection/rsync-task/rsync-task-form/rsync-task-form.component';
import {
  ShareActionsCellComponent,
} from 'app/pages/sharing/components/shares-dashboard/cells/share-actions-cell/share-actions-cell.component';
import {
  ShareToggleCellComponent,
} from 'app/pages/sharing/components/shares-dashboard/cells/share-toggle-cell/share-toggle-cell.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { AppState } from 'app/store';

@Component({
  selector: 'ix-rsync-task-card',
  templateUrl: './rsync-task-card.component.html',
  styleUrls: ['./rsync-task-card.component.scss'],
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
    ShareToggleCellComponent,
    ShareActionsCellComponent,
    TaskStateCellComponent,
  ],
})
export class RsyncTaskCardComponent implements OnInit {
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private store$ = inject<Store<AppState>>(Store);
  private snackbar = inject(SnackbarService);
  protected emptyService = inject(EmptyService);
  private slideIn = inject(SlideIn);
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);

  protected readonly requiredRoles = [Role.SnapshotTaskWrite];
  protected readonly cardMenuPath = ['data-protection', 'rsync'];

  private hasAddRole = toSignal(this.authService.hasRole(this.requiredRoles), { initialValue: false });

  protected addAction = computed<TnCardAction | undefined>(() => {
    if (!this.hasAddRole()) {
      return undefined;
    }
    return {
      label: this.translate.instant('Add'),
      testId: 'rsync-task-add',
      handler: () => this.openForm(),
    };
  });

  private rsyncTasks: RsyncTaskUi[] = [];
  dataProvider: AsyncDataProvider<RsyncTaskUi>;
  private jobStates = new Map<number, JobState>();
  private jobSubscriptions = new Subscription();

  protected readonly displayedColumns = ['path', 'state', 'enabled', 'actions'];

  protected readonly actions: IconActionConfig<RsyncTaskUi>[] = [
    {
      iconName: tnIconMarker('pencil', 'mdi'),
      tooltip: this.translate.instant('Edit'),
      onClick: (row) => this.openForm(row),
    },
    {
      iconName: tnIconMarker('play-circle', 'mdi'),
      tooltip: this.translate.instant('Run job'),
      requiredRoles: this.requiredRoles,
      hidden: (row) => of(row.job?.state === JobState.Running),
      onClick: (row) => this.runNow(row),
    },
    {
      iconName: tnIconMarker('delete', 'mdi'),
      tooltip: this.translate.instant('Delete'),
      requiredRoles: this.requiredRoles,
      onClick: (row) => this.doDelete(row),
    },
  ];

  protected readonly trackByTaskId = (_index: number, row: RsyncTaskUi): number => row.id;

  protected uniqueRowTag(row: RsyncTaskUi): string {
    return convertStringToId('card-rsync-task-' + row.path + '-' + row.remotehost);
  }

  protected ariaLabel(row: RsyncTaskUi): string {
    return [row.path, row.remotehost, this.translate.instant('Rsync Task')].join(' ');
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToTableSort<RsyncTaskUi>(event, this.displayedColumns));
  }

  private setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 0,
      direction: SortDirection.Asc,
      propertyName: 'path',
    });
  }

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => this.jobSubscriptions.unsubscribe());
    const rsyncTasks$ = this.api.call('rsynctask.query').pipe(
      map((rsyncTasks: RsyncTaskUi[]) => this.transformRsyncTasks(rsyncTasks)),
      tap((rsyncTasks) => this.rsyncTasks = rsyncTasks),
      takeUntilDestroyed(this.destroyRef),
    );
    this.dataProvider = new AsyncDataProvider<RsyncTaskUi>(rsyncTasks$);
    this.setDefaultSort();
    this.getRsyncTasks();
  }

  private getRsyncTasks(): void {
    this.dataProvider.load();
  }

  doDelete(row: RsyncTaskUi): void {
    this.dialogService.confirmDelete({
      title: this.translate.instant('Confirmation'),
      message: this.translate.instant('Delete Rsync Task <b>"{name}"</b>?', {
        name: `${row.remotehost || row.path} ${row.remotemodule ? '- ' + row.remotemodule : ''}`,
      }),
      call: () => this.api.call('rsynctask.delete', [row.id]),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.getRsyncTasks();
    });
  }

  openForm(row?: RsyncTaskUi): void {
    this.slideIn.open(RsyncTaskFormComponent, { wide: true, data: row })
      .onSuccess(() => this.getRsyncTasks(), this.destroyRef);
  }

  runNow(row: RsyncTaskUi): void {
    this.dialogService.confirm({
      title: this.translate.instant('Run Now'),
      message: this.translate.instant('Run «{name}» Rsync now?', {
        name: `${row.remotehost || row.path} ${row.remotemodule ? '- ' + row.remotemodule : ''}`,
      }),
      hideCheckbox: true,
    }).pipe(
      filter(Boolean),
      tap(() => this.updateRowStateAndJob(row, JobState.Running, row.job)),
      switchMap(() => this.api.job('rsynctask.run', [row.id])),
      tapOnce(() => this.snackbar.success(
        this.translate.instant('Rsync task «{name}» has started.', {
          name: `${row.remotehost || row.path} ${row.remotemodule ? '- ' + row.remotemodule : ''}`,
        }),
      )),
      catchError((error: unknown) => {
        this.getRsyncTasks();
        this.errorHandler.showErrorModal(error);
        return EMPTY;
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((job: Job) => {
      this.updateRowStateAndJob(row, job.state, job);
      if (this.jobStates.get(job.id) !== job.state) {
        this.getRsyncTasks();
      }
      this.jobStates.set(job.id, job.state);
    });
  }

  private transformRsyncTasks(rsyncTasks: RsyncTaskUi[]): RsyncTaskUi[] {
    // Reloads re-run this transform, so drop the previous batch of job
    // subscriptions first to avoid leaking one per task on every reload.
    this.jobSubscriptions.unsubscribe();
    this.jobSubscriptions = new Subscription();
    return rsyncTasks.map((rsyncTask: RsyncTaskUi) => {
      // make sure we deep-copy `state` and `job` so we aren't overriding the originals
      // when we mutate `task`.
      const task: RsyncTaskUi = {
        ...rsyncTask,
        state: { ...rsyncTask.state },
        job: { ...rsyncTask.job },
      };
      if (task.job === null) {
        task.state = { state: task.locked ? TaskState.Locked : TaskState.Pending };
      } else {
        task.state = { state: task.job.state };
        // Watch the job store so the presentational status pill repaints on
        // background job progress.
        this.jobSubscriptions.add(
          this.store$.select(selectJob(task.job.id)).pipe(filter(Boolean))
            .subscribe((job: Job) => {
              this.jobStates.set(job.id, job.state);
              this.applyJobUpdate(job);
            }),
        );
      }

      return task;
    });
  }

  /**
   * Repaint the row for a background job update. The status pill is purely
   * presentational now, so an in-place mutation would not be picked up by
   * OnPush — push a fresh array through `setRows` like `runNow` already does.
   */
  private applyJobUpdate(job: Job): void {
    this.rsyncTasks = this.rsyncTasks.map((task) => {
      if (task.job?.id === job.id) {
        return { ...task, job, state: { state: job.state } };
      }
      return task;
    });
    this.dataProvider.setRows(this.rsyncTasks);
  }

  protected onChangeEnabledState(rsyncTask: RsyncTaskUi): void {
    this.api
      .call('rsynctask.update', [rsyncTask.id, { enabled: !rsyncTask.enabled }])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.getRsyncTasks();
        },
        error: (error: unknown) => {
          this.getRsyncTasks();
          this.errorHandler.showErrorModal(error);
        },
      });
  }

  private updateRowStateAndJob(row: RsyncTask, state: JobState, job: Job | null): void {
    this.rsyncTasks = this.rsyncTasks.map((task) => {
      if (task.id === row.id) {
        return {
          ...task,
          state: { state },
          job,
        };
      }
      return task;
    });
    this.dataProvider.setRows(this.rsyncTasks);
  }
}
