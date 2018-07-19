import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { RestService } from '../../../../services';

@Component({
  selector: 'app-kerberos-keytabs-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class KerberosKeytabsListComponent {

  public title = "Kerberos Keytabs";
  protected resource_name: string = 'directoryservice/kerberoskeytab';
  protected route_add: string[] = ['directoryservice', 'kerberoskeytabs', 'add'];
  protected route_add_tooltip: string = "Add Kerberos Keytab";
  protected route_edit: string[] = ['directoryservice', 'kerberoskeytabs', 'edit'];
  protected entityList: any;

  public columns: Array < any > = [
    { name: 'Name', prop: 'keytab_name' },
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    multiSelect: true
  };

  constructor(protected rest: RestService, private router: Router) {}

  afterInit(entityList: any) {
    this.entityList = entityList;
  }

  public multiActions: Array <any> = [];

  public singleActions: Array <any> = [
    {
      label : "Delete",
      id: "delete",
      icon: "delete",
      ttpos: "above",
      enable: true,
      onClick : (selected) => {
        this.entityList.doDelete(selected[0].id );
      }
    }
  ];

  getActions(parentRow) {
    return [{
      id: "delete",
      label: "Delete",
      onClick: (row) => {
        this.entityList.doDelete(row.id);
      }
    }]
  }
}
