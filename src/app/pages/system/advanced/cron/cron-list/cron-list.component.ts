import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, switchMap } from 'rxjs/operators';
import { Cronjob } from 'app/interfaces/cronjob.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import {
  EntityTableAction,
  EntityTableConfig,
  EntityTableConfigConfig,
} from 'app/pages/common/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { CronjobRow } from 'app/pages/system/advanced/cron/cron-list/cronjob-row.interface';
import { DialogService, TaskService, WebSocketService } from 'app/services';
import { ModalService } from 'app/services/modal.service';
import { UserService } from 'app/services/user.service';
import { CronFormComponent } from '../cron-form/cron-form.component';

@UntilDestroy()
@Component({
  selector: 'app-cron-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
  providers: [TaskService, UserService],
})
export class CronListComponent implements EntityTableConfig<CronjobRow> {
  title = 'Cron Jobs';
  wsDelete = 'cronjob.delete' as const;
  queryCall = 'cronjob.query' as const;
  routeAdd: string[] = ['tasks', 'cron', 'add'];
  routeAddTooltip = this.translate.instant('Add Cron Job');
  routeEdit: string[] = ['tasks', 'cron', 'edit'];
  entityList: EntityTableComponent;

  columns = [
    { name: this.translate.instant('Users'), prop: 'user', always_display: true },
    { name: this.translate.instant('Command'), prop: 'command' },
    { name: this.translate.instant('Description'), prop: 'description' },
    {
      name: this.translate.instant('Schedule'),
      prop: 'cron_schedule',
      widget: { icon: 'calendar-range', component: 'TaskScheduleListComponent' },
    },
    { name: this.translate.instant('Enabled'), prop: 'enabled' },
    { name: this.translate.instant('Next Run'), prop: 'next_run', hidden: true },
    { name: this.translate.instant('Minute'), prop: 'schedule.minute', hidden: true },
    { name: this.translate.instant('Hour'), prop: 'schedule.hour', hidden: true },
    { name: this.translate.instant('Day of Month'), prop: 'schedule.dom', hidden: true },
    { name: this.translate.instant('Month'), prop: 'schedule.month', hidden: true },
    { name: this.translate.instant('Day of Week'), prop: 'schedule.dow', hidden: true },
    { name: this.translate.instant('Hide Stdout'), prop: 'stdout', hidden: true },
    { name: this.translate.instant('Hide Stderr'), prop: 'stderr', hidden: true },
  ];
  rowIdentifier = 'user';
  config: EntityTableConfigConfig = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Cron Job',
      key_props: ['user', 'command', 'description'],
    },
  };

  constructor(
    public router: Router,
    protected ws: WebSocketService,
    public translate: TranslateService,
    protected taskService: TaskService,
    public dialog: DialogService,
    public modalService: ModalService,
    public userService: UserService,
  ) {}

  afterInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;

    this.modalService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      this.entityList.loaderOpen = true;
      this.entityList.needRefreshTable = true;
      this.entityList.getData();
    });
  }

  doAdd(id?: number): void {
    this.modalService.openInSlideIn(CronFormComponent, id);
  }

  doEdit(id: number): void {
    this.doAdd(id);
  }

  getActions(tableRow: CronjobRow): EntityTableAction[] {
    return [
      {
        name: this.config.name,
        label: this.translate.instant('Run Now'),
        id: 'run',
        icon: 'play_arrow',
        onClick: (row: CronjobRow) => {
          return this.dialog
            .confirm({
              title: this.translate.instant('Run Now'),
              message: this.translate.instant('Run this job now?'),
              hideCheckBox: true,
            })
            .pipe(
              filter((run) => !!run),
              switchMap(() => this.ws.call('cronjob.run', [row.id])),
            )
            .pipe(untilDestroyed(this)).subscribe(
              () => {
                const message = row.enabled
                  ? this.translate.instant('This job is scheduled to run again {nextRun}.', { nextRun: row.next_run })
                  : this.translate.instant('This job will not run again until it is enabled.');
                this.dialog.info(
                  this.translate.instant('Job {job} Completed Successfully', { job: row.description }),
                  message,
                  '500px',
                  'info',
                  true,
                );
              },
              (err: WebsocketError) => new EntityUtils().handleError(this, err),
            );
        },
      },
      {
        name: this.config.name,
        label: this.translate.instant('Edit'),
        icon: 'edit',
        id: 'edit',
        onClick: (row: CronjobRow) => this.doEdit(row.id),
      },
      {
        id: tableRow.id,
        name: this.config.name,
        icon: 'delete',
        label: this.translate.instant('Delete'),
        onClick: (row: CronjobRow) => {
          this.entityList.doDelete(row);
        },
      },
    ] as EntityTableAction[];
  }

  resourceTransformIncomingRestData(data: Cronjob[]): CronjobRow[] {
    return data.map((job) => {
      const cronSchedule = `${job.schedule.minute} ${job.schedule.hour} ${job.schedule.dom} ${job.schedule.month} ${job.schedule.dow}`;

      return {
        ...job,
        cron_schedule: cronSchedule,
        next_run: this.taskService.getTaskNextRun(cronSchedule),
      };
    });
  }
}
