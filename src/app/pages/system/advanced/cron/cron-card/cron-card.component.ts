import {
  ChangeDetectionStrategy, Component, OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  filter, map, switchMap, tap,
} from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { helptextSystemAdvanced } from 'app/helptext/system/advanced';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { relativeDateColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-relative-date/ix-cell-relative-date.component';
import { scheduleColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-schedule/ix-cell-schedule.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { yesNoColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-yes-no/ix-cell-yes-no.component';
import { createTable } from 'app/modules/ix-table/utils';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { cronCardElements } from 'app/pages/system/advanced/cron/cron-card/cron-card.elements';
import { CronDeleteDialogComponent } from 'app/pages/system/advanced/cron/cron-delete-dialog/cron-delete-dialog.component';
import { CronFormComponent } from 'app/pages/system/advanced/cron/cron-form/cron-form.component';
import { CronjobRow } from 'app/pages/system/advanced/cron/cron-list/cronjob-row.interface';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';
import { TaskService } from 'app/services/task.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-cron-card',
  templateUrl: './cron-card.component.html',
  styleUrls: ['./cron-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CronCardComponent implements OnInit {
  readonly requiredRoles = [Role.FullAdmin];
  protected readonly searchableElements = cronCardElements;

  title = helptextSystemAdvanced.fieldset_cron;
  cronjobs: CronjobRow[] = [];
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
    scheduleColumn({
      title: this.translate.instant('Schedule'),
      propertyName: 'schedule',
    }),
    yesNoColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
    }),
    relativeDateColumn({
      title: this.translate.instant('Next Run'),
      getValue: (row) => (row.enabled
        ? this.taskService.getTaskNextTime(row.cron_schedule)
        : this.translate.instant('Disabled')),
    }),
    actionsColumn({
      cssClass: 'tight-actions',
      actions: [
        {
          iconName: 'play_arrow',
          tooltip: this.translate.instant('Run job'),
          onClick: (row) => this.runNow(row),
          requiredRoles: this.requiredRoles,
        },
        {
          iconName: 'edit',
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.doEdit(row),
        },
        {
          iconName: 'delete',
          tooltip: this.translate.instant('Delete'),
          onClick: (row) => this.doDelete(row),
          requiredRoles: this.requiredRoles,
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => 'card-cron-' + row.command + '-' + row.user,
    ariaLabels: (row) => [row.command, this.translate.instant('Cron Job')],
  });

  constructor(
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private ws: WebSocketService,
    private dialog: DialogService,
    private taskService: TaskService,
    private matDialog: MatDialog,
    private advancedSettings: AdvancedSettingsService,
    protected emptyService: EmptyService,
    private chainedSlideIns: IxChainedSlideInService,
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

  onAdd(): void {
    this.openForm();
  }

  getCronJobs(): void {
    this.dataProvider.load();
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

  doEdit(row: CronjobRow): void {
    this.openForm(row);
  }

  private openForm(row?: CronjobRow): void {
    this.advancedSettings.showFirstTimeWarningIfNeeded().pipe(
      switchMap(() => this.chainedSlideIns.open(CronFormComponent, false, row)),
      filter((response) => !!response.response),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.getCronJobs();
      },
    });
  }
}
