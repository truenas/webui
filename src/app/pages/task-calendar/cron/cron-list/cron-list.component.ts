import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { EntityUtils } from 'app/pages/common/entity/utils';
import * as cronParser from 'cron-parser';
import { Moment } from 'moment';
import { filter, switchMap } from 'rxjs/operators';
import { DialogService, RestService } from '../../../../services';
import { TaskService } from '../../../../services/';
import { T } from '../../../../translate-marker';
import { TaskScheduleListComponent } from '../../components/task-schedule-list/task-schedule-list.component';

@Component({
  selector: 'app-cron-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
  providers: [TaskService]
})
export class CronListComponent {

  public title = "Cron Jobs";
  protected resource_name = 'tasks/cronjob';
  protected route_add: string[] = ['tasks', 'cron', 'add'];
  protected route_add_tooltip = "Add Cron Job";
  protected route_edit: string[] = ['tasks', 'cron', 'edit'];
  public entityList: any;

  public columns: Array < any > = [
    { name: T('Users'), prop: 'cron_user', always_display: true },
    { name: T('Command'), prop: 'cron_command' },
    { name: T('Description'), prop: 'cron_description' },
    { name: T('Schedule'), prop: 'cron_schedule', widget: { icon: 'calendar-range', component: 'TaskScheduleListComponent' } },
    { name: T('Enabled'), prop: 'cron_enabled' },
    { name: T('Next Run'), prop: 'cron_next_run', hidden: true },
    { name: T('Minute'), prop: 'cron_minute', hidden: true },
    { name: T('Hour'), prop: 'cron_hour', hidden: true },
    { name: T('Day of Month'), prop: 'cron_daymonth', hidden: true },
    { name: T('Month'), prop: 'cron_month', hidden: true },
    { name: T('Day of Week'), prop: 'cron_dayweek', hidden: true },
    { name: T('Hide Stdout'), prop: 'cron_stdout', hidden: true },
    { name: T('Hide Stderr'), prop: 'cron_stderr', hidden: true }
  ];
  public rowIdentifier = 'cron_user';
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Cron Job',
      key_props: ['cron_user', 'cron_command', 'cron_description']
    },
  };

  protected month_choice: any;
  constructor(public router: Router, public rest: RestService, public translate: TranslateService,
    protected taskService: TaskService, public dialog: DialogService) {}

  afterInit(entityList: any) { this.entityList = entityList; }

  getActions() {
    return [
      {
        name: this.config.name,
        label: T("Run Now"),
        id: "run",
        icon: "play_arrow",
        onClick: row =>
          this.dialog
            .confirm(T("Run Now"), T("Run this cron job now?"), true)
            .pipe(
              filter(run => !!run),
              switchMap(() =>
                this.rest.post(this.resource_name + "/" + row.id + "/run/", {})
              )
            )
            .subscribe(
              res =>
                this.translate.get("close").subscribe(close => {
                  this.entityList.snackBar.open(res.data, close, { duration: 5000 });
                }),
              err => new EntityUtils().handleError(this, err)
            )
      },
      {
        name: this.config.name,
        label: T("Edit"),
        icon: "edit",
        id: "edit",
        onClick: row => this.router.navigate(new Array("/").concat(["tasks", "cron", "edit", row.id]))
      },
      {
        id: "delete",
        name: this.config.name,
        icon: "delete",
        label: T("Delete"),
        onClick: row => this.entityList.doDelete(row)
      }
    ];
  }

  resourceTransformIncomingRestData(data: any): any {
    for (const job of data) {
      job.cron_schedule = `${job.cron_minute} ${job.cron_hour} ${job.cron_daymonth} ${job.cron_month} ${job.cron_dayweek}`;

      /* Weird type assertions are due to a type definition error in the cron-parser library */
      job.cron_next_run = ((cronParser.parseExpression(job.cron_schedule, { iterator: true }).next() as unknown) as {
        value: { _date: Moment };
      }).value._date.fromNow();
    }
    return data;
  }
}
