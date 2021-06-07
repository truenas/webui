import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, switchMap } from 'rxjs/operators';
import { EntityTableAction, EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { DialogService, TaskService, WebSocketService } from 'app/services';
import { ModalService } from 'app/services/modal.service';
import { UserService } from 'app/services/user.service';
import { T } from 'app/translate-marker';
import { CronFormComponent } from '../cron-form/cron-form.component';

@UntilDestroy()
@Component({
  selector: 'app-cron-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
  providers: [TaskService, UserService],
})
export class CronListComponent implements EntityTableConfig {
  title = 'Cron Jobs';
  wsDelete: 'cronjob.delete' = 'cronjob.delete';
  queryCall: 'cronjob.query' = 'cronjob.query';
  route_add: string[] = ['tasks', 'cron', 'add'];
  protected route_add_tooltip = 'Add Cron Job';
  route_edit: string[] = ['tasks', 'cron', 'edit'];
  entityList: any;

  columns = [
    { name: T('Users'), prop: 'user', always_display: true },
    { name: T('Command'), prop: 'command' },
    { name: T('Description'), prop: 'description' },
    {
      name: T('Schedule'),
      prop: 'cron_schedule',
      widget: { icon: 'calendar-range', component: 'TaskScheduleListComponent' },
    },
    { name: T('Enabled'), prop: 'enabled' },
    { name: T('Next Run'), prop: 'next_run', hidden: true },
    { name: T('Minute'), prop: 'schedule.minute', hidden: true },
    { name: T('Hour'), prop: 'schedule.hour', hidden: true },
    { name: T('Day of Month'), prop: 'schedule.dom', hidden: true },
    { name: T('Month'), prop: 'schedule.month', hidden: true },
    { name: T('Day of Week'), prop: 'schedule.dow', hidden: true },
    { name: T('Hide Stdout'), prop: 'stdout', hidden: true },
    { name: T('Hide Stderr'), prop: 'stderr', hidden: true },
  ];
  rowIdentifier = 'user';
  config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Cron Job',
      key_props: ['user', 'command', 'description'],
    },
  };

  protected month_choice: any;
  constructor(
    public router: Router,
    protected ws: WebSocketService,
    public translate: TranslateService,
    protected taskService: TaskService,
    public dialog: DialogService,
    public modalService: ModalService,
    public userService: UserService,
  ) {}

  afterInit(entityList: any): void {
    this.entityList = entityList;

    this.modalService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      this.entityList.loaderOpen = true;
      this.entityList.needRefreshTable = true;
      this.entityList.getData();
    });
  }

  doAdd(id?: number): void {
    this.modalService.open('slide-in-form', new CronFormComponent(this.userService, this.modalService), id);
  }

  doEdit(id: number): void {
    this.doAdd(id);
  }

  getActions(tableRow: any): EntityTableAction[] {
    return [
      {
        name: this.config.name,
        label: T('Run Now'),
        id: 'run',
        icon: 'play_arrow',
        onClick: (row: any) =>
          this.dialog
            .confirm(T('Run Now'), T('Run this job now?'), true)
            .pipe(
              filter((run) => !!run),
              switchMap(() => this.ws.call('cronjob.run', [row.id])),
            )
            .pipe(untilDestroyed(this)).subscribe(
              () => {
                const message = row.enabled == true
                  ? T('This job is scheduled to run again ' + row.next_run + '.')
                  : T('This job will not run again until it is enabled.');
                this.dialog.Info(
                  T('Job ' + row.description + ' Completed Successfully'),
                  message,
                  '500px',
                  'info',
                  true,
                );
              },
              (err: any) => new EntityUtils().handleError(this, err),
            ),
      },
      {
        name: this.config.name,
        label: T('Edit'),
        icon: 'edit',
        id: 'edit',
        onClick: (row: any) => this.doEdit(row.id),
      },
      {
        id: tableRow.id,
        name: this.config.name,
        icon: 'delete',
        label: T('Delete'),
        onClick: (row: any) => {
          this.entityList.doDelete(row);
        },
      },
    ] as EntityTableAction[];
  }

  resourceTransformIncomingRestData(data: any[]): any[] {
    for (const job of data) {
      job.cron_schedule = `${job.schedule.minute} ${job.schedule.hour} ${job.schedule.dom} ${job.schedule.month} ${job.schedule.dow}`;
      job.next_run = this.taskService.getTaskNextRun(job.cron_schedule);
    }
    return data;
  }
}
