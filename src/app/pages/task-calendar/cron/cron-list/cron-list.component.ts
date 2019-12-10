import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { EntityUtils } from 'app/pages/common/entity/utils';
import * as cronParser from 'cron-parser';
import { Moment } from 'moment';
import { filter, switchMap } from 'rxjs/operators';
import { DialogService } from '../../../../services';
import { TaskService,WebSocketService } from '../../../../services/';
import { T } from '../../../../translate-marker';
import { TaskScheduleListComponent } from '../../components/task-schedule-list/task-schedule-list.component';

@Component({
  selector: 'app-cron-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
  providers: [TaskService]
})
export class CronListComponent {

  public title = "Cron Jobs";
  protected wsDelete = "cronjob.delete";
  public queryCall:string = 'cronjob.query';
  protected route_add: string[] = ['tasks', 'cron', 'add'];
  protected route_add_tooltip = "Add Cron Job";
  protected route_edit: string[] = ['tasks', 'cron', 'edit'];
  public entityList: any;

  public columns: Array < any > = [
    { name: T('Users'), prop: 'user', always_display: true },
    { name: T('Command'), prop: 'command' },
    { name: T('Description'), prop: 'description' },
    { name: T('Schedule'), prop: 'cron_schedule', widget: { icon: 'calendar-range', component: 'TaskScheduleListComponent' } },
    { name: T('Enabled'), prop: 'enabled' },
    { name: T('Next Run'), prop: 'next_run', hidden: true },
    { name: T('Minute'), prop: 'schedule.minute', hidden: true },
    { name: T('Hour'), prop: 'schedule.hour', hidden: true },
    { name: T('Day of Month'), prop: 'schedule.dom', hidden: true },
    { name: T('Month'), prop: 'schedule.month', hidden: true },
    { name: T('Day of Week'), prop: 'schedule.dow', hidden: true },
    { name: T('Hide Stdout'), prop: 'stdout', hidden: true },
    { name: T('Hide Stderr'), prop: 'stderr', hidden: true }
  ];
  public rowIdentifier = 'user';
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Cron Job',
      key_props: ['user', 'command', 'description']
    },
  };

  protected month_choice: any;
  constructor(public router: Router, protected ws:WebSocketService, public translate: TranslateService,
    protected taskService: TaskService, public dialog: DialogService) {}

    afterInit(entityList: any) { this.entityList = entityList; }

      getActions(tableRow) {
        return [
          {
            name: this.config.name,
            label: T("Run Now"),
            id: "run",
            icon: "play_arrow",
            onClick: row =>
            this.dialog.confirm(T("Run Now"), T("Run this job now?"), true)
              .pipe(
                filter(run => !!run),
                switchMap(() =>
                  this.ws.call('cronjob.run',[row.id])
                )
              ).subscribe(
                res => {
                  const message = row.enabled == true ? 'This job is scheduled to run again ' + row.next_run + '.' : ''; 
                  this.dialog.Info(T("Job " + row.description + ' Completed Successfully'), message, '500px', 'info', true);
                },
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
            id: tableRow.id,
            name: this.config.name,
            icon: "delete",
            label: T("Delete"),
            onClick: (row) => {
              //console.log(row);
              this.entityList.doDelete(row);
            }
          }
        ];
      }

      resourceTransformIncomingRestData(data: any): any {
        for (const job of data){

          // Avoid 'N/A' when value should be presented as false
          const keys = Object.keys(job);
          keys.forEach((key, index) => {
            if(job[key].toString() == 'false'){
              job[key] = job[key].toString();
            }
          });

          job.cron_schedule = `${job.schedule.minute} ${job.schedule.hour} ${job.schedule.dom} ${job.schedule.month} ${job.schedule.dow}`;

          /* Weird type assertions are due to a type definition error in the cron-parser library */
          job.next_run = ((cronParser.parseExpression(job.cron_schedule, { iterator: true }).next() as unknown) as {
            value: { _date: Moment };
          }).value._date.fromNow();
        }
        return data;
      }

}
