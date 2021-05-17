import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { InputTableConf } from 'app/pages/common/entity/entity-table/entity-table.component';

import { T } from 'app/translate-marker';

@Component({
  selector: 'app-iscsi-initiator-list',
  template: `
    <entity-table [conf]="this" [title]="tableTitle"></entity-table>
  `,
})
export class InitiatorListComponent implements InputTableConf {
  tableTitle = T('Initiators Groups');
  queryCall: 'iscsi.initiator.query' = 'iscsi.initiator.query';
  route_add: string[] = ['sharing', 'iscsi', 'initiators', 'add'];
  route_edit: string[] = ['sharing', 'iscsi', 'initiators', 'edit'];
  wsDelete: 'iscsi.initiator.delete' = 'iscsi.initiator.delete';

  protected route_add_tooltip = 'Add Initiator';

  columns: any[] = [
    {
      name: T('Group ID'),
      prop: 'id',
      always_display: true,
    },
    {
      name: T('Initiators'),
      prop: 'initiators',
    },
    {
      name: T('Authorized Networks'),
      prop: 'auth_network',
    },
    {
      name: T('Description'),
      prop: 'comment',
    },
  ];
  rowIdentifier = 'id';
  config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Initiator',
      key_props: ['id'],
    },
  };

  constructor(protected router: Router) {}
}
