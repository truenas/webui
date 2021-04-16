import { Component } from '@angular/core';
import { Router } from '@angular/router';
import helptext from '../../../../helptext/directoryservice/kerberoskeytabs-form-list';

@Component({
  selector: 'app-kerberos-keytabs-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class KerberosKeytabsListComponent {
  title = 'Kerberos Keytabs';
  protected queryCall = 'kerberos.keytab.query';
  protected wsDelete = 'kerberos.keytab.delete';
  protected route_add: string[] = ['directoryservice', 'kerberoskeytabs', 'add'];
  protected route_add_tooltip = 'Add Kerberos Keytab';
  protected route_edit: string[] = ['directoryservice', 'kerberoskeytabs', 'edit'];
  protected entityList: any;

  columns: any[] = [
    { name: 'Name', prop: 'name', always_display: true },
  ];
  rowIdentifier = 'name';
  config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: helptext.kkt_list_delmsg_title,
      key_props: helptext.kkt_list_delmsgkey_props,
    },
  };

  constructor(private router: Router) {}

  afterInit(entityList: any) {
    this.entityList = entityList;
  }
}
