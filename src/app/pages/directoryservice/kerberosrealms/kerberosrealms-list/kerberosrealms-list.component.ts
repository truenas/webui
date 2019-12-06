import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { T } from '../../../../translate-marker';
import helptext from '../../../../helptext/directoryservice/kerberosrealms-form-list';

@Component({
  selector: 'app-user-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class KerberosRealmsListComponent {

  public title = "Kerberos Realms";
  protected queryCall = 'kerberos.realm.query';
  protected wsDelete = 'kerberos.realm.delete';
  protected route_add: string[] = ['directoryservice', 'kerberosrealms', 'add'];
  protected route_add_tooltip: string = "Add Kerberos Realm";
  protected route_edit: string[] = ['directoryservice', 'kerberosrealms', 'edit'];

  public columns: Array < any > = [
    { name: T('Realm'), prop: 'realm', always_display: true },
    { name: T('KDC'), prop: 'kdc' },
    { name: T('Admin Server'), prop: 'admin_server' },
    { name: T('Password Server'), prop: 'kpasswd_server' },
  ];
  public rowIdentifier = 'realm';
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: helptext.krb_realmlist_deletemessage_title,
      key_props: helptext.krb_realmlist_deletemessage_key_props
    },
  };

  constructor(private router: Router){}
}
