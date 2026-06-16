import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
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
} from '@truenas/ui-components';
import {
  catchError, EMPTY, Observable, filter, map, of, switchMap, tap,
} from 'rxjs';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { TaskState } from 'app/enums/task-state.enum';
import { tapOnce } from 'app/helpers/operators/tap-once.operator';
import { Job } from 'app/interfaces/job.interface';
import { RsyncTaskUi } from 'app/interfaces/rsync-task.interface';
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
import {
  TaskStateCellComponent,
} from 'app/pages/data-protection/components/task-state-cell/task-state-cell.component';
import { RsyncTaskFormComponent } from 'app/pages/data-protection/rsync-task/rsync-task-form/rsync-task-form.component';
import { JobTaskCardBase } from 'app/pages/data-protection/utils/job-task-card-base.directive';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

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
    TableToggleCellComponent,
    TableActionsCellComponent,
    TaskStateCellComponent,
  ],
})
export class RsyncTaskCardComponent extends JobTaskCardBase<RsyncTaskUi> {
  private errorHandler = inject(ErrorHandlerService);
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private snackbar = inject(SnackbarService);
  protected emptyService = inject(EmptyService);
  private slideIn = inject(SlideIn);

  protected readonly requiredRoles = [Role.SnapshotTaskWrite];
  protected readonly cardMenuPath = ['data-protection', 'rsync'];
  protected readonly displayedColumns = ['path', 'state', 'enabled', 'actions'];
  protected readonly defaultSortProperty = 'path';
  protected readonly addTestId = 'rsync-task-add';

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

  protected uniqueRowTag(row: RsyncTaskUi): string {
    return convertStringToId('card-rsync-task-' + row.path + '-' + row.remotehost);
  }

  protected ariaLabel(row: RsyncTaskUi): string {
    return [row.path, row.remotehost, this.translate.instant('Rsync Task')].join(' ');
  }

  protected queryTasks(): Observable<RsyncTaskUi[]> {
    return this.api.call('rsynctask.query').pipe(
      map((rsyncTasks: RsyncTaskUi[]) => this.transformRsyncTasks(rsyncTasks)),
    );
  }

  protected mergeJob(row: RsyncTaskUi, job: Job): RsyncTaskUi {
    return { ...row, job, state: { state: job.state } };
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
      this.reload();
    });
  }

  protected onAdd(): void {
    this.openForm();
  }

  openForm(row?: RsyncTaskUi): void {
    this.slideIn.open(RsyncTaskFormComponent, { wide: true, data: row })
      .onSuccess(() => this.reload(), this.destroyRef);
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

  private transformRsyncTasks(rsyncTasks: RsyncTaskUi[]): RsyncTaskUi[] {
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
      }

      return task;
    });
  }

  protected onChangeEnabledState(rsyncTask: RsyncTaskUi): void {
    this.api
      .call('rsynctask.update', [rsyncTask.id, { enabled: !rsyncTask.enabled }])
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

  private updateRowStateAndJob(row: RsyncTaskUi, state: JobState, job: Job | null): void {
    this.jobs.repaintRow(row.id, (task) => ({ ...task, state: { state }, job }));
  }
}
