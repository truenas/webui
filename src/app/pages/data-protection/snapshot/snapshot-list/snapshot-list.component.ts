import { Component } from '@angular/core';

import { EntityUtils } from 'app/pages/common/entity/utils';
import { DialogService, StorageService, WebSocketService } from 'app/services';
import { TaskService } from 'app/services/task.service';
import { T } from 'app/translate-marker';
import { ModalService } from 'app/services/modal.service';
import { SnapshotFormComponent } from 'app/pages/data-protection/snapshot/snapshot-form/snapshot-form.component';
import { EntityJobState } from 'app/enums/entity-job-state.enum';

@Component({
  selector: 'app-snapshot-task-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
  providers: [TaskService, StorageService],
})
export class SnapshotListComponent {
  public title = T('Periodic Snapshot Tasks');
  protected queryCall = 'pool.snapshottask.query';
  protected wsDelete = 'pool.snapshottask.delete';
  protected route_add: string[] = ['tasks', 'snapshot', 'add'];
  protected route_add_tooltip = 'Add Periodic Snapshot Task';
  protected route_edit: string[] = ['tasks', 'snapshot', 'edit'];
  public asyncView = true;

  public columns: Array<any> = [
    { name: T('Pool/Dataset'), prop: 'dataset', always_display: true },
    { name: T('Recursive'), prop: 'recursive' },
    { name: T('Naming Schema'), prop: 'naming_schema' },
    { name: T('Keep snapshot for'), prop: 'keepfor', hidden: true },
    { name: T('Legacy'), prop: 'legacy', hidden: true },
    { name: T('VMware Sync'), prop: 'vmware_sync', hidden: true },
    { name: T('Enabled'), prop: 'enabled', selectable: true },
    { name: T('State'), prop: 'state', state: 'state', button: true },
  ];
  public rowIdentifier = 'id';
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: T('Periodic Snapshot Task'),
      key_props: ['dataset', 'naming_schema', 'keepfor'],
    },
  };

  constructor(
    private dialogService: DialogService,
    private ws: WebSocketService,
    private taskService: TaskService,
    private modalService: ModalService,
    private storageService: StorageService,
    private dialog: DialogService,
  ) {}

  dataHandler(table: any) {
    for (let i = 0; i < table.rows.length; i++) {
      table.rows[i].keepfor = `${table.rows[i].lifetime_value} ${table.rows[i].lifetime_unit}(S)`;
    }
  }

  onButtonClick(row: any) {
    this.stateButton(row);
  }

  stateButton(row) {
    if (row.state.state === EntityJobState.Error) {
      this.dialogService.errorReport(row.state.state, row.state.error);
    }
  }

  onCheckboxChange(row) {
    row.enabled = !row.enabled;
    this.ws.call('pool.snapshottask.update', [row.id, { enabled: row.enabled }]).subscribe(
      (res) => {
        if (!res) {
          row.enabled = !row.enabled;
        }
      },
      (err) => {
        row.enabled = !row.enabled;
        new EntityUtils().handleWSError(this, err, this.dialogService);
      },
    );
  }

  doAdd(id?: number) {
    this.modalService.open(
      'slide-in-form',
      new SnapshotFormComponent(this.taskService, this.storageService, this.dialog, this.modalService),
      id,
    );
  }

  doEdit(id: number) {
    this.doAdd(id);
  }
}
