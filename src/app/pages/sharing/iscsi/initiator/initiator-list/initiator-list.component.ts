import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';

@Component({
  selector: 'ix-iscsi-initiator-list',
  template: `
    <ix-entity-table [conf]="this" [title]="tableTitle"></ix-entity-table>
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
      emptyText: this.translate.instant('Allow all initiators'),
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
    protected translate: TranslateService,
  ) {}
}
