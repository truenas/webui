import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, switchMap, tap } from 'rxjs';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { formatDistanceToNowShortened } from 'app/helpers/format-distance-to-now-shortened';
import { Job } from 'app/interfaces/job.interface';
import { ReplicationTask } from 'app/interfaces/replication-task.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import {
  stateButtonColumn,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-state-button/ix-cell-state-button.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import {
  toggleColumn,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-toggle/ix-cell-toggle.component';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/table-column.interface';
import { createTable } from 'app/modules/ix-table/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  ReplicationFormComponent,
} from 'app/pages/data-protection/replication/replication-form/replication-form.component';
import { replicationListElements } from 'app/pages/data-protection/replication/replication-list/replication-list.elements';
import {
  ReplicationRestoreDialogComponent,
} from 'app/pages/data-protection/replication/replication-restore-dialog/replication-restore-dialog.component';
import {
  ReplicationWizardComponent,
} from 'app/pages/data-protection/replication/replication-wizard/replication-wizard.component';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

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
  readonly requiredRoles = [Role.ReplicationTaskWrite, Role.ReplicationTaskWritePull];
  protected readonly searchableElements = replicationListElements;

  columns = createTable<ReplicationTask>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
      sortable: true,
    }),
    textColumn({
      title: this.translate.instant('Direction'),
      propertyName: 'direction',
    }),
    textColumn({
      title: this.translate.instant('Transport'),
      propertyName: 'transport',
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('SSH Connection'),
      hidden: true,
      propertyName: 'ssh_credentials',
      getValue: (task) => {
        return task.ssh_credentials
          ? task.ssh_credentials.name
          : this.translate.instant('N/A');
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
    textColumn({
      title: this.translate.instant('Last Run'),
      getValue: (row) => {
        if (row.state?.datetime?.$date) {
          return formatDistanceToNowShortened(row.state?.datetime?.$date);
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
    toggleColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
      onRowToggle: (row) => this.onChangeEnabledState(row),
      requiredRoles: this.requiredRoles,
    }),
    textColumn({
      title: this.translate.instant('Last Snapshot'),
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
    private chainedSlideInService: IxChainedSlideInService,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    private matDialog: MatDialog,
    private snackbar: SnackbarService,
    private download: DownloadService,
    private appLoader: AppLoaderService,
    protected emptyService: EmptyService,
  ) {}

  ngOnInit(): void {
    const replicationTasks$ = this.ws.call('replication.query', [[], {
      extra: {
        check_dataset_encryption_keys: true,
      },
    }]).pipe(tap((replicationTasks) => this.replicationTasks = replicationTasks));
    this.dataProvider = new AsyncDataProvider<ReplicationTask>(replicationTasks$);
    this.getReplicationTasks();
    this.dataProvider.emptyType$.pipe(untilDestroyed(this)).subscribe(() => {
      this.onListFiltered(this.filterString);
    });
  }

  setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 1,
      direction: SortDirection.Asc,
      propertyName: 'name',
    });
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
      tap(() => this.updateRowStateAndJob(row, JobState.Running, row.job)),
      switchMap(() => this.ws.job('replication.run', [row.id])),
      untilDestroyed(this),
    ).subscribe({
      next: (job: Job) => {
        row.state = { state: job.state };
        row.job = { ...job };
        this.snackbar.success(this.translate.instant('Replication «{name}» has started.', { name: row.name }));
        this.updateRowStateAndJob(row, job.state, job);
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.dialogService.error(this.errorHandler.parseError(error));
        this.getReplicationTasks();
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
      this.chainedSlideInService.open(ReplicationFormComponent, true, row)
        .pipe(
          filter((response) => !!response.response),
          untilDestroyed(this),
        ).subscribe({
          next: () => {
            this.getReplicationTasks();
          },
        });
    } else {
      this.chainedSlideInService.open(ReplicationWizardComponent, true)
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
      switchMap(() => this.ws.call('replication.delete', [row.id]).pipe(this.appLoader.withLoader())),
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
      return task.name.toLowerCase().includes(this.filterString);
    }));
  }

  columnsChange(columns: typeof this.columns): void {
    this.columns = [...columns];
    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }

  downloadKeys(row: ReplicationTask): void {
    const fileName = `${row.name}_encryption_keys.json`;
    this.ws.call('core.download', ['pool.dataset.export_keys_for_replication', [row.id], fileName])
      .pipe(this.appLoader.withLoader(), untilDestroyed(this))
      .subscribe({
        next: ([, url]) => {
          const mimetype = 'application/json';
          this.download.streamDownloadFile(url, fileName, mimetype).pipe(untilDestroyed(this)).subscribe({
            next: (file) => {
              this.download.downloadBlob(file, fileName);
            },
            error: (err: HttpErrorResponse) => {
              this.dialogService.error(this.errorHandler.parseHttpError(err));
            },
          });
        },
        error: (err) => {
          this.dialogService.error(this.errorHandler.parseError(err));
        },
      });
  }

  private onChangeEnabledState(replicationTask: ReplicationTask): void {
    this.ws
      .call('replication.update', [replicationTask.id, { enabled: !replicationTask.enabled }])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.getReplicationTasks();
        },
        error: (err: unknown) => {
          this.getReplicationTasks();
          this.dialogService.error(this.errorHandler.parseError(err));
        },
      });
  }

  private updateRowStateAndJob(row: ReplicationTask, state: JobState, job: Job): void {
    this.dataProvider.setRows(this.replicationTasks.map((task) => {
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
