import { Component } from '@angular/core';
import helptext from './../../../../helptext/task-calendar/smart/smart';

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
    { name: helptext.smartlist_column_type, prop: 'type', always_display: true },
    { name: helptext.smartlist_column_description, prop: 'desc' },
    { name: helptext.smartlist_column_schedule, prop: 'schedule' }
  ];
  public rowIdentifier = 'type';
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'S.M.A.R.T. Test',
      key_props: ['type', 'desc']
    },
  };

  resourceTransformIncomingRestData(data: any) {
    for (const test of data) {
      test.schedule = `${test.schedule.hour} ${test.schedule.dom} ${test.schedule.month} ${test.schedule.dow}`;
    }
    return data;
  }
}
