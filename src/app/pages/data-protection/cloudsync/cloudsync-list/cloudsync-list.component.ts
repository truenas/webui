import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, signal,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  EMPTY, catchError, filter, map, switchMap, tap,
} from 'rxjs';
import { cloudSyncTaskEmptyConfig } from 'app/constants/empty-configs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { tapOnce } from 'app/helpers/operators/tap-once.operator';
import { helptextCloudSync } from 'app/helptext/data-protection/cloudsync/cloudsync';
import { CloudSyncTaskUi } from 'app/interfaces/cloud-sync-task.interface';
import { Job } from 'app/interfaces/job.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { relativeDateColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-relative-date/ix-cell-relative-date.component';
import {
  scheduleColumn,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-schedule/ix-cell-schedule.component';
import { stateButtonColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-state-button/ix-cell-state-button.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { yesNoColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-yes-no/ix-cell-yes-no.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableColumnsSelectorComponent } from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import { IxTableDetailsRowComponent } from 'app/modules/ix-table/components/ix-table-details-row/ix-table-details-row.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableDetailsRowDirective } from 'app/modules/ix-table/directives/ix-table-details-row.directive';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import { createTable } from 'app/modules/ix-table/utils';
import { selectJob } from 'app/modules/jobs/store/job.selectors';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { CloudSyncFormComponent } from 'app/pages/data-protection/cloudsync/cloudsync-form/cloudsync-form.component';
import { cloudSyncListElements } from 'app/pages/data-protection/cloudsync/cloudsync-list/cloudsync-list.elements';
import { CloudSyncRestoreDialog } from 'app/pages/data-protection/cloudsync/cloudsync-restore-dialog/cloudsync-restore-dialog.component';
import { CloudSyncWizardComponent } from 'app/pages/data-protection/cloudsync/cloudsync-wizard/cloudsync-wizard.component';
import { CloudSyncDataTransformer } from 'app/pages/data-protection/cloudsync/utils/cloudsync-data-transformer';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { TaskService } from 'app/services/task.service';
import { AppState } from 'app/store';

@UntilDestroy()
@Component({
  selector: 'ix-cloudsync-list',
  templateUrl: './cloudsync-list.component.html',
  styleUrls: ['./cloudsync-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    BasicSearchComponent,
    IxTableColumnsSelectorComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    UiSearchDirective,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTableDetailsRowDirective,
    IxTableDetailsRowComponent,
    IxIconComponent,
    IxTablePagerComponent,
    TranslateModule,
    AsyncPipe,
    EmptyComponent,
  ],
})
export class CloudSyncListComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private taskService = inject(TaskService);
  private slideIn = inject(SlideIn);
  private dialogService = inject(DialogService);
  private errorHandler = inject(ErrorHandlerService);
  private matDialog = inject(MatDialog);
  private snackbar = inject(SnackbarService);
  private store$ = inject<Store<AppState>>(Store);
  protected emptyService = inject(EmptyService);


  protected readonly searchableElements = cloudSyncListElements;
  protected readonly emptyConfig = cloudSyncTaskEmptyConfig;
  protected readonly EmptyType = EmptyType;

  cloudSyncTasks: CloudSyncTaskUi[] = [];
  searchQuery = signal('');
  dataProvider: AsyncDataProvider<CloudSyncTaskUi>;
  readonly jobState = JobState;
  protected readonly requiredRoles = [Role.CloudSyncWrite];

  columns = createTable<CloudSyncTaskUi>([
    textColumn({
      title: this.translate.instant('Description'),
      propertyName: 'description',
    }),
    textColumn({
      title: this.translate.instant('Credential'),
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
    scheduleColumn({
      title: this.translate.instant('Frequency'),
      getValue: (task) => task.schedule,
      propertyName: 'frequency_sort_key',
    }),
    textColumn({
      title: this.translate.instant('Next Run'),
      hidden: true,
      getValue: (task: CloudSyncTaskUi) => {
        // For disabled tasks, show "Disabled" text
        if (!task.enabled) {
          return this.translate.instant('Disabled');
        }
        // For enabled tasks, show the pre-computed relative time string
        return task.next_run;
      },
      propertyName: 'next_run_sort_key',
    }),
    relativeDateColumn({
      title: this.translate.instant('Last Run'),
      hidden: true,
      getValue: (task) => task.job?.time_finished?.$date,
      propertyName: 'last_run_sort_key',
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
  ], {
    uniqueRowTag: (row) => 'cloudsync-task-' + row.description,
    ariaLabels: (row) => [row.description, this.translate.instant('Cloud Sync Task')],
  });

  protected get hiddenColumns(): Column<CloudSyncTaskUi, ColumnComponent<CloudSyncTaskUi>>[] {
    return this.columns.filter((column) => column?.hidden);
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
    );
    this.dataProvider = new AsyncDataProvider<CloudSyncTaskUi>(cloudSyncTasks$);
    this.getCloudSyncTasks();
    this.dataProvider.emptyType$.pipe(untilDestroyed(this)).subscribe(() => {
      this.onListFiltered(this.searchQuery());
    });
  }

  protected getCloudSyncTasks(): void {
    this.dataProvider.load();
  }

  protected runNow(row: CloudSyncTaskUi): void {
    this.dialogService.confirm({
      title: this.translate.instant('Run Now'),
      message: this.translate.instant('Run «{name}» Cloud Sync now?', { name: row.description }),
      hideCheckbox: true,
    }).pipe(
      filter(Boolean),
      tap(() => this.updateRowStateAndJob(row, JobState.Running, row.job)),
      switchMap(() => this.api.job('cloudsync.sync', [row.id])),
      tapOnce(() => this.snackbar.success(
        this.translate.instant('Cloud Sync «{name}» has started.', { name: row.description }),
      )),
      catchError((error: unknown) => {
        this.getCloudSyncTasks();
        this.errorHandler.showErrorModal(error);
        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe((job: Job) => {
      this.updateRowStateAndJob(row, job.state, job);
      this.cdr.markForCheck();
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
        untilDestroyed(this),
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
        this.translate.instant('Cloud Sync «{name}» has started.', { name: row.description }),
      )),
      catchError((error: unknown) => {
        this.getCloudSyncTasks();
        this.errorHandler.showErrorModal(error);
        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe((job: Job) => {
      this.updateRowStateAndJob(row, job.state, job);
      this.cdr.markForCheck();
    });
  }

  protected restore(row: CloudSyncTaskUi): void {
    this.matDialog.open(CloudSyncRestoreDialog, { data: row.id })
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.snackbar.success(
          this.translate.instant('Cloud Sync «{name}» has been restored.', { name: row.description }),
        );
        this.getCloudSyncTasks();
      });
  }

  protected openForm(row?: CloudSyncTaskUi): void {
    if (row) {
      this.slideIn.open(CloudSyncFormComponent, { data: row, wide: true }).pipe(
        filter((response) => !!response.response),
        untilDestroyed(this),
      ).subscribe({
        next: () => {
          this.getCloudSyncTasks();
        },
      });
    } else {
      this.slideIn.open(CloudSyncWizardComponent, { wide: true }).pipe(
        filter((response) => !!response.response),
        untilDestroyed(this),
      ).subscribe({
        next: () => {
          this.getCloudSyncTasks();
        },
      });
    }
  }

  protected doDelete(row: CloudSyncTaskUi): void {
    this.dialogService.confirm({
      message: this.translate.instant('Delete Cloud Sync Task <b>"{name}"</b>?', {
        name: row.description,
      }),
      buttonColor: 'warn',
      buttonText: this.translate.instant('Delete'),
    }).pipe(
      filter(Boolean),
      switchMap(() => this.api.call('cloudsync.delete', [row.id])),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.snackbar.success(
          this.translate.instant('Cloud Sync «{name}» has been deleted.', { name: row.description }),
        );
        this.getCloudSyncTasks();
      },
      error: (error: unknown) => {
        this.errorHandler.showErrorModal(error);
      },
    });
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.dataProvider.setFilter({ query, columnKeys: ['description'] });
  }

  protected columnsChange(columns: typeof this.columns): void {
    this.columns = [...columns];
    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }

  private setupJobSubscriptions(cloudSyncTasks: CloudSyncTaskUi[]): void {
    cloudSyncTasks.forEach((transformed) => {
      if (transformed.job) {
        this.store$.select(selectJob(transformed.job.id)).pipe(filter(Boolean), untilDestroyed(this))
          .subscribe((job: Job) => {
            transformed.job = { ...job };
            transformed.state = { state: job.state };
            this.cdr.markForCheck();
          });
      }
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
