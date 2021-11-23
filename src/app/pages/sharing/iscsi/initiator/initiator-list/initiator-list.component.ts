import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';

@Component({
  selector: 'app-iscsi-initiator-list',
  template: `
    <entity-table [conf]="this" [title]="tableTitle"></entity-table>
  `,
})
export class InitiatorListComponent implements EntityTableConfig {
  tableTitle = this.translate.instant('Initiators Groups');
  queryCall = 'iscsi.initiator.query' as const;
  routeAdd: string[] = ['sharing', 'iscsi', 'initiators', 'add'];
  routeEdit: string[] = ['sharing', 'iscsi', 'initiators', 'edit'];
  wsDelete = 'iscsi.initiator.delete' as const;

  routeAddTooltip = this.translate.instant('Add Initiator');

  columns = [
    {
      name: this.translate.instant('Group ID'),
      prop: 'id',
      always_display: true,
    },
    {
      name: this.translate.instant('Initiators'),
      prop: 'initiators',
    },
    {
      name: this.translate.instant('Authorized Networks'),
      prop: 'auth_network',
    },
    {
      name: this.translate.instant('Description'),
      prop: 'comment',
    },
  ];
  rowIdentifier = 'id';
  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: this.translate.instant('Initiator'),
      key_props: ['id'],
    },
  };

  constructor(
    protected router: Router,
    protected translate: TranslateService,
  ) {}
}
