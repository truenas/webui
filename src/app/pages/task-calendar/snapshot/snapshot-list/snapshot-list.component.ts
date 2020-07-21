import { Component } from '@angular/core';

import { EntityUtils } from 'app/pages/common/entity/utils';
import { DialogService, WebSocketService } from '../../../../services';
import { T } from '../../../../translate-marker';

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
  public asyncView = true;

  public columns: Array < any > = [
    { name: T('Pool/Dataset'), prop: 'dataset', always_display: true },
    { name: T('Recursive'), prop: 'recursive' },
    { name: T('Naming Schema'), prop: 'naming_schema' },
    { name: T('Keep snapshot for'), prop: 'keepfor', hidden: true },
    { name: T('Legacy'), prop: 'legacy', hidden: true },
    { name: T('VMware Sync'), prop: 'vmware_sync', hidden: true },
    { name: T('Enabled'), prop: 'enabled', selectable: true },
    { name: T('State'), prop: 'task_state', state: 'state',},
  ];
  public rowIdentifier = 'id';
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Periodic Snapshot Task',
      key_props: ['dataset', 'naming_schema', 'keepfor']
    },
  };

  constructor(private dialogService: DialogService, private ws: WebSocketService) {}

  resourceTransformIncomingRestData(tasks: any[]): any[] {
    return tasks.map(task => {
        task.task_state = task.state.state;
        return task;
    });
  }

  dataHandler(EntityTable: any) {
    for (let i = 0; i < EntityTable.rows.length; i++) {
      EntityTable.rows[i].keepfor = EntityTable.rows[i].lifetime_value + ' ' + EntityTable.rows[i].lifetime_unit + '(S)';
    }
  }

  stateButton(row) {
    if (row.state.state === 'ERROR') {
      this.dialogService.errorReport(row.state.state, row.state.error);
    }
  }

  onCheckboxChange(row) {
    row.enabled = !row.enabled;
    this.ws.call('pool.snapshottask.update', [row.id, {'enabled': row.enabled}] )
    .subscribe(
      (res) => {
        if (!res) {
          row.enabled = !row.enabled;
        }
      },
      (err) => {
        row.enabled = !row.enabled;
        new EntityUtils().handleWSError(this, err, this.dialogService);
      });
  }
}
