import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as cronParser from 'cron-parser';
import { formatDistanceToNowStrict } from 'date-fns';
import { filter, switchMap } from 'rxjs/operators';
import { helptextSystemAdvanced } from 'app/helptext/system/advanced';
import { Cronjob } from 'app/interfaces/cronjob.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { AppTableAction, AppTableConfig } from 'app/modules/entity/table/table.component';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { CronFormComponent } from 'app/pages/system/advanced/cron/cron-form/cron-form.component';
import { CronjobRow } from 'app/pages/system/advanced/cron/cron-list/cronjob-row.interface';
import { DialogService, WebSocketService } from 'app/services';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-cron-card',
  templateUrl: './cron-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CronCardComponent {
  readonly tableConfig: AppTableConfig = {
    title: helptextSystemAdvanced.fieldset_cron,
    titleHref: '/system/cron',
    queryCall: 'cronjob.query',
    deleteCall: 'cronjob.delete',
    deleteMsg: {
      title: this.translate.instant('Cron Job'),
      key_props: ['user', 'command', 'description'],
    },
    getActions: (): AppTableAction<CronjobRow>[] => {
      return [
        {
          name: 'play',
          icon: 'play_arrow',
          matTooltip: this.translate.instant('Run job'),
          onClick: (row: CronjobRow): void => {
            this.dialog
              .confirm({ title: this.translate.instant('Run Now'), message: this.translate.instant('Run this job now?'), hideCheckbox: true })
              .pipe(
                filter((run) => !!run),
                switchMap(() => this.ws.call('cronjob.run', [row.id])),
              )
              .pipe(untilDestroyed(this)).subscribe({
                next: () => {
                  const message = row.enabled
                    ? this.translate.instant('This job is scheduled to run again {nextRun}.', { nextRun: row.next_run })
                    : this.translate.instant('This job will not run again until it is enabled.');
                  this.dialog.info(
                    this.translate.instant('Job {job} Completed Successfully', { job: row.description }),
                    message,
                    true,
                  );
                },
                error: (error: WebsocketError) => this.dialog.error(this.errorHandler.parseWsError(error)),
              });
          },
        },
      ];
    },
    emptyEntityLarge: false,
    dataSourceHelper: this.cronDataSourceHelper,
    columns: [
      { name: this.translate.instant('Users'), prop: 'user' },
      { name: this.translate.instant('Command'), prop: 'command' },
      { name: this.translate.instant('Description'), prop: 'description' },
      { name: this.translate.instant('Schedule'), prop: 'cron_schedule' },
      { name: this.translate.instant('Enabled'), prop: 'enabled' },
      { name: this.translate.instant('Next Run'), prop: 'next_run' },
    ],
    add: async () => {
      await this.advancedSettings.showFirstTimeWarningIfNeeded();

      const slideInRef = this.slideInService.open(CronFormComponent);
      slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => this.tableConfig.tableComponent?.getData());
    },
    edit: async (cron: CronjobRow) => {
      await this.advancedSettings.showFirstTimeWarningIfNeeded();

      const slideInRef = this.slideInService.open(CronFormComponent, { data: cron });
      slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => this.tableConfig.tableComponent?.getData());
    },
  };

  constructor(
    private slideInService: IxSlideInService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private ws: WebSocketService,
    private dialog: DialogService,
    private advancedSettings: AdvancedSettingsService,
  ) {}

  private cronDataSourceHelper(data: Cronjob[]): CronjobRow[] {
    return data.map((job) => {
      const schedule = `${job.schedule.minute} ${job.schedule.hour} ${job.schedule.dom} ${job.schedule.month} ${job.schedule.dow}`;
      return {
        ...job,
        cron_schedule: schedule,

        next_run: formatDistanceToNowStrict(
          cronParser.parseExpression(schedule, { iterator: true }).next().value.toDate(),
          { addSuffix: true },
        ),
      };
    });
  }
}
