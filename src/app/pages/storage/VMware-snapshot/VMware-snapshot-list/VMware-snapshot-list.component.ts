import { Component, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { EntityTableAction } from 'app/pages/common/entity/entity-table/entity-table.component';

import { T } from '../../../../translate-marker';

@Component({
  selector: 'vmware-snapshot-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class VMwareSnapshotListComponent {
  title = 'VMware Snapshots';
  protected queryCall = 'vmware.query';
  protected route_add: string[] = ['storage', 'vmware-Snapshots', 'add'];
  protected route_add_tooltip = 'Add VMware Snapshot';
  protected entityList: any;
  protected wsDelete = 'vmware.delete';

  columns: any[] = [
    { name: 'Hostname', prop: 'hostname', always_display: true }, { name: 'Username', prop: 'username' },
    { name: 'filesystem', prop: 'filesystem' }, { name: 'datastore', prop: 'datastore' },
  ];
  rowIdentifier = 'hostname';
  config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'VMware Snapshot',
      key_props: ['hostname', 'filesystem'],
    },
  };

  constructor(private _router: Router, _eRef: ElementRef) {}

  isActionVisible(actionId: string, row: any) {
    if (actionId == 'edit' || actionId == 'add') {
      return false;
    }
    return true;
  }

  getActions(row: any): EntityTableAction[] {
    return [
      {
        id: row.hostname,
        icon: 'delete',
        name: 'delete',
        label: T('Delete'),
        onClick: (row: any) => {
          this.entityList.doDelete(row);
        },
      },
      {
        id: row.hostname,
        icon: 'edit',
        name: 'edit',
        label: T('Edit'),
        onClick: (row: any) => {
          this._router.navigate(new Array('/').concat(
            ['storage', 'vmware-Snapshots', 'edit', row.id],
          ));
        },
      },
    ] as EntityTableAction[];
  }

  afterInit(entityList: any): void {
    this.entityList = entityList;
  }
}
