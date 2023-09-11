import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, from, map, switchMap } from 'rxjs';
import { helptextSystemAdvanced } from 'app/helptext/system/advanced';
import { Cronjob } from 'app/interfaces/cronjob.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';
import { scheduleColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-schedule/ix-cell-schedule.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { yesNoColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-yesno/ix-cell-yesno.component';
import { createTable } from 'app/modules/ix-table2/utils';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { CronDeleteDialogComponent } from 'app/pages/system/advanced/cron/cron-delete-dialog/cron-delete-dialog.component';
import { CronFormComponent } from 'app/pages/system/advanced/cron/cron-form/cron-form.component';
import { CronjobRow } from 'app/pages/system/advanced/cron/cron-list/cronjob-row.interface';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
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
  title = helptextSystemAdvanced.fieldset_cron;
  cronjobs: CronjobRow[] = [];
  dataProvider = new ArrayDataProvider<CronjobRow>();

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
    textColumn({
      propertyName: 'id',
    }),
  ]);

  isLoading = false;

  constructor(
    private slideInService: IxSlideInService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private ws: WebSocketService,
    private dialog: DialogService,
    private taskService: TaskService,
    private cdr: ChangeDetectorRef,
    private matDialog: MatDialog,
    private advancedSettings: AdvancedSettingsService,
  ) {}

  ngOnInit(): void {
    this.getCronJobs();
  }

  onAdd(): void {
    this.openForm();
  }

  getCronJobs(): void {
    this.isLoading = true;
    this.ws.call('cronjob.query').pipe(
      map((cronjobs) => {
        return cronjobs.map((job: Cronjob): CronjobRow => ({
          ...job,
          cron_schedule: scheduleToCrontab(job.schedule),
          next_run: this.taskService.getTaskNextRun(scheduleToCrontab(job.schedule)),
        }));
      }),
      this.errorHandler.catchError(),
      untilDestroyed(this),
    ).subscribe((cronjobs) => {
      this.cronjobs = cronjobs;
      this.dataProvider.setRows(cronjobs);
      this.isLoading = false;
      this.cdr.markForCheck();
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
      error: (error: WebsocketError) => this.dialog.error(this.errorHandler.parseWsError(error)),
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
    from(this.advancedSettings.showFirstTimeWarningIfNeeded()).pipe(
      switchMap(() => this.slideInService.open(CronFormComponent, { data: row }).slideInClosed$),
      filter(Boolean),
      untilDestroyed(this),
    )
      .subscribe(() => {
        this.getCronJobs();
      });
  }
}
