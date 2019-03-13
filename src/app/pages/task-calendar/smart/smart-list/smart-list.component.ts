import { Component } from '@angular/core';

@Component({
  selector: 'app-smart-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
})
export class SmartListComponent {
  public title = "S.M.A.R.T. Tests";
  public queryCall = "smart.test.query";
  protected route_add: string[] = ['tasks', 'smart', 'add'];
  protected route_add_tooltip = "Add S.M.A.R.T. Test";
  protected route_edit: string[] = ['tasks', 'smart', 'edit'];
  protected wsDelete = "smart.test.delete";

  public columns: Array<any> = [
    { name: 'Type', prop: 'type' },
    { name: 'Short Description', prop: 'desc' },
    { name: 'Hour', prop: 'hour' },
    { name: 'Day of Month', prop: 'dom' },
    { name: 'Month', prop: 'month' },
    { name: 'Day of Week', prop: 'dow' },
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'S.M.A.R.T. Test',
      key_props: ['type', 'desc']
    },
  };

  constructor() { }

  dataHandler(entityList: any) {
    for (let i = 0; i < entityList.rows.length; i++) {
      entityList.rows[i].month = entityList.rows[i].schedule.month;
      entityList.rows[i].dow = entityList.rows[i].schedule.dow;
      entityList.rows[i].dom = entityList.rows[i].schedule.dom;
      entityList.rows[i].hour = entityList.rows[i].schedule.hour;
    }
  }
}
