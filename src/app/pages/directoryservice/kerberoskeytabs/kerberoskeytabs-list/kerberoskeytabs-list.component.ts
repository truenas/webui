import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { RestService } from '../../../../services/';

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
  };

  constructor(protected rest: RestService, private router: Router) {}

  afterInit(entityList: any) {
    this.entityList = entityList;
  }

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
