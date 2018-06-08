import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RestService, WebSocketService } from '../../../../services/';

@Component({
  selector: 'app-alertservice-list',
  template: `<entity-table [title]="title"  [conf]="this"></entity-table>`
})
export class AlertServiceListComponent {

  public title = "Alert Services";
  protected route_add_tooltip = "Add Alert Service";
  protected queryCall = 'alertservice.query';
  protected wsDelete = 'alertservice.delete';
  protected route_success: string[] = ['system', 'alertservice'];
  protected route_add: string[] = ['system', 'alertservice','add'];
  protected route_edit: string[] = ['system', 'alertservice','edit'];

  public columns: Array<any> = [
    { name: 'Service Name', prop: 'name' },
    { name: 'Type', prop: 'type'},
    { name: 'Enabled', prop: 'enabled' },
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
  };

  constructor(protected router: Router, protected aroute: ActivatedRoute) { }

}
