import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { T } from '../../../../translate-marker';
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
  protected entityList: any;

  public columns: Array<any> = [
    { name: 'Service Name', prop: 'name' },
    { name: 'Type', prop: 'type'},
    { name: 'Enabled', prop: 'enabled' },
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    multiSelect: true
  };

  constructor(protected router: Router, protected aroute: ActivatedRoute) { }

  afterInit(entityList: any) { this.entityList = entityList; }

  public multiActions: Array < any > = [
    // {
    //   id: "mdelete",
    //   label: "Delete",
    //   icon: "delete",
    //   enable: true,
    //   ttpos: "above",
    //   onClick: (selected) => {
    //     this.entityList.doMultiDelete(selected);
    //   }
    // } multidelete not available in the middleware
  ];

  public singleActions: Array < any > = [
    {
      label : T("Edit"),
      id: "edit",
      icon: "create",
      ttpos: "above",
      enable: true,
      onClick : (selected) => {
        console.log(selected)
        this.router.navigate(new Array('/').concat(
          ['system', 'alertservice', 'edit', selected[0].id]));
      }
    },
    {
      label : T("Delete"),
      id: "delete",
      icon: "delete",
      ttpos: "above",
      enable: true,
      onClick : (selected) => {
        this.entityList.doDelete(selected[0].id );
      }
    }
  ];

}
