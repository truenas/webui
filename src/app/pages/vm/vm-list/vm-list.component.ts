import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { EntityTableAction, InputTableConf } from 'app/pages/common/entity/entity-table/entity-table.component';

import {
  WebSocketService, StorageService, AppLoaderService, DialogService,
} from '../../../services';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import { MatDialog } from '@angular/material/dialog';
import { regexValidator } from 'app/pages/common/entity/entity-form/validators/regex-validation';
import { T } from '../../../translate-marker';
import globalHelptext from '../../../helptext/global-helptext';
import helptext from '../../../helptext/vm/vm-list';
import wizardHelptext from '../../../helptext/vm/vm-wizard/vm-wizard';
import { EntityUtils } from '../../common/entity/utils';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

@Component({
  selector: 'vm-list',
  template: `
    <div class="vm-summary">
        <p *ngIf="availMem"><strong>{{memTitle | translate}}</strong> {{availMem}} - {{memWarning | translate}}</p>
    </div>
    <entity-table [title]='title' [conf]='this'></entity-table>`,
  styleUrls: ['./vm-list.component.css'],
})
export class VMListComponent implements OnDestroy, InputTableConf {
  title = 'Virtual Machines';
  queryCall = 'vm.query';
  wsDelete = 'vm.delete';
  route_add: string[] = ['vm', 'wizard'];
  route_edit: string[] = ['vm', 'edit'];

  autoFillWindowHeight = true;
  protected dialogRef: any;
  private eventSubscription: Subscription;

  entityList: any;
  columns: any[] = [
    { name: T('Name'), prop: 'name', always_display: true },
    {
      name: T('State'), prop: 'state', always_display: true, toggle: true,
    },
    { name: T('Autostart'), prop: 'autostart', selectable: true },
    { name: T('Virtual CPUs'), prop: 'vcpus', hidden: true },
    { name: T('Cores'), prop: 'cores', hidden: true },
    { name: T('Threads'), prop: 'threads', hidden: true },
    { name: T('Memory Size'), prop: 'memory', hidden: true },
    { name: T('Boot Loader Type'), prop: 'bootloader', hidden: true },
    { name: T('System Clock'), prop: 'time', hidden: true },
    { name: T('VNC Port'), prop: 'port', hidden: true },
    { name: T('Com Port'), prop: 'com_port', hidden: true },
    { name: T('Description'), prop: 'description', hidden: true },
    { name: T('Shutdown Timeout'), prop: 'shutdown_timeout', hidden: true },
  ];
  config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Name',
      key_props: ['name'],
    },
  };

  protected wsMethods = {
    start: 'vm.start',
    restart: 'vm.restart',
    stop: 'vm.stop',
    poweroff: 'vm.poweroff',
    update: 'vm.update',
    clone: 'vm.clone',
    getAvailableMemory: 'vm.get_available_memory',
  };

  availMem: string;
  memTitle = wizardHelptext.vm_mem_title;
  memWarning = wizardHelptext.memory_warning;

  constructor(
    private ws: WebSocketService,
    private storageService: StorageService,
    private loader: AppLoaderService,
    private dialogService: DialogService,
    private router: Router, protected dialog: MatDialog,
  ) { }

  afterInit(entityList) {
    this.checkMemory();
    this.entityList = entityList;
    this.eventSubscription = this.ws.subscribe('vm.query').subscribe((event) => {
      const changedRow = this.entityList.rows.find((o) => o.id === event.id);
      if (event.fields.state === 'RUNNING') {
        changedRow.state = 'RUNNING';
        changedRow.status.state = 'RUNNING';
        changedRow.status.domain_state = event.fields.state;
      } else {
        changedRow.state = 'STOPPED';
        changedRow.status.state = 'STOPPED';
        changedRow.status.domain_state = event.fields.state;
      }
    });
  }

  resourceTransformIncomingRestData(vms) {
    for (let vm_index = 0; vm_index < vms.length; vm_index++) {
      vms[vm_index]['state'] = vms[vm_index]['status']['state'];
      vms[vm_index]['com_port'] = `/dev/nmdm${vms[vm_index]['id']}B`;
      vms[vm_index]['shutdown_timeout'] += T(' seconds');
      if (this.checkVnc(vms[vm_index])) {
        vms[vm_index]['port'] = this.vncPort(vms[vm_index]);
      } else {
        vms[vm_index]['port'] = 'N/A';
        if (vms[vm_index]['vm_type'] === 'Container Provider') {
          vms[vm_index]['vm_type'] = globalHelptext.dockerhost;
        }
      }
      vms[vm_index]['memory'] = this.storageService.convertBytestoHumanReadable(vms[vm_index]['memory'] * 1048576, 2);
    }
    return vms;
  }

  checkVnc(vm) {
    const devices = vm.devices;
    if (!devices || devices.length === 0) {
      return false;
    }
    if (vm.bootloader === 'GRUB' || vm.bootloader === 'UEFI_CSM') {
      return false;
    }
    for (let i = 0; i < devices.length; i++) {
      if (devices && devices[i].dtype === 'VNC') {
        return true;
      }
    }
  }

  vncPort(vm) {
    const devices = vm.devices;
    if (!devices || devices.length === 0) {
      return false;
    }
    if (vm.bootloader === 'GRUB' || vm.bootloader === 'UEFI_CSM') {
      return false;
    }
    for (let i = 0; i < devices.length; i++) {
      if (devices && devices[i].dtype === 'VNC') {
        return devices[i].attributes.vnc_port;
      }
    }
  }

  onSliderChange(row) {
    let method;
    if (row['status']['state'] === 'RUNNING') {
      method = this.wsMethods.stop;
      const parent = this;
      const stopDialog: DialogFormConfiguration = {
        title: T('Stop ' + row.name + '?'),
        fieldConfig: [
          {
            type: 'checkbox',
            name: 'force_after_timeout',
            placeholder: T('Force Stop After Timeout'),
            tooltip: T('Force the VM to stop if it has not already \
 stopped within the specified shutdown timeout. Without this option selected, the VM will \
 receive the shutdown signal, but may or may not complete the shutdown process.'),
          },
        ],
        saveButtonText: T('Stop'),
        customSubmit(entityDialog) {
          entityDialog.dialogRef.close(true);
          const forceValue = false; // We are not exposing this in the UI
          const forceValueTimeout = !!entityDialog.formValue.force_after_timeout;
          const params = [row.id, { force: forceValue, force_after_timeout: forceValueTimeout }];
          parent.doRowAction(row, method, params);
        },
      };
      this.dialogService.dialogForm(stopDialog);
    } else {
      method = this.wsMethods.start;
      this.doRowAction(row, method);
    }
  }

  onMemoryError(row) {
    const memoryDialog = this.dialogService.confirm(
      helptext.memory_dialog.title,
      helptext.memory_dialog.message,
      true,
      helptext.memory_dialog.buttonMsg,
      true,
      helptext.memory_dialog.secondaryCheckBoxMsg,
      undefined,
      [{ overcommit: false }],
      helptext.memory_dialog.tooltip,
    );

    memoryDialog.componentInstance.switchSelectionEmitter.subscribe((res) => {
      memoryDialog.componentInstance.isSubmitEnabled = !memoryDialog.componentInstance.isSubmitEnabled;
    });

    memoryDialog.afterClosed().subscribe((dialogRes) => {
      if (dialogRes) {
        this.doRowAction(row, this.wsMethods.start, [row.id, { overcommit: true }]);
      }
    });
  }

  doRowAction(row, method, params = [row.id], updateTable = false) {
    if (method === 'vm.stop') {
      this.dialogRef = this.dialog.open(EntityJobComponent,
        { data: { title: T('Stopping ' + row.name) }, disableClose: false });
      this.dialogRef.componentInstance.setCall(method, [params[0], params[1]]);
      this.dialogRef.componentInstance.submit();
      this.dialogRef.componentInstance.success.subscribe((succ) => {
        if (updateTable) {
          this.entityList.getData();
        } else {
          this.updateRows([row]);
        }
        this.dialogRef.close(false);
        this.dialogService.report(T('Finished'), T('If ' + row.name + T(' is still running, \
 the Guest OS did not respond as expected. It is possible to use <i>Power Off</i> or the <i>Force Stop \
 After Timeout</i> option to stop the VM.')), '450px', 'info', true);
        this.checkMemory();
      });
      this.dialogRef.componentInstance.failure.subscribe((err) => {
        new EntityUtils().handleWSError(this, err, this.dialogService);
      });
    } else {
      this.loader.open();
      this.ws.call(method, params).subscribe(
        (res) => {
          if (updateTable) {
            this.entityList.getData();
            this.loader.close();
          } else {
            this.updateRows([row]).then(() => {
              this.loader.close();
            });
          }
          this.checkMemory();
        },
        (err) => {
          this.loader.close();
          if (method === this.wsMethods.start && err.error === 12) {
            this.onMemoryError(row);
            return;
          } if (method === this.wsMethods.update) {
            row.autostart = !row.autostart;
          }
          new EntityUtils().handleWSError(this, err, this.dialogService);
        },
      );
    }
  }

  updateRows(rows: any[]): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.ws.call(this.queryCall).subscribe(
        (res) => {
          for (const row of rows) {
            const targetIndex = _.findIndex(res, (o) => o['id'] === row.id);
            if (targetIndex === -1) {
              reject(false);
            }
            for (const i in row) {
              row[i] = res[targetIndex][i];
            }
          }
          this.resourceTransformIncomingRestData(rows);
          resolve(true);
        },
        (err) => {
          new EntityUtils().handleWSError(this, err, this.dialogService);
          reject(err);
        },
      );
    });
  }

  onCheckboxChange(row) {
    row.autostart = !row.autostart;
    this.doRowAction(row, this.wsMethods.update, [row.id, { autostart: row.autostart }]);
  }

  getActions(row): EntityTableAction[] {
    return [{
      id: 'START',
      icon: 'play_arrow',
      label: T('Start'),
      onClick: (start_row) => {
        this.onSliderChange(start_row);
      },
    },
    {
      id: 'RESTART',
      icon: 'replay',
      label: T('Restart'),
      onClick: (restart_row) => {
        this.doRowAction(restart_row, this.wsMethods.restart);
      },
    },
    {
      id: 'POWER_OFF',
      icon: 'power_settings_new',
      label: T('Power Off'),
      onClick: (power_off_row) => {
        this.doRowAction(row, this.wsMethods.poweroff, [power_off_row.id]);
      },
    },
    {
      id: 'STOP',
      icon: 'stop',
      label: T('Stop'),
      onClick: (stop_row) => {
        this.onSliderChange(stop_row);
      },
    },
    {
      id: 'EDIT',
      icon: 'edit',
      label: T('Edit'),
      onClick: (edit_row) => {
        this.router.navigate(new Array('').concat(['vm', 'edit', edit_row.id]));
      },
    },
    {
      id: 'DELETE',
      icon: 'delete',
      label: T('Delete'),
      onClick: (delete_row) => {
        const parent = this;
        const conf: DialogFormConfiguration = {
          title: T('Delete Virtual Machine'),
          fieldConfig: [
            {
              type: 'checkbox',
              name: 'zvols',
              placeholder: T('Delete Virtual Machine Data?'),
              value: false,
              tooltip: T('Set to remove the data associated with this \
 Virtual Machine (which will result in data loss if the data is not backed up). Unset to \
 leave the data intact.'),
            },
            {
              type: 'checkbox',
              name: 'force',
              placeholder: T('Force Delete?'),
              value: false,
              tooltip: T('Set to ignore the Virtual \
 Machine status during the delete operation. Unset to prevent deleting \
 the Virtual Machine when it is still active or has an undefined state.'),
            },
            {
              type: 'input',
              name: 'confirm_name',
              placeholder: '',
              maskValue: delete_row.name,
              required: true,
              validation: [regexValidator(new RegExp(delete_row.name))],
              hideErrMsg: true,
            },
          ],
          saveButtonText: T('Delete'),
          customSubmit(entityDialog) {
            entityDialog.dialogRef.close(true);
            const params = [
              delete_row.id,
              {
                zvols: entityDialog.formValue.zvols,
                force: entityDialog.formValue.force,
              },
            ];
            parent.doRowAction(delete_row, parent.wsDelete, params, true);
          },
        };
        this.dialogService.dialogForm(conf);
      },
    },
    {
      id: 'DEVICES',
      icon: 'device_hub',
      label: T('Devices'),
      onClick: (devices_row) => {
        this.router.navigate(new Array('').concat(['vm', devices_row.id, 'devices', devices_row.name]));
      },
    },
    {
      id: 'CLONE',
      icon: 'filter_none',
      label: T('Clone'),
      onClick: (clone_row) => {
        const parent = this;
        const conf: DialogFormConfiguration = {
          title: T('Name'),
          fieldConfig: [
            {
              type: 'input',
              inputType: 'text',
              name: 'name',
              placeholder: T('Enter a Name (optional)'),
              required: false,
            },
          ],
          saveButtonText: T('Clone'),
          customSubmit(entityDialog) {
            entityDialog.dialogRef.close(true);
            const params = [clone_row.id];
            if (entityDialog.formValue.name) {
              params.push(entityDialog.formValue.name);
            }
            parent.doRowAction(clone_row, parent.wsMethods.clone, params, true);
          },
        };
        this.dialogService.dialogForm(conf);
      },
    },
    {
      id: 'VNC',
      icon: 'settings_ethernet',
      label: T('VNC'),
      onClick: (vnc_vm) => {
        const vnc = vnc_vm.devices.find((o) => o.dtype === 'VNC');
        let bind = vnc.attributes.vnc_bind;
        if (bind === '0.0.0.0' || bind === '::') {
          bind = window.location.hostname;
        }
        this.ws.call('vm.get_vnc_web', [vnc_vm.id, bind]).subscribe((res) => {
          for (const vnc_port in res) {
            window.open(res[vnc_port]);
          }
        });
      },
    },
    {
      id: 'SERIAL',
      icon: 'keyboard_arrow_right',
      label: T('Serial Shell'),
      onClick: (vm) => {
        this.router.navigate(new Array('').concat(['vm', 'serial', vm.id]));
      },
    }] as EntityTableAction[];
  }

  isActionVisible(actionId: string, row: any) {
    if (actionId === 'VNC' && (row['status']['state'] !== 'RUNNING' || !this.checkVnc(row))) {
      return false;
    } if ((actionId === 'POWER_OFF' || actionId === 'STOP' || actionId === 'RESTART'
            || actionId === 'SERIAL') && row['status']['state'] !== 'RUNNING') {
      return false;
    } if (actionId === 'START' && row['status']['state'] === 'RUNNING') {
      return false;
    }
    return true;
  }

  checkMemory() {
    this.ws.call(this.wsMethods.getAvailableMemory).subscribe((res) => {
      this.availMem = this.storageService.convertBytestoHumanReadable(res);
    });
  }

  ngOnDestroy() {
    this.eventSubscription.unsubscribe();
  }
}
