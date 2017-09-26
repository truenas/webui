import { RestService } from '../../../../services';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector : 'app-cron-list',
  template : `<entity-table [conf]="this"></entity-table>`
})
export class CronListComponent {

  protected resource_name = 'tasks/cronjob';
  protected route_add: string[] = [ 'cron', 'add' ];
  protected route_add_tooltip = "Add Cron Job";
  protected entityList: any;

 

  public columns: Array<any> = [
    {name : 'Users', prop : 'cron_user'},
    {name : 'Command', prop : 'cron_command'},
    {name : 'Description', prop : 'cron_description'},
    {name : 'Minute', prop : 'cron_minute'},
    {name: 'Hour', prop: 'cron_hour'},
    {name: 'Day of Month', prop: 'cron_daymonth'},
    {name: 'Month', prop: 'cron_month'},
    {name: 'Day of Week', prop: 'cron_dayweek'},
    {name: 'Redirect Stdout', prop: 'cron_stdout'},
    {name: 'Redirect Stderr', prop: 'cron_stderr'},
    {name: 'Enabled', prop: 'cron_enabled'},
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
  };

  constructor(protected router: Router, protected rest: RestService) {}
  
}
