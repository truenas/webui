import { Component } from '@angular/core';

@Component({
  selector: 'app-snapshot-task-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
})
export class SnapshotListComponent {

  public title = "Periodic Snapshot Tasks";
  protected queryCall = "pool.snapshottask.query";
  protected wsDelete = "pool.snapshottask.delete";
  protected route_add: string[] = ['tasks', 'snapshot', 'add'];
  protected route_add_tooltip = "Add Periodic Snapshot Task";
  protected route_edit: string[] = ['tasks', 'snapshot', 'edit'];

  public columns: Array < any > = [
    { name: 'Pool/Dataset', prop: 'dataset', always_display: true },
    { name: 'Recursive', prop: 'recursive' },
    { name: 'Naming Schema', prop: 'naming_schema' },
    { name: 'Keep snapshot for', prop: 'keepfor', hidden: true },
    { name: 'Legacy', prop: 'legacy', hidden: true },
    { name: 'VMware Sync', prop: 'vmware_sync', hidden: true },
    { name: 'Enabled', prop: 'enabled' },
  ];
  public rowIdentifier = 'dataset';
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Periodic Snapshot Task',
      key_props: ['dataset', 'naming_schema', 'keepfor']
    },
  };

  constructor() {}

  dataHandler(EntityTable: any) {
    for (let i = 0; i < EntityTable.rows.length; i++) {
      EntityTable.rows[i].keepfor = EntityTable.rows[i].lifetime_value + ' ' + EntityTable.rows[i].lifetime_unit + '(S)';
    }
  }
}
