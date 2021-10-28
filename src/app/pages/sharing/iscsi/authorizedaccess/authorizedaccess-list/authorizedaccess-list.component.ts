import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';

@Component({
  selector: 'app-iscsi-authorizedaccess-list',
  template: `
    <entity-table [conf]="this" [title]="tableTitle"></entity-table>
  `,
})
export class AuthorizedAccessListComponent implements EntityTableConfig {
  tableTitle = this.translate.instant('Authorized Access');
  queryCall = 'iscsi.auth.query' as const;
  wsDelete = 'iscsi.auth.delete' as const;
  route_add: string[] = ['sharing', 'iscsi', 'auth', 'add'];
  route_edit: string[] = ['sharing', 'iscsi', 'auth', 'edit'];
  route_add_tooltip = this.translate.instant('Add Authorized Access');

  columns = [
    {
      name: this.translate.instant('Group ID'),
      prop: 'tag',
      always_display: true,
    },
    {
      name: this.translate.instant('User'),
      prop: 'user',
    },
    {
      name: this.translate.instant('Peer User'),
      prop: 'peeruser',
    },
  ];
  rowIdentifier = 'tag';
  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: this.translate.instant('Authorized Access'),
      key_props: ['tag'],
    },
  };

  constructor(
    protected router: Router,
    protected translate: TranslateService,
  ) {}
}
