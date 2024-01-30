import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import {
  filter, switchMap, tap,
} from 'rxjs';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { tapOnce } from 'app/helpers/operators/tap-once.operator';
import { Job } from 'app/interfaces/job.interface';
import { ReplicationTask } from 'app/interfaces/replication-task.interface';
import { AsyncDataProvider } from 'app/modules/ix-table2/classes/async-data-provider/async-data-provider';
import { relativeDateColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-relative-date/ix-cell-relative-date.component';
import { stateButtonColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-state-button/ix-cell-state-button.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { yesNoColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-yesno/ix-cell-yesno.component';
import { Column, ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ReplicationFormComponent } from 'app/pages/data-protection/replication/replication-form/replication-form.component';
import { ReplicationRestoreDialogComponent } from 'app/pages/data-protection/replication/replication-restore-dialog/replication-restore-dialog.component';
import { ReplicationWizardComponent } from 'app/pages/data-protection/replication/replication-wizard/replication-wizard.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { StorageService } from 'app/services/storage.service';
import { TaskService } from 'app/services/task.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';

@UntilDestroy()
@Component({
  templateUrl: './replication-list.component.html',
  styleUrls: ['./replication-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplicationListComponent implements OnInit {
  replicationTasks: ReplicationTask[] = [];
  filterString = '';
  dataProvider: AsyncDataProvider<ReplicationTask>;
  readonly jobState = JobState;
  readonly requiresRoles = [Role.ReplicationTaskWrite, Role.ReplicationTaskWritePull];

  columns = createTable<ReplicationTask>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
    }),
    textColumn({
      title: this.translate.instant('Direction'),
      propertyName: 'direction',
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Transport'),
      propertyName: 'transport',
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('SSH Connection'),
      propertyName: 'ssh_credentials',
      hidden: true,
      getValue: (task) => {
        return task.ssh_credentials ? task.ssh_credentials.name : '-';
      },
    }),
    textColumn({
      title: this.translate.instant('Source Dataset'),
      propertyName: 'source_datasets',
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Target Dataset'),
      propertyName: 'target_dataset',
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Recursive'),
      propertyName: 'recursive',
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Auto'),
      propertyName: 'auto',
      hidden: true,
    }),
    relativeDateColumn({
      title: this.translate.instant('Last Run'),
      propertyName: 'job',
      hidden: true,
      getValue: (row) => row.job?.time_finished?.$date,
    }),
    stateButtonColumn({
      title: this.translate.instant('State'),
      getValue: (row) => row.state.state,
      getJob: (row) => row.job,
      cssClass: 'state-button',
    }),
    yesNoColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
    }),
    textColumn({
      title: this.translate.instant('Last Snapshot'),
      propertyName: 'schedule',
      hidden: true,
      getValue: (task) => {
        return task.state.last_snapshot
          ? task.state.last_snapshot
          : this.translate.instant('No snapshots sent yet');
      },
    }),
  ], {
    rowTestId: (row) => 'replication-task-' + row.name,
  });

  get hiddenColumns(): Column<ReplicationTask, ColumnComponent<ReplicationTask>>[] {
    return this.columns.filter((column) => column?.hidden);
  }

  constructor(
    private cdr: ChangeDetectorRef,
    private ws: WebSocketService,
    private translate: TranslateService,
    private taskService: TaskService,
    private chainedSlideInService: IxChainedSlideInService,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    private slideInService: IxSlideInService,
    private matDialog: MatDialog,
    private snackbar: SnackbarService,
    private store$: Store<AppState>,
    private actions$: Actions,
    private storage: StorageService,
    private loader: AppLoaderService,
    protected emptyService: EmptyService,
  ) {}

  ngOnInit(): void {
    const replicationTasks$ = this.ws.call('replication.query', [[], {
      extra: {
        check_dataset_encryption_keys: true,
      },
    }]).pipe(
      tap((replicationTasks) => this.replicationTasks = replicationTasks),
    );
    this.dataProvider = new AsyncDataProvider<ReplicationTask>(replicationTasks$);
    this.getReplicationTasks();
  }

  getReplicationTasks(): void {
    this.dataProvider.load();
  }

  runNow(row: ReplicationTask): void {
    this.dialogService.confirm({
      title: this.translate.instant('Run Now'),
      message: this.translate.instant('Replicate «{name}» now?', { name: row.name }),
      hideCheckbox: true,
    }).pipe(
      filter(Boolean),
      tap(() => row.state = { state: JobState.Running }),
      switchMap(() => this.ws.job('replication.run', [row.id])),
      tapOnce(() => this.snackbar.success(
        this.translate.instant('Replication «{name}» has started.', { name: row.name }),
      )),
      untilDestroyed(this),
    ).subscribe({
      next: (job: Job) => {
        row.state = { state: job.state };
        row.job = { ...job };
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.dialogService.error(this.errorHandler.parseError(error));
      },
    });
  }

  restore(row: ReplicationTask): void {
    const dialog = this.matDialog.open(ReplicationRestoreDialogComponent, {
      data: row.id,
    });
    dialog.afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.getReplicationTasks());
  }

  openForm(row?: ReplicationTask): void {
    if (row) {
      this.chainedSlideInService.pushComponent(ReplicationFormComponent, true, row)
        .pipe(
          filter((response) => !!response.response),
          untilDestroyed(this),
        ).subscribe({
          next: () => {
            this.getReplicationTasks();
          },
        });
    } else {
      this.chainedSlideInService.pushComponent(ReplicationWizardComponent, true)
        .pipe(
          filter((response) => !!response.response),
          untilDestroyed(this),
        ).subscribe(() => this.getReplicationTasks());
    }
  }

  doDelete(row: ReplicationTask): void {
    this.dialogService.confirm({
      title: this.translate.instant('Confirmation'),
      message: this.translate.instant('Delete Replication Task <b>"{name}"</b>?', {
        name: row.name,
      }),
    }).pipe(
      filter(Boolean),
      switchMap(() => this.ws.call('replication.delete', [row.id])),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.getReplicationTasks();
      },
      error: (err) => {
        this.dialogService.error(this.errorHandler.parseError(err));
      },
    });
  }

  onListFiltered(query: string): void {
    this.filterString = query.toLowerCase();
    this.dataProvider.setRows(this.replicationTasks.filter((task) => {
      return task.name.includes(this.filterString);
    }));
  }

  columnsChange(columns: typeof this.columns): void {
    this.columns = [...columns];
    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }

  downloadKeys(row: ReplicationTask): void {
    this.loader.open();
    this.ws.call('core.download', ['pool.dataset.export_keys_for_replication', [row.id], `${row.name}_encryption_keys.json`])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: ([, url]) => {
          this.loader.close();
          const mimetype = 'application/json';
          this.storage.streamDownloadFile(url, `${row.name}_encryption_keys.json`, mimetype).pipe(untilDestroyed(this)).subscribe({
            next: (file) => {
              this.storage.downloadBlob(file, `${row.name}_encryption_keys.json`);
            },
            error: (err: HttpErrorResponse) => {
              this.dialogService.error(this.errorHandler.parseHttpError(err));
            },
          });
        },
        error: (err) => {
          this.loader.close();
          this.dialogService.error(this.errorHandler.parseError(err));
        },
      });
  }

  private transformData(tasks: ReplicationTask[]): ReplicationTask[] {
    return tasks.map((task: ReplicationTask) => {
      return {
        ...task,
        task_last_snapshot:
          task.state.last_snapshot ? task.state.last_snapshot : this.translate.instant('No snapshots sent yet'),
      } as ReplicationTask;
    });
  }
}
