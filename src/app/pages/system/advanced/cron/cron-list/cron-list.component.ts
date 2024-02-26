import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  filter, map, switchMap, tap,
} from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { formatDistanceToNowShortened } from 'app/helpers/format-distance-to-now-shortened';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { AsyncDataProvider } from 'app/modules/ix-table2/classes/async-data-provider/async-data-provider';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { Column, ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { CronDeleteDialogComponent } from 'app/pages/system/advanced/cron/cron-delete-dialog/cron-delete-dialog.component';
import { CronFormComponent } from 'app/pages/system/advanced/cron/cron-form/cron-form.component';
import { CronjobRow } from 'app/pages/system/advanced/cron/cron-list/cronjob-row.interface';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';
import { TaskService } from 'app/services/task.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './cron-list.component.html',
  styleUrls: ['./cron-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CronListComponent implements OnInit {
  readonly requiredRoles = [Role.FullAdmin];

  cronjobs: CronjobRow[] = [];
  filterString = '';
  dataProvider: AsyncDataProvider<CronjobRow>;
  columns = createTable<CronjobRow>([
    textColumn({
      title: this.translate.instant('Users'),
      propertyName: 'user',
    }),
    textColumn({
      title: this.translate.instant('Command'),
      propertyName: 'command',
    }),
    textColumn({
      title: this.translate.instant('Description'),
      propertyName: 'description',
    }),
    textColumn({
      title: this.translate.instant('Schedule'),
      propertyName: 'schedule',
      getValue: (task) => (task.enabled ? scheduleToCrontab(task.schedule) : this.translate.instant('Disabled')),
    }),
    textColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
      getValue: (task) => (task.enabled ? this.translate.instant('Yes') : this.translate.instant('No')),
    }),
    textColumn({
      title: this.translate.instant('Next Run'),
      hidden: true,
      getValue: (task) => {
        if (task.enabled) {
          return task.schedule
            ? formatDistanceToNowShortened(this.taskService.getTaskNextTime(scheduleToCrontab(task.schedule)))
            : this.translate.instant('N/A');
        }
        return this.translate.instant('Disabled');
      },
    }),
    textColumn({
      title: this.translate.instant('Hide Stdout'),
      propertyName: 'stdout',
      getValue: (task) => (task.stdout ? this.translate.instant('Yes') : this.translate.instant('No')),
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Hide Stderr'),
      propertyName: 'stderr',
      getValue: (task) => (task.stderr ? this.translate.instant('Yes') : this.translate.instant('No')),
      hidden: true,
    }),
  ], {
    rowTestId: (row) => 'cron-' + row.command + '-' + row.description,
  });

  get hiddenColumns(): Column<CronjobRow, ColumnComponent<CronjobRow>>[] {
    return this.columns.filter((column) => column?.hidden);
  }

  constructor(
    private cdr: ChangeDetectorRef,
    private ws: WebSocketService,
    private translate: TranslateService,
    private taskService: TaskService,
    private dialog: DialogService,
    private errorHandler: ErrorHandlerService,
    private chainedSlideIns: IxChainedSlideInService,
    private matDialog: MatDialog,
    protected emptyService: EmptyService,
  ) {}

  ngOnInit(): void {
    const cronjobs$ = this.ws.call('cronjob.query').pipe(
      map((cronjobs) => {
        return cronjobs.map((job): CronjobRow => ({
          ...job,
          cron_schedule: scheduleToCrontab(job.schedule),
          next_run: this.taskService.getTaskNextRun(scheduleToCrontab(job.schedule)),
        }));
      }),
      tap((cronjobs) => this.cronjobs = cronjobs),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider<CronjobRow>(cronjobs$);
    this.getCronJobs();
  }

  getCronJobs(): void {
    this.dataProvider.load();
  }

  doAdd(): void {
    this.chainedSlideIns.pushComponent(CronFormComponent)
      .pipe(filter((response) => !!response.response), untilDestroyed(this))
      .subscribe(() => {
        this.getCronJobs();
      });
  }

  doEdit(row: CronjobRow): void {
    this.chainedSlideIns.pushComponent(CronFormComponent, false, row)
      .pipe(filter((response) => !!response.response), untilDestroyed(this))
      .subscribe(() => {
        this.getCronJobs();
      });
  }

  runNow(row: CronjobRow): void {
    this.dialog.confirm({
      title: this.translate.instant('Run Now'),
      message: this.translate.instant('Run this job now?'),
      hideCheckbox: true,
    }).pipe(
      filter(Boolean),
      switchMap(() => this.ws.call('cronjob.run', [row.id])),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        const message = row.enabled
          ? this.translate.instant('This job is scheduled to run again {nextRun}.', { nextRun: row.next_run })
          : this.translate.instant('This job will not run again until it is enabled.');
        this.dialog.info(
          this.translate.instant('Job {job} Completed Successfully', { job: row.description }),
          message,
        );
      },
      error: (error: unknown) => this.dialog.error(this.errorHandler.parseError(error)),
    });
  }

  doDelete(row: CronjobRow): void {
    this.matDialog.open(CronDeleteDialogComponent, {
      data: row,
    }).afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.getCronJobs();
      });
  }

  onListFiltered(query: string): void {
    this.filterString = query.toLowerCase();
    this.dataProvider.setRows(this.cronjobs.filter((cronjob) => {
      return [cronjob.user.toString()].includes(this.filterString);
    }));
  }

  columnsChange(columns: typeof this.columns): void {
    this.columns = [...columns];
    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }
}
