import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import {
  EMPTY, catchError, filter, map, switchMap, tap,
} from 'rxjs';
import { JobState } from 'app/enums/job-state.enum';
import { formatDistanceToNowShortened } from 'app/helpers/format-distance-to-now-shortened';
import { tapOnce } from 'app/helpers/operators/tap-once.operator';
import helptext_cloudsync from 'app/helptext/data-protection/cloudsync/cloudsync-form';
import { CloudSyncTask, CloudSyncTaskUi } from 'app/interfaces/cloud-sync-task.interface';
import { Job } from 'app/interfaces/job.interface';
import { AsyncDataProvider } from 'app/modules/ix-table2/async-data-provider';
import { stateButtonColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-state-button/ix-cell-state-button.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { Column, ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { selectJob } from 'app/modules/jobs/store/job.selectors';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { CloudsyncFormComponent } from 'app/pages/data-protection/cloudsync/cloudsync-form/cloudsync-form.component';
import { CloudsyncRestoreDialogComponent } from 'app/pages/data-protection/cloudsync/cloudsync-restore-dialog/cloudsync-restore-dialog.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { TaskService } from 'app/services/task.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';

@UntilDestroy()
@Component({
  templateUrl: './cloudsync-list.component.html',
  styleUrls: ['./cloudsync-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CloudsyncListComponent implements OnInit {
  cloudSyncTasks: CloudSyncTaskUi[] = [];
  filterString = '';
  dataProvider: AsyncDataProvider<CloudSyncTaskUi>;
  readonly jobState = JobState;

  columns = createTable<CloudSyncTaskUi>('cloudsync-list', [
    textColumn({
      title: this.translate.instant('Description'),
      propertyName: 'description',
    }),
    textColumn({
      title: this.translate.instant('Credential'),
      propertyName: 'credential',
      hidden: true,
      getValue: (task) => task.credentials.name,
    }),
    textColumn({
      title: this.translate.instant('Direction'),
      propertyName: 'direction',
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Transfer Mode'),
      propertyName: 'transfer_mode',
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Path'),
      propertyName: 'path',
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Schedule'),
      propertyName: 'schedule',
      hidden: true,
      getValue: (task) => (task.enabled ? scheduleToCrontab(task.schedule) : this.translate.instant('Disabled')),
    }),
    textColumn({
      title: this.translate.instant('Frequency'),
      propertyName: 'frequency',
      getValue: (task) => this.taskService.getTaskCronDescription(scheduleToCrontab(task.schedule)),
    }),
    textColumn({
      title: this.translate.instant('Next Run'),
      propertyName: 'next_run',
      hidden: true,
      getValue: (task) => (task.enabled
        ? this.taskService.getTaskNextRun(scheduleToCrontab(task.schedule))
        : this.translate.instant('Disabled')),
    }),
    textColumn({
      title: this.translate.instant('Last Run'),
      propertyName: 'last_run',
      hidden: true,
      getValue: (task) => {
        if (task.job?.time_finished?.$date) {
          return formatDistanceToNowShortened(task.job?.time_finished?.$date);
        }
        return this.translate.instant('N/A');
      },
    }),
    stateButtonColumn({
      title: this.translate.instant('State'),
      getValue: (row) => row.state.state,
      getJob: (row) => row.job,
      cssClass: 'state-button',
    }),
    textColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
      getValue: (task) => (task.enabled ? this.translate.instant('Yes') : this.translate.instant('No')),
    }),
  ]);

  get hiddenColumns(): Column<CloudSyncTaskUi, ColumnComponent<CloudSyncTaskUi>>[] {
    return this.columns.filter((column) => column?.hidden);
  }

  constructor(
    private cdr: ChangeDetectorRef,
    private ws: WebSocketService,
    private translate: TranslateService,
    private taskService: TaskService,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    private slideInService: IxSlideInService,
    private matDialog: MatDialog,
    private snackbar: SnackbarService,
    private store$: Store<AppState>,
    protected emptyService: EmptyService,
  ) {}

  ngOnInit(): void {
    const cloudSyncTasks$ = this.ws.call('cloudsync.query').pipe(
      map((cloudSyncTasks) => this.transformCloudSyncData(cloudSyncTasks)),
      tap((cloudSyncTasks) => this.cloudSyncTasks = cloudSyncTasks),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider<CloudSyncTaskUi>(cloudSyncTasks$);
  }

  getCloudSyncTasks(): void {
    this.dataProvider.refresh();
  }

  runNow(row: CloudSyncTaskUi): void {
    this.dialogService.confirm({
      title: this.translate.instant('Run Now'),
      message: this.translate.instant('Run «{name}» Cloud Sync now?', { name: row.description }),
      hideCheckbox: true,
    }).pipe(
      filter(Boolean),
      tap(() => row.state = { state: JobState.Running }),
      switchMap(() => this.ws.job('cloudsync.sync', [row.id])),
      tapOnce(() => this.snackbar.success(
        this.translate.instant('Cloud Sync «{name}» has started.', { name: row.description }),
      )),
      catchError((error: Job) => {
        this.getCloudSyncTasks();
        this.dialogService.error(this.errorHandler.parseJobError(error));
        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe((job: Job) => {
      row.state = { state: job.state };
      row.job = job;
      this.cdr.markForCheck();
    });
  }

  stopCloudSyncTask(row: CloudSyncTaskUi): void {
    this.dialogService
      .confirm({
        title: this.translate.instant('Stop'),
        message: this.translate.instant('Stop this Cloud Sync?'),
        hideCheckbox: true,
      })
      .pipe(
        filter(Boolean),
        switchMap(() => {
          return this.ws.call('cloudsync.abort', [row.id]).pipe(
            this.errorHandler.catchError(),
          );
        }),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.dialogService.info(
          this.translate.instant('Task Stopped'),
          this.translate.instant('Cloud Sync «{name}» stopped.', { name: row.description }),
          true,
        );
        row.state = { state: JobState.Aborted };
        row.job = null;
        this.cdr.markForCheck();
      });
  }

  dryRun(row: CloudSyncTaskUi): void {
    this.dialogService.confirm({
      title: helptext_cloudsync.dry_run_title,
      message: helptext_cloudsync.dry_run_dialog,
      hideCheckbox: true,
    }).pipe(
      filter(Boolean),
      switchMap(() => this.ws.job('cloudsync.sync', [row.id, { dry_run: true }])),
      tapOnce(() => this.snackbar.success(
        this.translate.instant('Cloud Sync «{name}» has started.', { name: row.description }),
      )),
      catchError((error: Job) => {
        this.dialogService.error(this.errorHandler.parseJobError(error));
        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe((job: Job) => {
      row.state = { state: job.state };
      row.job = job;
      this.cdr.markForCheck();
    });
  }

  restore(row: CloudSyncTaskUi): void {
    const dialog = this.matDialog.open(CloudsyncRestoreDialogComponent, {
      data: row.id,
    });
    dialog.afterClosed().pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => this.getCloudSyncTasks());
  }

  openForm(row?: CloudSyncTaskUi): void {
    const slideInRef = this.slideInService.open(CloudsyncFormComponent, { data: row, wide: true });

    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.getCloudSyncTasks();
    });
  }

  doDelete(row: CloudSyncTaskUi): void {
    this.dialogService.confirm({
      title: this.translate.instant('Confirmation'),
      message: this.translate.instant('Delete Cloud Sync Task <b>"{name}"</b>?', {
        name: row.description,
      }),
    }).pipe(
      filter(Boolean),
      switchMap(() => this.ws.call('cloudsync.delete', [row.id])),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.getCloudSyncTasks();
      },
      error: (err) => {
        this.dialogService.error(this.errorHandler.parseError(err));
      },
    });
  }

  onListFiltered(query: string): void {
    this.filterString = query.toLowerCase();
    this.dataProvider.setRows(this.cloudSyncTasks.filter((cloudSync) => {
      return cloudSync.description.includes(this.filterString);
    }));
  }

  columnsChange(columns: typeof this.columns): void {
    this.columns = [...columns];
    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }

  private transformCloudSyncData(tasks: CloudSyncTask[]): CloudSyncTaskUi[] {
    return tasks.map((task: CloudSyncTask) => {
      const transformed = { ...task } as CloudSyncTaskUi;

      if (task.job === null) {
        transformed.state = { state: transformed.locked ? JobState.Locked : JobState.Pending };
      } else {
        transformed.state = { state: task.job.state };
        this.store$.select(selectJob(task.job.id)).pipe(filter(Boolean), untilDestroyed(this))
          .subscribe((job: Job) => {
            transformed.job = { ...job };
            transformed.state = { state: job.state };
            this.cdr.markForCheck();
          });
      }

      return transformed;
    });
  }
}
