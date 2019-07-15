import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { RestService } from '../../../../services/';
import helptext from '../../../../helptext/directoryservice/kerberoskeytabs-form-list';

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
    { name: 'Name', prop: 'keytab_name', always_display: true },
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: helptext.kkt_list_delmsg_title,
      key_props: helptext.kkt_list_delmsgkey_props
    },
  };

  constructor(protected rest: RestService, private router: Router) {}

  afterInit(entityList: any) {
    this.entityList = entityList;
  }

  getActions(parentRow) {
    return [{
      id: helptext.kkt_list_actions_delete_id,
      label: helptext.kkt_list_actions_delete_label,
      onClick: (row) => {
        this.entityList.doDelete(row);
      }
    }]
  }
}
