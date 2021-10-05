import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';

@Component({
  selector: 'app-iscsi-initiator-list',
  template: `
    <entity-table [conf]="this" [title]="tableTitle"></entity-table>
  `,
})
export class InitiatorListComponent implements EntityTableConfig {
  tableTitle = T('Initiators Groups');
  queryCall: 'iscsi.initiator.query' = 'iscsi.initiator.query';
  route_add: string[] = ['sharing', 'iscsi', 'initiators', 'add'];
  route_edit: string[] = ['sharing', 'iscsi', 'initiators', 'edit'];
  wsDelete: 'iscsi.initiator.delete' = 'iscsi.initiator.delete';

  route_add_tooltip = 'Add Initiator';

  columns = [
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
  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Initiator',
      key_props: ['id'],
    },
  };

  constructor(protected router: Router) {}
}
