import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { T } from "app/translate-marker";

@Component({
  selector : 'app-iscsi-initiator-list',
  template : `
    <entity-table [conf]="this"></entity-table>
  `
})
export class InitiatorListComponent {

  protected queryCall = 'iscsi.initiator.query';
  protected route_add: string[] = [ 'sharing', 'iscsi', 'initiators', 'add' ];
  protected route_add_tooltip: string = "Add Initiator";
  protected route_edit: string[] = [ 'sharing', 'iscsi', 'initiators', 'edit' ];
  protected wsDelete = 'iscsi.initiator.delete';

  public columns: Array<any> = [
    {
      name : T('Group ID'),
      prop : 'id',
      always_display: true
    },
    {
      name : T('Initiators'),
      prop : 'initiators',
    },
    {
      name : T('Authorized Networks'),
      prop : 'auth_network',
    },
    {
      name : T('Description'),
      prop : 'comment',
    },
  ];
  public rowIdentifier = 'id';
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
    deleteMsg: {
      title: 'Initiator',
      key_props: ['id']
    },
  };

  constructor(protected router: Router) {}

}
